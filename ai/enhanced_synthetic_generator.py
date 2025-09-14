"""
🚀 Enhanced Synthetic Data Generator для LoveMemory AI
Версия 2.0 с коммерческими улучшениями

Фаза 1: Фундамент — Построение Поведенческого Цифрового Двойника
1.1 ✅ Deep Personality Model (OCEAN - Большая Пятёрка)
1.2 ✅ Dynamic Interest Profile (дрейф интересов + passion scores)
1.3 ✅ Relationship Dynamics Engine (гармония + рутина)

Создает самый проработанный в индустрии симулятор пользовательского поведения
"""

import random
import uuid
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import os
from dataclasses import dataclass

from personality_engine import PersonalityEngine, PersonalityProfile

@dataclass
class DynamicInterest:
    """Динамический интерес с дрейфом"""
    name: str
    intensity: float  # Текущая интенсивность (0-10)
    passion_score: float  # Уровень страсти (0-1) - насколько это ключевое хобби
    decay_rate: float  # Скорость затухания без подкрепления
    discovery_date: datetime  # Когда интерес был открыт
    last_interaction: datetime  # Последнее взаимодействие
    
    def update_intensity(self, interaction_boost: float = 0, days_passed: float = 0):
        """Обновляет интенсивность интереса с учетом времени и взаимодействий"""
        # Естественное затухание со временем
        decay = self.decay_rate * days_passed * 0.01
        self.intensity = max(0, self.intensity - decay)
        
        # Boost от взаимодействия
        if interaction_boost > 0:
            boost = interaction_boost * (1 + self.passion_score)  # Страсть усиливает boost
            self.intensity = min(10, self.intensity + boost)
            self.last_interaction = datetime.now()

@dataclass
class RelationshipState:
    """Состояние отношений пары"""
    harmony_index: float  # Индекс гармонии (0-1) - врожденная совместимость
    routine_index: float  # Индекс рутины (0-1) - накопленная привычность
    adventure_appetite: float  # Аппетит к приключениям (0-1)
    last_novel_experience: datetime  # Последний новый опыт
    shared_memories: List[Dict]  # Список общих воспоминаний
    
    def update_routine(self, activity_novelty: float):
        """Обновляет индекс рутины на основе новизны активности"""
        if activity_novelty > 0.7:  # Новая активность
            self.routine_index = max(0, self.routine_index - 0.1)
            self.last_novel_experience = datetime.now()
            self.adventure_appetite = min(1.0, self.adventure_appetite + 0.05)
        elif activity_novelty < 0.3:  # Повторная активность
            self.routine_index = min(1.0, self.routine_index + 0.05)
            self.adventure_appetite = max(0, self.adventure_appetite - 0.02)

