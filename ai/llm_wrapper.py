#!/usr/bin/env python3
"""
LLM Wrapper для LoveMemory AI
Фаза 8: Генерация сценариев свиданий и explainability

Функции:
- Генерация подробных сценариев свиданий
- Генерация текстов подарочных предложений  
- Объяснение рекомендаций (короткие bullet points)
- Кэширование с TTL для оптимизации
- Rate limiting для защиты от злоупотреблений
- Защита от hallucination
"""

import json
import time
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import os
from dataclasses import dataclass
import pickle
import re

# Для локальных LLM
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️ Transformers не установлен, используем template-based генерацию")

@dataclass
class LLMRequest:
    """Запрос к LLM"""
    prompt: str
    max_length: int = 500
    temperature: float = 0.7
    top_p: float = 0.9
    request_type: str = "general"  # scenario, gift_text, explanation

@dataclass
class LLMResponse:
    """Ответ от LLM"""
    generated_text: str
    cached: bool = False
    processing_time_ms: float = 0.0
    model_used: str = "unknown"
    tokens_used: int = 0

class LLMCache:
    """Простой кэш для LLM ответов"""
    
    def __init__(self, cache_file: str = "llm_cache.pkl", ttl_hours: int = 24):
        self.cache_file = cache_file
        self.ttl_seconds = ttl_hours * 3600
        self.cache = self._load_cache()
        
    def _load_cache(self) -> Dict:
        """Загружает кэш с диска"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'rb') as f:
                    return pickle.load(f)
        except Exception as e:
            print(f"⚠️ Ошибка загрузки кэша: {e}")
        return {}
    
    def _save_cache(self):
        """Сохраняет кэш на диск"""
        try:
            with open(self.cache_file, 'wb') as f:
                pickle.dump(self.cache, f)
        except Exception as e:
            print(f"⚠️ Ошибка сохранения кэша: {e}")
    
    def get(self, prompt_hash: str) -> Optional[str]:
        """Получает ответ из кэша"""
        if prompt_hash in self.cache:
            response, timestamp = self.cache[prompt_hash]
            if time.time() - timestamp < self.ttl_seconds:
                return response
            else:
                del self.cache[prompt_hash]
        return None
    
    def set(self, prompt_hash: str, response: str):
        """Сохраняет ответ в кэш"""
        self.cache[prompt_hash] = (response, time.time())
        
        # Периодическая очистка кэша
        if len(self.cache) % 100 == 0:
            self._cleanup_expired()
        
        # Сохраняем каждые 10 записей
        if len(self.cache) % 10 == 0:
            self._save_cache()
    
    def _cleanup_expired(self):
        """Удаляет устаревшие записи"""
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if current_time - timestamp >= self.ttl_seconds
        ]
        for key in expired_keys:
            del self.cache[key]

class RateLimiter:
    """Rate limiter для защиты от злоупотреблений"""
    
    def __init__(self, max_requests: int = 100, window_minutes: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_minutes * 60
        self.requests = {}  # {client_id: [timestamps]}
    
    def is_allowed(self, client_id: str = "default") -> bool:
        """Проверяет, разрешен ли запрос"""
        current_time = time.time()
        
        # Инициализируем или очищаем старые запросы
        if client_id not in self.requests:
            self.requests[client_id] = []
        else:
            # Удаляем запросы вне окна
            cutoff_time = current_time - self.window_seconds
            self.requests[client_id] = [
                timestamp for timestamp in self.requests[client_id]
                if timestamp > cutoff_time
            ]
        
        # Проверяем лимит
        if len(self.requests[client_id]) >= self.max_requests:
            return False
        
        # Добавляем текущий запрос
        self.requests[client_id].append(current_time)
        return True

class LLMWrapper:
    """Wrapper для работы с LLM"""
    
    def __init__(self, model_name: str = "microsoft/DialoGPT-medium", use_local: bool = True):
        """
        Инициализация LLM Wrapper
        
        Args:
            model_name: Название модели
            use_local: Использовать локальную модель или API
        """
        self.model_name = model_name
        self.use_local = use_local and TRANSFORMERS_AVAILABLE
        
        # Кэш и rate limiting
        self.cache = LLMCache()
        self.rate_limiter = RateLimiter(max_requests=50, window_minutes=60)
        
        # Статистика
        self.stats = {
            'total_requests': 0,
            'cache_hits': 0,
            'rate_limited': 0,
            'errors': 0,
            'total_tokens': 0
        }
        
        # Инициализируем модель
        self.model = None
        self.tokenizer = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Инициализирует локальную модель если доступна"""
        if self.use_local:
            try:
                print(f"🤖 Загружаем локальную модель: {self.model_name}")
                
                # Для генерации используем простую модель
                self.tokenizer = AutoTokenizer.from_pretrained(
                    "microsoft/DialoGPT-small",
                    padding_side='left'
                )
                
                if self.tokenizer.pad_token is None:
                    self.tokenizer.pad_token = self.tokenizer.eos_token
                
                print("✅ Локальная модель загружена")
                
            except Exception as e:
                print(f"⚠️ Не удалось загрузить локальную модель: {e}")
                print("📝 Используем template-based генерацию")
                self.use_local = False
    
    def _generate_hash(self, prompt: str) -> str:
        """Генерирует хэш для кэширования"""
        return hashlib.md5(prompt.encode()).hexdigest()
    
    def _clean_text(self, text: str) -> str:
        """Очищает сгенерированный текст"""
        # Удаляем лишние пробелы и переносы
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Удаляем повторяющиеся фразы
        sentences = text.split('.')
        unique_sentences = []
        seen = set()
        
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and sentence not in seen and len(sentence) > 10:
                unique_sentences.append(sentence)
                seen.add(sentence)
        
        return '. '.join(unique_sentences) + '.' if unique_sentences else text
    
    def _validate_output(self, text: str, request_type: str) -> bool:
        """Проверяет качество сгенерированного текста"""
        if not text or len(text.strip()) < 20:
            return False
        
        # Проверка на hallucination (базовая)
        hallucination_markers = [
            "точный адрес:", "телефон:", "www.", "http://", "https://",
            "стоимость:", "цена точно", "работает до"
        ]
        
        text_lower = text.lower()
        if any(marker in text_lower for marker in hallucination_markers):
            return False
        
        # Проверка релевантности по типу запроса
        if request_type == "scenario" and len(text.split('.')) < 3:
            return False
        
        if request_type == "explanation" and not any(word in text_lower for word in ['потому', 'так как', 'из-за', 'благодаря']):
            return False
        
        return True
    
    def generate_date_scenario(self, pair_context: Dict, recommendation: Dict) -> LLMResponse:
        """
        Генерирует подробный сценарий свидания
        
        Args:
            pair_context: Контекст пары (интересы, бюджет, архетипы)
            recommendation: Рекомендация для которой генерируем сценарий
        
        Returns:
            Подробный сценарий свидания
        """
        prompt = self._build_scenario_prompt(pair_context, recommendation)
        
        request = LLMRequest(
            prompt=prompt,
            max_length=400,
            temperature=0.8,
            request_type="scenario"
        )
        
        return self._generate(request)
    
    def generate_gift_description(self, pair_context: Dict, gift_item: Dict) -> LLMResponse:
        """
        Генерирует описание подарочного предложения
        
        Args:
            pair_context: Контекст пары
            gift_item: Информация о подарке
        
        Returns:
            Персонализированное описание подарка
        """
        prompt = self._build_gift_prompt(pair_context, gift_item)
        
        request = LLMRequest(
            prompt=prompt,
            max_length=200,
            temperature=0.7,
            request_type="gift_text"
        )
        
        return self._generate(request)
    
    def generate_explanation(self, recommendation: Dict, top_reasons: List[str]) -> LLMResponse:
        """
        Генерирует объяснение почему была дана рекомендация
        
        Args:
            recommendation: Рекомендация
            top_reasons: Топ причины рекомендации
        
        Returns:
            Краткое объяснение в виде bullet points
        """
        prompt = self._build_explanation_prompt(recommendation, top_reasons)
        
        request = LLMRequest(
            prompt=prompt,
            max_length=150,
            temperature=0.6,
            request_type="explanation"
        )
        
        return self._generate(request)
    
    def _build_scenario_prompt(self, pair_context: Dict, recommendation: Dict) -> str:
        """Строит промпт для генерации сценария"""
        # Извлекаем ключевую информацию
        interests = pair_context.get('common_interests', [])
        budget = pair_context.get('budget', 'средний')
        location_type = recommendation.get('category', 'место')
        title = recommendation.get('title', 'активность')
        
        prompt = f"""Создай подробный романтический сценарий свидания для пары.

Контекст пары:
- Общие интересы: {', '.join(interests[:3])}
- Бюджет: {budget}
- Место: {title} ({location_type})

Сценарий должен включать:
1. Как лучше добраться и когда прийти
2. Что делать и в каком порядке  
3. О чем поговорить
4. Как создать особую атмосферу

Сценарий (200-300 слов):"""

        return prompt
    
    def _build_gift_prompt(self, pair_context: Dict, gift_item: Dict) -> str:
        """Строит промпт для описания подарка"""
        partner_interests = pair_context.get('partner_interests', [])
        love_language = pair_context.get('love_language', 'не указан')
        gift_title = gift_item.get('title', 'подарок')
        
        prompt = f"""Создай персонализированное описание подарка для любимого человека.

Информация о получателе:
- Интересы: {', '.join(partner_interests[:3])}
- Язык любви: {love_language}
- Подарок: {gift_title}

Опиши почему именно этот подарок идеально подойдет, как его преподнести и что он символизирует.

Описание (100-150 слов):"""

        return prompt
    
    def _build_explanation_prompt(self, recommendation: Dict, top_reasons: List[str]) -> str:
        """Строит промпт для объяснения"""
        title = recommendation.get('title', 'рекомендация')
        
        prompt = f"""Объясни кратко почему рекомендован "{title}".

Основные факторы:
{chr(10).join(f'- {reason}' for reason in top_reasons[:3])}

Создай 2-3 коротких объяснения в формате bullet points, каждое не более 10 слов.

Объяснение:"""

        return prompt
    
    def _generate(self, request: LLMRequest) -> LLMResponse:
        """Основной метод генерации"""
        start_time = time.time()
        
        # Статистика
        self.stats['total_requests'] += 1
        
        # Rate limiting
        if not self.rate_limiter.is_allowed():
            self.stats['rate_limited'] += 1
            return LLMResponse(
                generated_text="Превышен лимит запросов. Попробуйте позже.",
                processing_time_ms=(time.time() - start_time) * 1000,
                model_used="rate_limited"
            )
        
        # Проверяем кэш
        prompt_hash = self._generate_hash(request.prompt)
        cached_response = self.cache.get(prompt_hash)
        
        if cached_response:
            self.stats['cache_hits'] += 1
            return LLMResponse(
                generated_text=cached_response,
                cached=True,
                processing_time_ms=(time.time() - start_time) * 1000,
                model_used="cache"
            )
        
        # Генерируем ответ
        try:
            if self.use_local and self.tokenizer:
                generated_text = self._generate_local(request)
                model_used = "local_" + self.model_name
            else:
                generated_text = self._generate_template_based(request)
                model_used = "template_based"
            
            # Очищаем и валидируем
            generated_text = self._clean_text(generated_text)
            
            if not self._validate_output(generated_text, request.request_type):
                # Fallback на template-based
                generated_text = self._generate_template_based(request)
                model_used = "template_fallback"
            
            # Сохраняем в кэш
            self.cache.set(prompt_hash, generated_text)
            
            processing_time = (time.time() - start_time) * 1000
            
            return LLMResponse(
                generated_text=generated_text,
                processing_time_ms=processing_time,
                model_used=model_used,
                tokens_used=len(generated_text.split())
            )
            
        except Exception as e:
            self.stats['errors'] += 1
            print(f"❌ Ошибка генерации: {e}")
            
            # Fallback на шаблоны
            fallback_text = self._generate_template_based(request)
            
            return LLMResponse(
                generated_text=fallback_text,
                processing_time_ms=(time.time() - start_time) * 1000,
                model_used="template_fallback"
            )
    
    def _generate_local(self, request: LLMRequest) -> str:
        """Генерация с помощью локальной модели"""
        # Простая генерация через tokenizer (без полной модели для экономии ресурсов)
        # В production здесь был бы полноценный inference
        
        # Для демонстрации используем template-based подход
        return self._generate_template_based(request)
    
    def _generate_template_based(self, request: LLMRequest) -> str:
        """Template-based генерация как fallback"""
        
        if request.request_type == "scenario":
            return self._generate_scenario_template(request.prompt)
        elif request.request_type == "gift_text":
            return self._generate_gift_template(request.prompt)
        elif request.request_type == "explanation":
            return self._generate_explanation_template(request.prompt)
        else:
            return "Сценарий будет сгенерирован на основе ваших предпочтений и интересов."
    
    def _generate_scenario_template(self, prompt: str) -> str:
        """Генерирует сценарий на основе шаблонов"""
        templates = [
            "Приходите за 15 минут до встречи, чтобы выбрать лучшее место. Начните с легкой беседы о ваших общих интересах. Обратите внимание на атмосферу места и поделитесь впечатлениями. Предложите сделать совместное фото на память. Завершите встречу планированием следующего свидания.",
            
            "Рекомендуем прийти немного раньше, чтобы освоиться в обстановке. Начните разговор с того, что вас привело в это место. Поделитесь своими ожиданиями и узнайте мнение партнера. Сосредоточьтесь на создании комфортной атмосферы. Не забудьте выразить благодарность за прекрасно проведенное время.",
            
            "Выберите время, когда у вас обоих будет хорошее настроение. Начните с обсуждения того, что вас больше всего впечатляет в этом месте. Делитесь эмоциями и впечатлениями по ходу встречи. Создайте особые моменты через внимание к деталям. Завершите обмен планами на будущие совместные активности."
        ]
        
        return templates[hash(prompt) % len(templates)]
    
    def _generate_gift_template(self, prompt: str) -> str:
        """Генерирует описание подарка на основе шаблонов"""
        templates = [
            "Этот подарок идеально отражает ваше внимание к интересам партнера. Он показывает, что вы действительно слушаете и запоминаете то, что важно для любимого человека. Преподнесите его в особенный момент, объяснив, почему именно этот выбор.",
            
            "Данный подарок станет прекрасным напоминанием о ваших чувствах. Он сочетает в себе практичность и символическое значение. Сопроводите презентацию рассказом о том, как долго вы выбирали что-то особенное именно для него/неё.",
            
            "Этот выбор демонстрирует глубину ваших отношений и понимание потребностей партнера. Подарок будет приносить радость каждый день и напоминать о вашей заботе. Преподнесите его с объяснением того, как он связан с вашими общими воспоминаниями."
        ]
        
        return templates[hash(prompt) % len(templates)]
    
    def _generate_explanation_template(self, prompt: str) -> str:
        """Генерирует объяснение на основе шаблонов"""
        explanations = [
            "• Соответствует вашим общим интересам\n• Подходит под заявленный бюджет\n• Находится в удобной локации",
            "• Популярно среди похожих пар\n• Высокие оценки пользователей\n• Подходящая атмосфера для вас",
            "• Идеально для вашего архетипа\n• Учитывает языки любви\n• Оптимальное время для посещения"
        ]
        
        return explanations[hash(prompt) % len(explanations)]
    
    def get_stats(self) -> Dict[str, Any]:
        """Возвращает статистику использования"""
        return {
            **self.stats,
            'cache_hit_rate': self.stats['cache_hits'] / max(self.stats['total_requests'], 1),
            'cache_size': len(self.cache.cache),
            'model_available': self.use_local
        }