class EnhancedSyntheticGenerator:
    """Улучшенный генератор синтетических данных с commercial-grade реализмом"""
    
    def __init__(self):
        self.personality_engine = PersonalityEngine()
        
        # Расширенный каталог товаров (теперь 75 позиций против 12)
        self.enhanced_product_catalog = self._create_enhanced_catalog()
        
        # Временные паттерны активности
        self.temporal_patterns = {
            'morning': {'weight': 0.15, 'suitable_activities': ['fitness', 'cafe', 'park']},
            'afternoon': {'weight': 0.25, 'suitable_activities': ['museum', 'shopping', 'lunch']},
            'evening': {'weight': 0.45, 'suitable_activities': ['restaurant', 'theater', 'movies']},
            'night': {'weight': 0.15, 'suitable_activities': ['bar', 'club', 'late_cafe']}
        }
        
        # Паттерны интереса (для реалистичного дрейфа)
        self.interest_patterns = {
            'seasonal': ['skiing', 'beach', 'outdoor_sports', 'gardening'],
            'trending': ['new_cuisine', 'latest_movies', 'viral_activities'],
            'stable': ['family_time', 'reading', 'basic_fitness'],
            'social_influenced': ['restaurants', 'events', 'experiences']
        }
    
    def _create_enhanced_catalog(self) -> List[Dict]:
        """Создает расширенный каталог с 75 позициями"""
        catalog = []
        
        # Рестораны (20 позиций) - разные ценовые категории и кухни
        restaurants = [
            # Премиум (3000-5000 руб)
            {'title': 'Ресторан "Черная Икра"', 'category': 'restaurant', 'price': 4500, 'novelty': 0.8,
             'tags': ['Русская кухня', 'Премиум', 'Романтический'], 'love_language': 'quality_time'},
            {'title': 'Мишленовский "Le Bernardin"', 'category': 'restaurant', 'price': 5000, 'novelty': 0.9,
             'tags': ['Французская кухня', 'Мишлен', 'Изысканный'], 'love_language': 'receiving_gifts'},
            {'title': 'Японский "Nobu Moscow"', 'category': 'restaurant', 'price': 4200, 'novelty': 0.7,
             'tags': ['Японская кухня', 'Суши', 'Премиум'], 'love_language': 'quality_time'},
            
            # Средний сегмент (1500-3000 руб)
            {'title': 'Ресторан "Итальянец"', 'category': 'restaurant', 'price': 2500, 'novelty': 0.4,
             'tags': ['Итальянская кухня', 'Романтический'], 'love_language': 'quality_time'},
            {'title': 'Суши-бар "Токио"', 'category': 'restaurant', 'price': 1800, 'novelty': 0.3,
             'tags': ['Японская кухня', 'Свежие продукты'], 'love_language': 'acts_of_service'},
            {'title': 'Стейк-хаус "Мясо"', 'category': 'restaurant', 'price': 2800, 'novelty': 0.2,
             'tags': ['Мясо', 'Гриль'], 'love_language': 'acts_of_service'},
            {'title': 'Грузинский "Тбилиси"', 'category': 'restaurant', 'price': 2000, 'novelty': 0.3,
             'tags': ['Грузинская кухня', 'Хачапури'], 'love_language': 'quality_time'},
            {'title': 'Тайский "Бангкок"', 'category': 'restaurant', 'price': 2200, 'novelty': 0.5,
             'tags': ['Тайская кухня', 'Острый'], 'love_language': 'quality_time'},
            {'title': 'Мексиканский "Текила"', 'category': 'restaurant', 'price': 1700, 'novelty': 0.4,
             'tags': ['Мексиканская кухня', 'Острый'], 'love_language': 'quality_time'},
            {'title': 'Индийский "Бомбей"', 'category': 'restaurant', 'price': 1800, 'novelty': 0.6,
             'tags': ['Индийская кухня', 'Специи'], 'love_language': 'quality_time'},
            
            # Бюджетный сегмент (500-1500 руб)
            {'title': 'Пиццерия "Мама Мия"', 'category': 'restaurant', 'price': 1200, 'novelty': 0.1,
             'tags': ['Пицца', 'Итальянская кухня'], 'love_language': 'quality_time'},
            {'title': 'Ресторан "Грин"', 'category': 'restaurant', 'price': 1600, 'novelty': 0.7,
             'tags': ['Вегетарианский', 'Здоровое питание'], 'love_language': 'acts_of_service'},
            {'title': 'Ресторан "Море"', 'category': 'restaurant', 'price': 2600, 'novelty': 0.3,
             'tags': ['Морепродукты', 'Свежий'], 'love_language': 'acts_of_service'},
            {'title': 'Корейский "Сеул"', 'category': 'restaurant', 'price': 1900, 'novelty': 0.8,
             'tags': ['Корейская кухня', 'K-BBQ'], 'love_language': 'quality_time'},
            {'title': 'Ресторан "Узбекистан"', 'category': 'restaurant', 'price': 1500, 'novelty': 0.3,
             'tags': ['Узбекская кухня', 'Плов'], 'love_language': 'quality_time'},
            {'title': 'Китайский "Пекин"', 'category': 'restaurant', 'price': 1800, 'novelty': 0.4,
             'tags': ['Китайская кухня', 'Утка'], 'love_language': 'quality_time'},
            {'title': 'Ливанский "Бейрут"', 'category': 'restaurant', 'price': 2100, 'novelty': 0.9,
             'tags': ['Ливанская кухня', 'Хумус'], 'love_language': 'quality_time'},
            {'title': 'Бразильский "Рио"', 'category': 'restaurant', 'price': 2400, 'novelty': 0.9,
             'tags': ['Бразильская кухня', 'Шураско'], 'love_language': 'quality_time'},
            {'title': 'Немецкий "Бавария"', 'category': 'restaurant', 'price': 2300, 'novelty': 0.2,
             'tags': ['Немецкая кухня', 'Пиво'], 'love_language': 'quality_time'},
            {'title': 'Армянский "Ереван"', 'category': 'restaurant', 'price': 2100, 'novelty': 0.2,
             'tags': ['Армянская кухня', 'Шашлык'], 'love_language': 'quality_time'},
        ]
        
        # Кафе и бары (15 позиций)
        cafes = [
            {'title': 'Кофейня "Аромат"', 'category': 'cafe', 'price': 500, 'novelty': 0.2,
             'tags': ['Кофе', 'Уютная атмосфера'], 'love_language': 'quality_time'},
            {'title': 'Кафе "Лофт"', 'category': 'cafe', 'price': 700, 'novelty': 0.6,
             'tags': ['Кофе', 'Современный дизайн'], 'love_language': 'quality_time'},
            {'title': 'Кондитерская "Сладость"', 'category': 'cafe', 'price': 600, 'novelty': 0.3,
             'tags': ['Десерты', 'Выпечка'], 'love_language': 'receiving_gifts'},
            {'title': 'Чайная "Восток"', 'category': 'cafe', 'price': 450, 'novelty': 0.4,
             'tags': ['Чай', 'Восточная атмосфера'], 'love_language': 'quality_time'},
            {'title': 'Кафе "Бук"', 'category': 'cafe', 'price': 550, 'novelty': 0.5,
             'tags': ['Кофе', 'Книги'], 'love_language': 'quality_time'},
            {'title': 'Смузи-бар "Фреш"', 'category': 'cafe', 'price': 400, 'novelty': 0.7,
             'tags': ['Смузи', 'Здоровое питание'], 'love_language': 'acts_of_service'},
            {'title': 'Винный бар "Кьянти"', 'category': 'bar', 'price': 1200, 'novelty': 0.6,
             'tags': ['Вино', 'Дегустация'], 'love_language': 'quality_time'},
            {'title': 'Коктейльный бар "Мохито"', 'category': 'bar', 'price': 1500, 'novelty': 0.4,
             'tags': ['Коктейли', 'Атмосфера'], 'love_language': 'quality_time'},
            {'title': 'Кофе-хаус "Эспрессо"', 'category': 'cafe', 'price': 480, 'novelty': 0.3,
             'tags': ['Кофе', 'Качественный'], 'love_language': 'quality_time'},
            {'title': 'Пекарня "Хлеб"', 'category': 'cafe', 'price': 350, 'novelty': 0.2,
             'tags': ['Выпечка', 'Свежий хлеб'], 'love_language': 'acts_of_service'},
            {'title': 'Крафтовая пивоварня "Хмель"', 'category': 'bar', 'price': 900, 'novelty': 0.8,
             'tags': ['Крафтовое пиво', 'Дегустация'], 'love_language': 'quality_time'},
            {'title': 'Молочный бар "Латте"', 'category': 'cafe', 'price': 520, 'novelty': 0.9,
             'tags': ['Молочные коктейли', 'Инстаграм'], 'love_language': 'receiving_gifts'},
            {'title': 'Кофе на колесах "Мобильный"', 'category': 'cafe', 'price': 300, 'novelty': 0.9,
             'tags': ['Кофе', 'Мобильный', 'Быстро'], 'love_language': 'acts_of_service'},
            {'title': 'Чайная церемония "Сэн"', 'category': 'cafe', 'price': 800, 'novelty': 0.9,
             'tags': ['Чайная церемония', 'Япония', 'Медитация'], 'love_language': 'quality_time'},
            {'title': 'Кафе "Крем"', 'category': 'cafe', 'price': 650, 'novelty': 0.2,
             'tags': ['Десерты', 'Мороженое'], 'love_language': 'receiving_gifts'},
        ]
        
        # Развлечения (25 позиций)  
        entertainment = [
            {'title': 'Кинотеатр "Максимум"', 'category': 'entertainment', 'price': 800, 'novelty': 0.3,
             'tags': ['Фильмы', 'Попкорн'], 'love_language': 'quality_time'},
            {'title': 'Квест-комната "Загадка"', 'category': 'entertainment', 'price': 1200, 'novelty': 0.7,
             'tags': ['Квесты', 'Командная работа'], 'love_language': 'quality_time'},
            {'title': 'Боулинг "Страйк"', 'category': 'entertainment', 'price': 1000, 'novelty': 0.2,
             'tags': ['Боулинг', 'Соревнования'], 'love_language': 'quality_time'},
            {'title': 'Караоке "Голос"', 'category': 'entertainment', 'price': 1500, 'novelty': 0.3,
             'tags': ['Караоке', 'Музыка'], 'love_language': 'quality_time'},
            {'title': 'Лазертаг "Космос"', 'category': 'entertainment', 'price': 1100, 'novelty': 0.6,
             'tags': ['Лазертаг', 'Активность'], 'love_language': 'physical_touch'},
            {'title': 'Планетарий', 'category': 'entertainment', 'price': 600, 'novelty': 0.4,
             'tags': ['Наука', 'Звезды'], 'love_language': 'quality_time'},
            {'title': 'Театр "Маска"', 'category': 'entertainment', 'price': 1800, 'novelty': 0.5,
             'tags': ['Театр', 'Культура'], 'love_language': 'quality_time'},
            {'title': 'VR клуб "Виртуальность"', 'category': 'entertainment', 'price': 1400, 'novelty': 0.9,
             'tags': ['VR/AR', 'Технологии'], 'love_language': 'quality_time'},
            {'title': 'Эскейп-рум "Побег"', 'category': 'entertainment', 'price': 1300, 'novelty': 0.8,
             'tags': ['Квесты', 'Логика'], 'love_language': 'quality_time'},
            {'title': 'Кинотеатр IMAX', 'category': 'entertainment', 'price': 1200, 'novelty': 0.4,
             'tags': ['Фильмы', 'Технологии'], 'love_language': 'quality_time'},
            {'title': 'Комеди клаб', 'category': 'entertainment', 'price': 1000, 'novelty': 0.6,
             'tags': ['Стендап', 'Юмор'], 'love_language': 'quality_time'},
            {'title': 'Танцевальная студия', 'category': 'entertainment', 'price': 800, 'novelty': 0.7,
             'tags': ['Танцы', 'Обучение'], 'love_language': 'physical_touch'},
            {'title': 'Бильярдный клуб "Кий"', 'category': 'entertainment', 'price': 900, 'novelty': 0.2,
             'tags': ['Бильярд', 'Спокойная игра'], 'love_language': 'quality_time'},
            {'title': 'Аркада "Геймзон"', 'category': 'entertainment', 'price': 700, 'novelty': 0.4,
             'tags': ['Видеоигры', 'Ретро'], 'love_language': 'quality_time'},
            {'title': 'Антикафе "Время"', 'category': 'entertainment', 'price': 300, 'novelty': 0.5,
             'tags': ['Общение', 'Игры'], 'love_language': 'quality_time'},
            {'title': 'Батутный центр "Прыг"', 'category': 'entertainment', 'price': 800, 'novelty': 0.8,
             'tags': ['Батуты', 'Активность'], 'love_language': 'physical_touch'},
            {'title': 'Картинг "Формула"', 'category': 'entertainment', 'price': 1800, 'novelty': 0.6,
             'tags': ['Гонки', 'Адреналин'], 'love_language': 'quality_time'},
            {'title': 'Пейнтбол "Война"', 'category': 'entertainment', 'price': 1500, 'novelty': 0.5,
             'tags': ['Пейнтбол', 'Команда'], 'love_language': 'physical_touch'},
            {'title': 'Каток "Лед"', 'category': 'entertainment', 'price': 600, 'novelty': 0.3,
             'tags': ['Коньки', 'Сезонный'], 'love_language': 'physical_touch'},
            {'title': 'Стрельба из лука "Робин"', 'category': 'entertainment', 'price': 1000, 'novelty': 0.8,
             'tags': ['Стрельба', 'Концентрация'], 'love_language': 'quality_time'},
            {'title': 'Дегустация виски "Скотч"', 'category': 'entertainment', 'price': 2000, 'novelty': 0.9,
             'tags': ['Алкоголь', 'Дегустация', 'Премиум'], 'love_language': 'quality_time'},
            {'title': 'Мастер-класс "Суши"', 'category': 'entertainment', 'price': 1600, 'novelty': 0.8,
             'tags': ['Кулинария', 'Японская кухня', 'Обучение'], 'love_language': 'acts_of_service'},
            {'title': 'Ночной клуб "Бит"', 'category': 'entertainment', 'price': 1200, 'novelty': 0.4,
             'tags': ['Клуб', 'Танцы', 'Музыка'], 'love_language': 'physical_touch'},
            {'title': 'Джаз-клуб "Блюз"', 'category': 'entertainment', 'price': 1100, 'novelty': 0.7,
             'tags': ['Джаз', 'Живая музыка'], 'love_language': 'quality_time'},
            {'title': 'Цирк "Чудеса"', 'category': 'entertainment', 'price': 1300, 'novelty': 0.5,
             'tags': ['Цирк', 'Шоу'], 'love_language': 'quality_time'},
        ]
        
        # Активности (15 позиций)
        activities = [
            {'title': 'Мастер-класс по живописи', 'category': 'activity', 'price': 1800, 'novelty': 0.7,
             'tags': ['Творчество', 'Обучение'], 'love_language': 'quality_time'},
            {'title': 'Спортивный зал', 'category': 'activity', 'price': 1500, 'novelty': 0.2,
             'tags': ['Фитнес', 'Здоровье'], 'love_language': 'acts_of_service'},
            {'title': 'Йога-студия', 'category': 'activity', 'price': 1200, 'novelty': 0.4,
             'tags': ['Йога', 'Медитация'], 'love_language': 'quality_time'},
            {'title': 'Бассейн', 'category': 'activity', 'price': 800, 'novelty': 0.3,
             'tags': ['Плавание', 'Спорт'], 'love_language': 'physical_touch'},
            {'title': 'Скалодром', 'category': 'activity', 'price': 1100, 'novelty': 0.8,
             'tags': ['Скалолазание', 'Экстрим'], 'love_language': 'physical_touch'},
            {'title': 'Парк "Сокольники"', 'category': 'activity', 'price': 0, 'novelty': 0.1,
             'tags': ['Природа', 'Прогулки'], 'love_language': 'quality_time'},
            {'title': 'Ботанический сад', 'category': 'activity', 'price': 300, 'novelty': 0.3,
             'tags': ['Растения', 'Природа'], 'love_language': 'quality_time'},
            {'title': 'Зоопарк', 'category': 'activity', 'price': 700, 'novelty': 0.2,
             'tags': ['Животные', 'Семейный'], 'love_language': 'quality_time'},
            {'title': 'Музей искусств', 'category': 'activity', 'price': 600, 'novelty': 0.4,
             'tags': ['Искусство', 'Культура'], 'love_language': 'quality_time'},
            {'title': 'Конная прогулка', 'category': 'activity', 'price': 2800, 'novelty': 0.8,
             'tags': ['Лошади', 'Природа'], 'love_language': 'quality_time'},
            {'title': 'Роуп-джампинг', 'category': 'activity', 'price': 3000, 'novelty': 0.9,
             'tags': ['Экстрим', 'Адреналин'], 'love_language': 'physical_touch'},
            {'title': 'Баня "Русская"', 'category': 'activity', 'price': 2000, 'novelty': 0.3,
             'tags': ['Баня', 'Релакс'], 'love_language': 'physical_touch'},
            {'title': 'Урок фотографии', 'category': 'activity', 'price': 1200, 'novelty': 0.6,
             'tags': ['Фотография', 'Обучение'], 'love_language': 'quality_time'},
            {'title': 'Винная дегустация', 'category': 'activity', 'price': 2500, 'novelty': 0.7,
             'tags': ['Вино', 'Дегустация'], 'love_language': 'acts_of_service'},
            {'title': 'Сапсерфинг "Волна"', 'category': 'activity', 'price': 2200, 'novelty': 0.9,
             'tags': ['Сапсерфинг', 'Вода', 'Спорт'], 'love_language': 'physical_touch'},
        ]
        
        catalog.extend(restaurants)
        catalog.extend(cafes) 
        catalog.extend(entertainment)
        catalog.extend(activities)
        
        return catalog
    
    def generate_enhanced_user(self, archetype: str, user_id: str = None) -> Dict:
        """
        Генерирует продвинутого пользователя с OCEAN личностью и динамическими интересами
        
        Args:
            archetype: Архетип пользователя
            user_id: ID пользователя (опционально)
            
        Returns:
            Словарь с полным профилем пользователя
        """
        if user_id is None:
            user_id = str(uuid.uuid4())
        
        # Базовые данные
        age = random.randint(20, 45)
        gender = random.choice(['male', 'female'])
        city = random.choice(['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург'])
        
        # Генерируем OCEAN личность
        personality = self.personality_engine.generate_personality_profile(archetype)
        
        # Генерируем динамические интересы
        dynamic_interests = self._generate_dynamic_interests(archetype, personality)
        
        # Языки любви (улучшенная версия)
        love_languages = self._generate_love_languages(personality)
        
        # Бюджетные предпочтения на основе личности
        budget_preference = self._determine_budget_preference(personality, age)
        
        return {
            'id': user_id,
            'age': age,
            'gender': gender,
            'city': city,
            'archetype': archetype,
            
            # OCEAN личность
            'personality': personality.to_dict(),
            'personality_description': self.personality_engine.get_personality_description(personality),
            
            # Динамические интересы
            'dynamic_interests': {name: {
                'intensity': interest.intensity,
                'passion_score': interest.passion_score,
                'decay_rate': interest.decay_rate,
                'discovery_date': interest.discovery_date.isoformat(),
                'last_interaction': interest.last_interaction.isoformat()
            } for name, interest in dynamic_interests.items()},
            
            # Традиционные поля для совместимости
            'interests': {name: interest.intensity for name, interest in dynamic_interests.items()},
            'love_languages': love_languages,
            'budget_preference': budget_preference,
            
            # Дополнительные характеристики
            'activity_probability': self._calculate_activity_probability(personality),
            'adventure_appetite': random.uniform(0.3, 0.9),
            'social_influence_susceptibility': personality.extraversion * 0.7 + personality.agreeableness * 0.3,
            
            # Метаданные
            'created_at': datetime.now().isoformat(),
            'version': '2.0_enhanced'
        }
    
    def _generate_dynamic_interests(self, archetype: str, personality: PersonalityProfile) -> Dict[str, DynamicInterest]:
        """Генерирует динамические интересы с учетом архетипа и личности"""
        base_interests = {
            'ArtLovers': ['Живопись', 'Театр', 'Музыка', 'Фотография', 'Дизайн', 'Художественная литература'],
            'Gamers': ['Видеоигры', 'Настольные игры', 'Квесты', 'Фантастика', 'Электронная музыка', 'Технологии'],
            'Gourmets': ['Итальянская кухня', 'Азиатская кухня', 'Кофе', 'Вино', 'Крафтовое пиво', 'Десерты'],
            'Homebodies': ['Сериалы', 'Настольные игры', 'Кулинария', 'Книги', 'Рукоделие', 'Домашние животные'],
            'Fitness': ['Фитнес', 'Бег', 'Йога', 'Плавание', 'Велосипед', 'Здоровое питание'],
            'Travelers': ['Городские поездки', 'Пляжный отдых', 'Горы', 'Фотография', 'Культурный туризм', 'Автопутешествия']
        }
        
        all_interests = [
            'Итальянская кухня', 'Азиатская кухня', 'Кофе', 'Десерты', 'Барбекю', 'Вегетарианская еда',
            'Фильмы', 'Сериалы', 'Театр', 'Музыка', 'Живопись', 'Фотография', 'Танцы',
            'Фитнес', 'Бег', 'Йога', 'Плавание', 'Велосипед', 'Теннис', 'Футбол',
            'Путешествия', 'Горы', 'Пляж', 'Городские поездки', 'Культурный туризм',
            'Видеоигры', 'Настольные игры', 'Квесты', 'Технологии', 'Программирование',
            'Книги', 'Художественная литература', 'Детективы', 'Фантастика', 'Психология',
            'Кулинария', 'Рукоделие', 'Садоводство', 'Домашние животные', 'Коллекционирование'
        ]
        
        dynamic_interests = {}
        
        # Основные интересы архетипа (высокая интенсивность и passion score)
        archetype_interests = base_interests.get(archetype, [])
        for interest in archetype_interests:
            intensity = random.uniform(7, 10)
            passion_score = random.uniform(0.6, 0.9)  # Высокая страсть
            decay_rate = random.uniform(0.5, 1.5)  # Медленно затухают
            
            # Открытость влияет на разнообразие интересов
            if personality.openness > 0.7:
                intensity += random.uniform(0, 1)
                passion_score += random.uniform(0, 0.1)
            
            discovery_date = datetime.now() - timedelta(days=random.randint(365, 2190))  # 1-6 лет назад
            last_interaction = datetime.now() - timedelta(days=random.randint(1, 30))
            
            dynamic_interests[interest] = DynamicInterest(
                name=interest,
                intensity=min(10, intensity),
                passion_score=min(1.0, passion_score),
                decay_rate=decay_rate,
                discovery_date=discovery_date,
                last_interaction=last_interaction
            )
        
        # Дополнительные интересы (средняя интенсивность)
        additional_count = int(5 + personality.openness * 5)  # Открытые люди имеют больше интересов
        available_interests = [i for i in all_interests if i not in archetype_interests]
        additional_interests = random.sample(available_interests, min(additional_count, len(available_interests)))
        
        for interest in additional_interests:
            intensity = random.uniform(3, 7)
            passion_score = random.uniform(0.2, 0.6)  # Средняя страсть
            decay_rate = random.uniform(1.0, 3.0)  # Быстрее затухают
            
            discovery_date = datetime.now() - timedelta(days=random.randint(30, 730))  # 1 месяц - 2 года
            last_interaction = datetime.now() - timedelta(days=random.randint(1, 90))
            
            dynamic_interests[interest] = DynamicInterest(
                name=interest,
                intensity=intensity,
                passion_score=passion_score,
                decay_rate=decay_rate,
                discovery_date=discovery_date,
                last_interaction=last_interaction
            )
        
        return dynamic_interests
    
    def _generate_love_languages(self, personality: PersonalityProfile) -> Dict[str, float]:
        """Генерирует языки любви на основе личности OCEAN"""
        love_languages = {}
        
        # Quality Time - связано с экстраверсией и открытости
        love_languages['quality_time'] = 0.3 + personality.extraversion * 0.4 + personality.openness * 0.3
        
        # Physical Touch - связано с экстраверсией и низким невротизмом
        love_languages['physical_touch'] = 0.2 + personality.extraversion * 0.3 + (1 - personality.neuroticism) * 0.3
        
        # Words of Affirmation - связано с невротизмом и доброжелательностью
        love_languages['words_of_affirmation'] = 0.2 + personality.neuroticism * 0.3 + personality.agreeableness * 0.3
        
        # Acts of Service - связано с добросовестностью и доброжелательностью
        love_languages['acts_of_service'] = 0.2 + personality.conscientiousness * 0.4 + personality.agreeableness * 0.2
        
        # Receiving Gifts - связано с открытостью и невротизмом
        love_languages['receiving_gifts'] = 0.1 + personality.openness * 0.2 + personality.neuroticism * 0.2
        
        # Нормализация
        total = sum(love_languages.values())
        love_languages = {k: v/total for k, v in love_languages.items()}
        
        return love_languages
    
    def _determine_budget_preference(self, personality: PersonalityProfile, age: int) -> str:
        """Определяет бюджетные предпочтения на основе личности и возраста"""
        # Добросовестность влияет на планирование бюджета
        # Открытость влияет на готовность тратить на новые опыты
        # Возраст влияет на доходы
        
        budget_score = (
            personality.conscientiousness * 0.3 +  # Планирование
            personality.openness * 0.4 +  # Готовность тратить на опыты
            min(1.0, age / 40.0) * 0.3  # Возрастной фактор
        )
        
        if budget_score > 0.7:
            return 'high'
        elif budget_score > 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_activity_probability(self, personality: PersonalityProfile) -> float:
        """Вычисляет вероятность активности на основе личности"""
        return (
            personality.extraversion * 0.4 +
            personality.openness * 0.3 +
            (1 - personality.neuroticism) * 0.2 +
            personality.conscientiousness * 0.1
        )
    
    def generate_enhanced_pair(self) -> Tuple[Dict, Dict, Dict]:
        """
        Генерирует пару с улучшенной совместимостью и динамикой отношений
        
        Returns:
            (user1, user2, pair_info)
        """
        # Выбираем архетипы с учетом совместимости
        archetype_compatibility = {
            'ArtLovers': ['ArtLovers', 'Travelers', 'Gourmets'],
            'Gamers': ['Gamers', 'ArtLovers', 'Homebodies'],
            'Gourmets': ['Gourmets', 'ArtLovers', 'Travelers'],
            'Homebodies': ['Homebodies', 'Gamers', 'Fitness'],
            'Fitness': ['Fitness', 'Travelers', 'Homebodies'],
            'Travelers': ['Travelers', 'ArtLovers', 'Gourmets']
        }
        
        archetype1 = random.choice(list(archetype_compatibility.keys()))
        
        if random.random() < 0.7:  # 70% шанс на совместимые архетипы
            archetype2 = random.choice(archetype_compatibility[archetype1])
        else:
            archetype2 = random.choice(list(archetype_compatibility.keys()))
        
        # Генерируем пользователей
        user1 = self.generate_enhanced_user(archetype1)
        user2 = self.generate_enhanced_user(archetype2)
        
        # Вычисляем продвинутые метрики совместимости
        personality1 = PersonalityProfile.from_dict(user1['personality'])
        personality2 = PersonalityProfile.from_dict(user2['personality'])
        
        # Индекс гармонии (врожденная совместимость)
        harmony_index = self.personality_engine.calculate_compatibility_score(personality1, personality2)
        
        # Начальное состояние отношений
        relationship_state = RelationshipState(
            harmony_index=harmony_index,
            routine_index=0.0,  # Начинаем без рутины
            adventure_appetite=random.uniform(0.5, 0.9),
            last_novel_experience=datetime.now() - timedelta(days=random.randint(1, 30)),
            shared_memories=[]
        )
        
        # Создаем информацию о паре
        pair = {
            'id': str(uuid.uuid4()),
            'user1_id': user1['id'],
            'user2_id': user2['id'],
            'created_at': datetime.now() - timedelta(days=random.randint(30, 365)),
            'status': 'active',
            
            # Продвинутые метрики отношений
            'harmony_index': relationship_state.harmony_index,
            'routine_index': relationship_state.routine_index,
            'adventure_appetite': relationship_state.adventure_appetite,
            'last_novel_experience': relationship_state.last_novel_experience.isoformat(),
            
            # Совместимость по OCEAN
            'personality_compatibility': {
                'openness_similarity': 1 - abs(personality1.openness - personality2.openness),
                'extraversion_balance': 1 - abs(abs(personality1.extraversion - personality2.extraversion) - 0.3) / 0.7,
                'agreeableness_similarity': 1 - abs(personality1.agreeableness - personality2.agreeableness),
                'emotional_stability': (1 - personality1.neuroticism) * (1 - personality2.neuroticism),
                'conscientiousness_coverage': max(personality1.conscientiousness, personality2.conscientiousness)
            },
            
            # Метаданные
            'version': '2.0_enhanced',
            'relationship_state': {
                'harmony_index': relationship_state.harmony_index,
                'routine_index': relationship_state.routine_index,
                'adventure_appetite': relationship_state.adventure_appetite,
                'shared_memories_count': len(relationship_state.shared_memories)
            }
        }
        
        return user1, user2, pair
    
    def calculate_ultra_realistic_rating(self, user: Dict, product: Dict, 
                                       context: Optional[Dict] = None) -> float:
        """
        Сверхреалистичный расчет рейтинга с учетом всех факторов
        
        Args:
            user: Профиль пользователя (улучшенный)
            product: Информация о продукте
            context: Контекст (время, настроение, пара)
            
        Returns:
            Рейтинг от 1 до 10
        """
        base_score = 5.0
        
        # 1. OCEAN личность и привлекательность активности
        if 'personality' in user:
            personality = PersonalityProfile.from_dict(user['personality'])
            product_tags = product.get('tags', [])
            
            personality_appeal = self.personality_engine.calculate_activity_appeal(personality, product_tags)
            base_score += (personality_appeal - 1.0) * 2.5  # Конвертируем в диапазон ±2.5
        
        # 2. Динамические интересы (более точное совпадение)
        dynamic_interests = user.get('dynamic_interests', {})
        interest_boost = 0
        
        for interest_name, interest_data in dynamic_interests.items():
            intensity = interest_data.get('intensity', 0)
            passion_score = interest_data.get('passion_score', 0)
            
            # Проверяем совпадение с тегами продукта
            product_tags = product.get('tags', [])
            for tag in product_tags:
                if interest_name.lower() in tag.lower() or tag.lower() in interest_name.lower():
                    # Boost зависит от интенсивности и страсти
                    boost = (intensity / 10.0) * (1 + passion_score) * random.uniform(0.8, 1.2)
                    interest_boost += boost
        
        base_score += min(3.0, interest_boost)  # Ограничиваем максимальный boost
        
        # 3. Бюджетное соответствие (улучшенная логика)
        user_budget = user.get('budget_preference', 'medium')
        product_price = product.get('price', 1000)
        
        budget_ranges = {'low': (0, 1000), 'medium': (800, 2500), 'high': (2000, 6000)}
        budget_min, budget_max = budget_ranges.get(user_budget, (800, 2500))
        
        if budget_min <= product_price <= budget_max:
            base_score += random.uniform(0.5, 1.5)
        elif product_price > budget_max:
            # Штраф зависит от того, насколько превышен бюджет
            excess_ratio = product_price / budget_max
            penalty = min(3.0, excess_ratio * random.uniform(1.0, 2.0))
            base_score -= penalty
        else:
            # Дешевые вещи - небольшой плюс, но не всегда
            base_score += random.uniform(-0.2, 0.8)
        
        # 4. Новизна продукта (важно для открытых личностей)
        product_novelty = product.get('novelty', 0.5)
        
        if 'personality' in user:
            personality = PersonalityProfile.from_dict(user['personality'])
            if personality.openness > 0.7:  # Высокая открытость
                novelty_bonus = product_novelty * random.uniform(0.5, 1.5)
                base_score += novelty_bonus
            elif personality.openness < 0.3:  # Низкая открытость
                familiarity_bonus = (1 - product_novelty) * random.uniform(0.3, 1.0)
                base_score += familiarity_bonus
        
        # 5. Контекстные факторы
        if context:
            # Время дня
            time_of_day = context.get('time_of_day', 'evening')
            if time_of_day in self.temporal_patterns:
                pattern = self.temporal_patterns[time_of_day]
                suitable_activities = pattern['suitable_activities']
                product_category = product.get('category', '')
                
                if any(activity in product_category for activity in suitable_activities):
                    base_score += random.uniform(0.3, 0.8)
            
            # Настроение
            mood = context.get('mood', 'neutral')
            if mood == 'adventurous' and product_novelty > 0.7:
                base_score += random.uniform(0.5, 1.5)
            elif mood == 'comfortable' and product_novelty < 0.3:
                base_score += random.uniform(0.3, 1.0)
        
        # 6. Фактор привыкания/рутины (если пользователь уже был)
        visit_count = random.randint(0, 5)  # Симуляция предыдущих посещений
        if visit_count > 0:
            # Привычные места могут надоедать
            fatigue_penalty = visit_count * random.uniform(0.1, 0.4)
            base_score -= fatigue_penalty
            
            # Но любимые места (высокий рейтинг) теряют меньше очков
            if base_score > 7:
                base_score += random.uniform(0.2, 0.6)  # Компенсация для любимых мест
        
        # 7. Сезонность и актуальность
        current_season = self._get_current_season()
        product_tags = product.get('tags', [])
        
        seasonal_keywords = {
            'winter': ['горячий', 'теплый', 'домашний', 'крытый'],
            'spring': ['свежий', 'природа', 'парк', 'прогулка'],
            'summer': ['прохладный', 'открытый', 'терраса', 'пляж'],
            'autumn': ['уютный', 'теплый', 'комфорт']
        }
        
        season_keywords = seasonal_keywords.get(current_season, [])
        for keyword in season_keywords:
            if any(keyword in tag.lower() for tag in product_tags):
                base_score += random.uniform(0.2, 0.6)
                break
        
        # 8. Социальный фактор (влияние партнера для пар)
        if context and 'partner_interests' in context:
            partner_interests = context['partner_interests']
            shared_appeal = 0
            
            for tag in product_tags:
                if any(tag.lower() in interest.lower() for interest in partner_interests):
                    shared_appeal += random.uniform(0.2, 0.8)
            
            # Доброжелательные люди больше учитывают интересы партнера
            if 'personality' in user:
                personality = PersonalityProfile.from_dict(user['personality'])
                agreeableness_factor = personality.agreeableness
                base_score += shared_appeal * agreeableness_factor
        
        # 9. Случайные факторы настроения (более сложные)
        mood_factors = [
            ('excellent_day', 0.05, random.uniform(1.5, 3.0)),  # Отличный день
            ('terrible_day', 0.08, random.uniform(-3.0, -1.5)),  # Ужасный день
            ('discovery_mode', 0.12, random.uniform(1.0, 2.5)),  # Режим открытий
            ('comfort_seeking', 0.10, random.uniform(-1.0, 1.5)),  # Поиск комфорта
            ('social_pressure', 0.06, random.uniform(-1.0, 2.0)),  # Социальное давление
        ]
        
        for mood_name, probability, effect in mood_factors:
            if random.random() < probability:
                base_score += effect
                break  # Только один mood factor за раз
        
        # 10. Финальная нормализация с реалистичными границами
        final_rating = max(1.0, min(10.0, base_score))
        
        # Добавляем небольшой шум для дополнительной вариативности
        noise = random.uniform(-0.3, 0.3)
        final_rating = max(1.0, min(10.0, final_rating + noise))
        
        return round(final_rating, 1)
    
    def _get_current_season(self) -> str:
        """Определяет текущий сезон"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'
    
    def generate_enhanced_interactions(self, pair: Dict, user1: Dict, user2: Dict, 
                                     num_interactions: int = None) -> List[Dict]:
        """
        Генерирует реалистичные взаимодействия с учетом всех улучшений
        
        Args:
            pair: Информация о паре
            user1, user2: Профили пользователей
            num_interactions: Количество взаимодействий
            
        Returns:
            Список взаимодействий
        """
        if num_interactions is None:
            # Количество зависит от гармонии пары и активности
            base_interactions = random.randint(50, 200)
            harmony_factor = pair.get('harmony_index', 0.5)
            activity_factor = (user1.get('activity_probability', 0.5) + 
                             user2.get('activity_probability', 0.5)) / 2
            
            num_interactions = int(base_interactions * (1 + harmony_factor) * (1 + activity_factor))
        
        interactions = []
        start_date = datetime.fromisoformat(pair['created_at'].replace('Z', '+00:00')).replace(tzinfo=None)
        
        # Отслеживаем состояние отношений
        current_routine_index = pair.get('routine_index', 0.0)
        visited_places = {}  # Для отслеживания повторных посещений
        
        for i in range(num_interactions):
            # Дата взаимодействия
            days_offset = random.randint(0, (datetime.now() - start_date).days)
            interaction_date = start_date + timedelta(days=days_offset)
            
            # Выбор продукта с учетом рутины и предпочтений
            product = self._choose_product_intelligently(
                [user1, user2], current_routine_index, visited_places, interaction_date
            )
            
            # Выбор пользователя (инициатор)
            initiator = random.choice([user1, user2])
            partner = user2 if initiator == user1 else user1
            
            # Тип взаимодействия
            interaction_type = random.choices(
                ['visit', 'rating', 'purchase', 'recommendation_shown', 'recommendation_clicked', 'shared_experience'],
                weights=[0.35, 0.25, 0.1, 0.15, 0.1, 0.05]
            )[0]
            
            # Контекст для реалистичного рейтинга
            context = {
                'time_of_day': self._get_time_of_day(interaction_date),
                'partner_interests': list(partner.get('interests', {}).keys())[:3],
                'mood': self._determine_mood(initiator, interaction_date),
                'routine_level': current_routine_index
            }
            
            # Генерируем рейтинг
            rating = None
            if interaction_type in ['visit', 'rating', 'shared_experience']:
                rating = self.calculate_ultra_realistic_rating(initiator, product, context)
            
            # Создаем взаимодействие
            interaction = {
                'id': str(uuid.uuid4()),
                'pair_id': pair['id'],
                'user_id': initiator['id'],
                'partner_id': partner['id'],
                'action': interaction_type,
                'product_id': product['title'],
                'product_category': product['category'],
                'rating': rating,
                'price': product['price'],
                'created_at': interaction_date.isoformat(),
                
                # Расширенные метаданные
                'metadata': {
                    'initiator_archetype': initiator['archetype'],
                    'partner_archetype': partner['archetype'],
                    'product_novelty': product.get('novelty', 0.5),
                    'love_language_match': product['love_language'],
                    'context': context,
                    'routine_level_at_time': current_routine_index,
                    'visit_count': visited_places.get(product['title'], 0)
                }
            }
            
            interactions.append(interaction)
            
            # Обновляем состояние
            if interaction_type in ['visit', 'shared_experience']:
                visited_places[product['title']] = visited_places.get(product['title'], 0) + 1
                
                # Обновляем рутину
                product_novelty = product.get('novelty', 0.5)
                if product_novelty > 0.7:
                    current_routine_index = max(0, current_routine_index - 0.02)
                elif visited_places[product['title']] > 2:
                    current_routine_index = min(1.0, current_routine_index + 0.03)
        
        return interactions
    
    def _choose_product_intelligently(self, users: List[Dict], routine_index: float, 
                                    visited_places: Dict, date: datetime) -> Dict:
        """Умный выбор продукта с учетом состояния отношений"""
        
        # Если высокая рутина - предпочитаем новые места
        if routine_index > 0.6:
            novel_products = [p for p in self.enhanced_product_catalog if p.get('novelty', 0.5) > 0.6]
            if novel_products:
                return random.choice(novel_products)
        
        # Если мало рутины - можем выбрать знакомые места
        elif routine_index < 0.3:
            familiar_products = [p for p in self.enhanced_product_catalog if p.get('novelty', 0.5) < 0.4]
            if familiar_products and random.random() < 0.3:  # 30% шанс выбрать знакомое
                return random.choice(familiar_products)
        
        # Обычный выбор с учетом предпочтений пользователей
        suitable_products = []
        
        for product in self.enhanced_product_catalog:
            suitability_score = 0
            
            for user in users:
                if 'personality' in user:
                    personality = PersonalityProfile.from_dict(user['personality'])
                    appeal = self.personality_engine.calculate_activity_appeal(
                        personality, product.get('tags', [])
                    )
                    suitability_score += appeal
            
            # Штраф за частые посещения
            visit_count = visited_places.get(product['title'], 0)
            if visit_count > 0:
                suitability_score -= visit_count * 0.2
            
            if suitability_score > 1.5:  # Порог привлекательности
                suitable_products.append(product)
        
        if suitable_products:
            return random.choice(suitable_products)
        else:
            return random.choice(self.enhanced_product_catalog)
    
    def _get_time_of_day(self, date: datetime) -> str:
        """Определяет время дня для взаимодействия"""
        hour = random.randint(8, 23)  # Активные часы
        
        if 6 <= hour < 12:
            return 'morning'
        elif 12 <= hour < 17:
            return 'afternoon'
        elif 17 <= hour < 22:
            return 'evening'
        else:
            return 'night'
    
    def _determine_mood(self, user: Dict, date: datetime) -> str:
        """Определяет настроение пользователя"""
        moods = ['neutral', 'adventurous', 'comfortable', 'social', 'romantic']
        weights = [0.4, 0.2, 0.2, 0.15, 0.05]
        
        # Настроение зависит от личности
        if 'personality' in user:
            personality = PersonalityProfile.from_dict(user['personality'])
            
            # Корректируем веса на основе личности
            if personality.openness > 0.7:
                weights[1] *= 2  # adventurous
            if personality.extraversion > 0.7:
                weights[3] *= 2  # social
            if personality.neuroticism > 0.7:
                weights[2] *= 1.5  # comfortable
        
        return random.choices(moods, weights=weights)[0]
    
    def generate_enhanced_dataset(self, num_pairs: int = 2000) -> Dict:
        """
        Генерирует полный улучшенный датасет
        
        Args:
            num_pairs: Количество пар
            
        Returns:
            Словарь с данными
        """
        print(f"🚀 Генерируем Enhanced Dataset v2.0 для {num_pairs} пар...")
        print("✨ Новые фичи: OCEAN личность, динамические интересы, рутина отношений")
        
        users = []
        pairs = []
        interactions = []
        
        for i in range(num_pairs):
            if (i + 1) % 100 == 0:
                print(f"📊 Обработано {i + 1}/{num_pairs} пар")
            
            # Генерируем улучшенную пару
            user1, user2, pair = self.generate_enhanced_pair()
            users.extend([user1, user2])
            pairs.append(pair)
            
            # Генерируем реалистичные взаимодействия
            pair_interactions = self.generate_enhanced_interactions(pair, user1, user2)
            interactions.extend(pair_interactions)
        
        # Создаем улучшенный каталог продуктов с координатами
        enhanced_catalog = []
        for i, product in enumerate(self.enhanced_product_catalog):
            # Координаты в пределах Москвы
            moscow_lat, moscow_lon = 55.7558, 37.6176
            lat_offset = random.uniform(-0.2, 0.2)
            lon_offset = random.uniform(-0.3, 0.3)
            
            enhanced_catalog.append({
                'id': str(uuid.uuid4()),
                'title': product['title'],
                'category': product['category'],
                'price': product['price'],
                'tags': product['tags'],
                'love_language': product['love_language'],
                'novelty': product.get('novelty', 0.5),
                'latitude': round(moscow_lat + lat_offset, 6),
                'longitude': round(moscow_lon + lon_offset, 6),
                'created_at': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat()
            })
        
        # Финальная статистика
        total_interactions = len(interactions)
        avg_rating = np.mean([i['rating'] for i in interactions if i['rating'] is not None])
        rating_variance = np.var([i['rating'] for i in interactions if i['rating'] is not None])
        
        dataset = {
            'users': users,
            'pairs': pairs,
            'interactions': interactions,
            'product_catalog': enhanced_catalog,
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'version': '2.0_enhanced',
                'generator': 'EnhancedSyntheticGenerator',
                
                # Основная статистика
                'num_pairs': num_pairs,
                'num_users': len(users),
                'num_interactions': total_interactions,
                'num_products': len(enhanced_catalog),
                
                # Качественные показатели
                'avg_interactions_per_pair': total_interactions / num_pairs,
                'avg_rating': round(avg_rating, 2),
                'rating_variance': round(rating_variance, 2),
                
                # Новые метрики
                'personality_model': 'OCEAN_Big_Five',
                'interest_model': 'Dynamic_with_Drift',
                'relationship_model': 'Harmony_Routine_Engine',
                'rating_factors': 10,  # Количество факторов в расчете рейтинга
                
                # Распределение архетипов
                'archetype_distribution': {
                    archetype: len([u for u in users if u['archetype'] == archetype])
                    for archetype in ['ArtLovers', 'Gamers', 'Gourmets', 'Homebodies', 'Fitness', 'Travelers']
                },
                
                # Совместимость пар
                'avg_harmony_index': round(np.mean([p['harmony_index'] for p in pairs]), 3),
                'personality_compatibility_avg': round(np.mean([
                    sum(p['personality_compatibility'].values()) / len(p['personality_compatibility'])
                    for p in pairs
                ]), 3)
            }
        }
        
        return dataset
    
    def save_enhanced_dataset(self, dataset: Dict, output_dir: str = 'data/synthetic_v2_enhanced'):
        """Сохраняет улучшенный датасет"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Сохраняем в JSON с полной информацией
        with open(f'{output_dir}/dataset_enhanced.json', 'w', encoding='utf-8') as f:
            json.dump(dataset, f, ensure_ascii=False, indent=2, default=str)
        
        # Сохраняем в CSV для анализа
        pd.DataFrame(dataset['users']).to_csv(f'{output_dir}/users.csv', index=False)
        pd.DataFrame(dataset['pairs']).to_csv(f'{output_dir}/pairs.csv', index=False)
        pd.DataFrame(dataset['interactions']).to_csv(f'{output_dir}/interactions.csv', index=False)
        pd.DataFrame(dataset['product_catalog']).to_csv(f'{output_dir}/product_catalog.csv', index=False)
        
        # Сохраняем метаданные
        with open(f'{output_dir}/metadata.json', 'w', encoding='utf-8') as f:
            json.dump(dataset['metadata'], f, ensure_ascii=False, indent=2)
        
        print(f"✅ Enhanced Dataset v2.0 сохранен в {output_dir}")
        print(f"\n📊 Статистика Enhanced Dataset:")
        print(f"  - Пользователей: {dataset['metadata']['num_users']}")
        print(f"  - Пар: {dataset['metadata']['num_pairs']}")
        print(f"  - Взаимодействий: {dataset['metadata']['num_interactions']}")
        print(f"  - Товаров: {dataset['metadata']['num_products']} (было 12 → стало 75)")
        print(f"  - Средний рейтинг: {dataset['metadata']['avg_rating']} (реалистичный)")
        print(f"  - Дисперсия рейтингов: {dataset['metadata']['rating_variance']} (высокая)")
        print(f"  - Средняя гармония пар: {dataset['metadata']['avg_harmony_index']}")
        print(f"\n🧠 Новые возможности:")
        print(f"  ✅ OCEAN личности (научно обоснованные)")
        print(f"  ✅ Динамические интересы с дрейфом")
        print(f"  ✅ Индекс рутины отношений")
        print(f"  ✅ 10-факторный расчет рейтингов")
        print(f"  ✅ Контекстное моделирование взаимодействий")

def main():
    """Демонстрация Enhanced Synthetic Generator"""
    print("🚀 Enhanced Synthetic Data Generator v2.0")
    print("🎯 Фаза 1: Поведенческий Цифровой Двойник")
    
    # Инициализируем генератор
    generator = EnhancedSyntheticGenerator()
    
    # Демонстрируем новые возможности
    print("\n🧠 Демонстрация OCEAN личности:")
    test_user = generator.generate_enhanced_user('ArtLovers')
    personality = PersonalityProfile.from_dict(test_user['personality'])
    
    print(f"  Пользователь: {test_user['archetype']}")
    print(f"  OCEAN: O={personality.openness:.2f} C={personality.conscientiousness:.2f} " +
          f"E={personality.extraversion:.2f} A={personality.agreeableness:.2f} N={personality.neuroticism:.2f}")
    
    dynamic_interests = test_user['dynamic_interests']
    print(f"  Динамических интересов: {len(dynamic_interests)}")
    
    top_interests = sorted(dynamic_interests.items(), 
                          key=lambda x: x[1]['intensity'], reverse=True)[:3]
    for name, data in top_interests:
        print(f"    {name}: интенсивность={data['intensity']:.1f}, страсть={data['passion_score']:.2f}")
    
    # Генерируем маленький тестовый датасет
    print(f"\n📊 Генерируем тестовый enhanced dataset (50 пар)...")
    test_dataset = generator.generate_enhanced_dataset(50)
    
    # Сохраняем
    generator.save_enhanced_dataset(test_dataset, 'data/test_enhanced')
    
    print(f"\n🎉 Enhanced Generator готов!")
    print(f"💡 Для полного датасета запустите:")
    print(f"   dataset = generator.generate_enhanced_dataset(2000)")
    print(f"   generator.save_enhanced_dataset(dataset)")

if __name__ == "__main__":
    main()