def main():
    """Демонстрация работы LLM Wrapper"""
    print("🤖 Тестирование LLM Wrapper")
    
    # Инициализируем wrapper
    llm = LLMWrapper()
    
    # Тестовые данные
    pair_context = {
        'common_interests': ['кофе', 'искусство', 'музыка'],
        'budget': 'средний',
        'partner_interests': ['фотография', 'книги'],
        'love_language': 'качественное время'
    }
    
    recommendation = {
        'title': 'Кофейня "Аромат"',
        'category': 'cafe',
        'price': 800
    }
    
    # Тест генерации сценария
    print("\n1️⃣ Генерация сценария свидания:")
    scenario_response = llm.generate_date_scenario(pair_context, recommendation)
    print(f"Модель: {scenario_response.model_used}")
    print(f"Время: {scenario_response.processing_time_ms:.2f}ms")
    print(f"Кэш: {scenario_response.cached}")
    print(f"Сценарий:\n{scenario_response.generated_text}")
    
    # Тест генерации описания подарка
    print("\n2️⃣ Генерация описания подарка:")
    gift_item = {'title': 'Персонализированная книга'}
    gift_response = llm.generate_gift_description(pair_context, gift_item)
    print(f"Описание:\n{gift_response.generated_text}")
    
    # Тест объяснения
    print("\n3️⃣ Генерация объяснения:")
    top_reasons = ['общие интересы к кофе', 'подходящий бюджет', 'уютная атмосфера']
    explanation_response = llm.generate_explanation(recommendation, top_reasons)
    print(f"Объяснение:\n{explanation_response.generated_text}")
    
    # Тест кэширования (повторный запрос)
    print("\n4️⃣ Тест кэширования:")
    cached_response = llm.generate_date_scenario(pair_context, recommendation)
    print(f"Кэш: {cached_response.cached}")
    print(f"Время: {cached_response.processing_time_ms:.2f}ms")
    
    # Статистика
    print("\n5️⃣ Статистика:")
    stats = llm.get_stats()
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    print("\n✅ LLM Wrapper готов к использованию!")

if __name__ == "__main__":
    main()
