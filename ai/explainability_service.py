#!/usr/bin/env python3
"""
Explainability Service для LoveMemory AI
Фаза 8: Объяснение решений AI моделей с помощью SHAP

Функции:
- SHAP анализ для LightGBM модели
- Извлечение топ-3 факторов для каждой рекомендации  
- Генерация human-friendly объяснений
- Сохранение объяснений в recommendation_history
- Визуализация важности фич
"""

import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pickle
import os
from dataclasses import dataclass

# SHAP для explainability
try:
    import shap
    import matplotlib.pyplot as plt
    import seaborn as sns
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("⚠️ SHAP не установлен, используем feature importance из модели")

# Импорты наших сервисов
from learning_to_rank_service import LearningToRankService
from llm_wrapper import LLMWrapper

@dataclass
class ExplanationResult:
    """Результат объяснения рекомендации"""
    item_id: str
    top_factors: List[Dict[str, Any]]  # [{"feature": "content_score", "value": 0.8, "contribution": 0.3, "explanation": "высокое совпадение интересов"}]
    human_friendly: str  # Краткое объяснение для пользователя
    technical_details: Dict[str, Any]  # Техническая информация для разработчиков
    confidence_score: float  # Уверенность в объяснении
    generated_at: datetime

class ExplainabilityService:
    """Сервис для объяснения решений AI моделей"""
    
    def __init__(self, ltr_service: Optional[LearningToRankService] = None):
        """
        Инициализация Explainability Service
        
        Args:
            ltr_service: Сервис Learning to Rank для анализа
        """
        self.ltr_service = ltr_service or LearningToRankService()
        self.llm_wrapper = LLMWrapper()
        
        # SHAP объекты
        self.shap_explainer = None
        self.shap_values_cache = {}
        
        # Маппинг фич на человеко-понятные описания
        self.feature_descriptions = {
            'content_score': 'совпадение интересов и предпочтений',
            'cf_score': 'популярность среди похожих пар',
            'embedding_score': 'семантическое сходство профилей',
            'price': 'соответствие ценовой категории',
            'price_match_score': 'соответствие бюджету пары',
            'item_popularity': 'общая популярность места/активности',
            'age_diff': 'возрастная совместимость',
            'same_archetype': 'схожесть типов личности',
            'budget_match': 'совпадение бюджетных предпочтений',
            'is_restaurant': 'ресторанная категория',
            'is_cafe': 'кафе и напитки',
            'is_entertainment': 'развлекательная активность',
            'is_gift': 'подарочная категория',
            'is_weekend': 'время для выходного дня',
            'user1_artlovers': 'интерес к искусству первого партнера',
            'user2_artlovers': 'интерес к искусству второго партнера',
            'user1_gamers': 'игровые предпочтения первого партнера',
            'user2_gamers': 'игровые предпочтения второго партнера',
            'user1_gourmets': 'гастрономические интересы первого партнера',
            'user2_gourmets': 'гастрономические интересы второго партнера',
            'user1_fitness': 'спортивные интересы первого партнера',
            'user2_fitness': 'спортивные интересы второго партнера',
            'user1_travelers': 'интерес к путешествиям первого партнера',
            'user2_travelers': 'интерес к путешествиям второго партнера',
            'avg_activity': 'средний уровень активности пары',
            'content_cf_product': 'комбинация персональных и коллективных предпочтений',
            'content_embedding_product': 'комбинация интересов и семантики',
            'cf_embedding_product': 'комбинация популярности и семантики'
        }
        
        # Инициализируем SHAP если доступен
        self._initialize_shap()
        
        print("🔍 Explainability Service инициализирован")
    
    def _initialize_shap(self):
        """Инициализирует SHAP explainer для LightGBM"""
        if not SHAP_AVAILABLE:
            print("⚠️ SHAP недоступен, используем feature importance")
            return
        
        try:
            # Проверяем, есть ли обученная LTR модель
            if self.ltr_service.ranker_model is None:
                if not self.ltr_service.load_model():
                    print("⚠️ LTR модель недоступна для SHAP анализа")
                    return
            
            # Создаем SHAP explainer для LightGBM
            self.shap_explainer = shap.TreeExplainer(self.ltr_service.ranker_model)
            print("✅ SHAP explainer инициализирован")
            
        except Exception as e:
            print(f"⚠️ Ошибка инициализации SHAP: {e}")
    
    def explain_recommendation(self, pair_id: str, item_id: str, 
                             candidate_features: Dict[str, float]) -> ExplanationResult:
        """
        Объясняет почему конкретный item был рекомендован паре
        
        Args:
            pair_id: ID пары
            item_id: ID рекомендованного товара
            candidate_features: Фичи кандидата
        
        Returns:
            Подробное объяснение рекомендации
        """
        try:
            # Получаем SHAP values если доступны
            if self.shap_explainer and self.ltr_service.feature_names:
                top_factors = self._get_shap_explanation(candidate_features)
            else:
                # Fallback на feature importance
                top_factors = self._get_feature_importance_explanation(candidate_features)
            
            # Генерируем человеко-понятное объяснение
            human_friendly = self._generate_human_explanation(top_factors, pair_id, item_id)
            
            # Вычисляем уверенность в объяснении
            confidence_score = self._calculate_confidence(top_factors, candidate_features)
            
            # Технические детали
            technical_details = {
                'method_used': 'shap' if self.shap_explainer else 'feature_importance',
                'total_features': len(candidate_features),
                'feature_coverage': len(top_factors) / len(candidate_features),
                'model_version': 'ltr_v1'
            }
            
            return ExplanationResult(
                item_id=item_id,
                top_factors=top_factors,
                human_friendly=human_friendly,
                technical_details=technical_details,
                confidence_score=confidence_score,
                generated_at=datetime.now()
            )
            
        except Exception as e:
            print(f"❌ Ошибка объяснения для {item_id}: {e}")
            return self._generate_fallback_explanation(item_id)
    
    def _get_shap_explanation(self, candidate_features: Dict[str, float]) -> List[Dict[str, Any]]:
        """Получает объяснение с помощью SHAP"""
        try:
            # Подготавливаем фичи в правильном порядке
            feature_vector = []
            for feature_name in self.ltr_service.feature_names:
                feature_vector.append(candidate_features.get(feature_name, 0.0))
            
            # Получаем SHAP values
            feature_array = np.array(feature_vector).reshape(1, -1)
            shap_values = self.shap_explainer.shap_values(feature_array)[0]
            
            # Создаем список факторов с их вкладом
            factors = []
            for i, (feature_name, shap_value) in enumerate(zip(self.ltr_service.feature_names, shap_values)):
                if abs(shap_value) > 0.001:  # Только значимые факторы
                    factors.append({
                        'feature': feature_name,
                        'value': feature_vector[i],
                        'contribution': float(shap_value),
                        'explanation': self.feature_descriptions.get(feature_name, feature_name),
                        'direction': 'positive' if shap_value > 0 else 'negative'
                    })
            
            # Сортируем по важности (абсолютное значение SHAP)
            factors.sort(key=lambda x: abs(x['contribution']), reverse=True)
            
            return factors[:5]  # Топ-5 факторов
            
        except Exception as e:
            print(f"⚠️ Ошибка SHAP анализа: {e}")
            return self._get_feature_importance_explanation(candidate_features)
    
    def _get_feature_importance_explanation(self, candidate_features: Dict[str, float]) -> List[Dict[str, Any]]:
        """Fallback объяснение на основе feature importance модели"""
        if not self.ltr_service.feature_importance:
            return self._get_simple_explanation(candidate_features)
        
        factors = []
        
        # Для каждой важной фичи смотрим её значение у кандидата
        for feature_name, importance in list(self.ltr_service.feature_importance.items())[:10]:
            if feature_name in candidate_features:
                value = candidate_features[feature_name]
                
                # Простая оценка вклада на основе важности фичи и её значения
                contribution = importance * value / 1000.0  # Нормализуем
                
                if abs(contribution) > 0.001:
                    factors.append({
                        'feature': feature_name,
                        'value': value,
                        'contribution': contribution,
                        'explanation': self.feature_descriptions.get(feature_name, feature_name),
                        'direction': 'positive' if contribution > 0 else 'negative'
                    })
        
        # Сортируем по вкладу
        factors.sort(key=lambda x: abs(x['contribution']), reverse=True)
        
        return factors[:3]  # Топ-3 фактора
    
    def _get_simple_explanation(self, candidate_features: Dict[str, float]) -> List[Dict[str, Any]]:
        """Простое объяснение если нет других методов"""
        factors = []
        
        # Ключевые фичи для простого объяснения
        key_features = ['content_score', 'cf_score', 'embedding_score', 'price_match_score']
        
        for feature in key_features:
            if feature in candidate_features:
                value = candidate_features[feature]
                factors.append({
                    'feature': feature,
                    'value': value,
                    'contribution': value,  # Используем само значение как вклад
                    'explanation': self.feature_descriptions.get(feature, feature),
                    'direction': 'positive' if value > 0.5 else 'negative'
                })
        
        return factors
    
    def _generate_human_explanation(self, top_factors: List[Dict], pair_id: str, item_id: str) -> str:
        """Генерирует человеко-понятное объяснение"""
        if not top_factors:
            return "Рекомендация основана на анализе ваших предпочтений."
        
        # Формируем краткие причины для LLM
        reasons = []
        for factor in top_factors[:3]:
            explanation = factor['explanation']
            direction = factor['direction']
            
            if direction == 'positive':
                reasons.append(f"{explanation} подходит")
            else:
                reasons.append(f"{explanation} учтен")
        
        # Используем LLM для генерации объяснения
        try:
            recommendation = {'title': item_id}  # Минимальная информация
            llm_response = self.llm_wrapper.generate_explanation(recommendation, reasons)
            return llm_response.generated_text
        except:
            # Fallback на простое объяснение
            return self._generate_simple_explanation(reasons)
    
    def _generate_simple_explanation(self, reasons: List[str]) -> str:
        """Простое объяснение без LLM"""
        if len(reasons) == 1:
            return f"• {reasons[0]}"
        elif len(reasons) == 2:
            return f"• {reasons[0]}\n• {reasons[1]}"
        else:
            return f"• {reasons[0]}\n• {reasons[1]}\n• {reasons[2]}"
    
    def _calculate_confidence(self, top_factors: List[Dict], all_features: Dict[str, float]) -> float:
        """Вычисляет уверенность в объяснении"""
        if not top_factors:
            return 0.5
        
        # Простая метрика: чем больше вклад топ факторов, тем выше уверенность
        total_contribution = sum(abs(factor['contribution']) for factor in top_factors)
        
        # Нормализуем к [0, 1]
        confidence = min(1.0, total_contribution * 2)
        
        # Учитываем покрытие фич
        coverage = len(top_factors) / max(len(all_features), 1)
        confidence = confidence * (0.7 + 0.3 * coverage)
        
        return max(0.1, min(1.0, confidence))
    
    def _generate_fallback_explanation(self, item_id: str) -> ExplanationResult:
        """Генерирует fallback объяснение при ошибках"""
        return ExplanationResult(
            item_id=item_id,
            top_factors=[{
                'feature': 'general_fit',
                'value': 0.7,
                'contribution': 0.7,
                'explanation': 'соответствие общим предпочтениям',
                'direction': 'positive'
            }],
            human_friendly="• Подходит под ваши интересы\n• Соответствует предпочтениям\n• Популярно среди пользователей",
            technical_details={'method_used': 'fallback'},
            confidence_score=0.5,
            generated_at=datetime.now()
        )
    
    def explain_batch_recommendations(self, pair_id: str, 
                                    recommendations: List[Dict]) -> List[ExplanationResult]:
        """
        Объясняет батч рекомендаций
        
        Args:
            pair_id: ID пары
            recommendations: Список рекомендаций с фичами
        
        Returns:
            Список объяснений для каждой рекомендации
        """
        explanations = []
        
        for rec in recommendations:
            try:
                item_id = rec.get('item_id', 'unknown')
                
                # Извлекаем фичи (если они есть в рекомендации)
                features = self._extract_features_from_recommendation(rec, pair_id)
                
                explanation = self.explain_recommendation(pair_id, item_id, features)
                explanations.append(explanation)
                
            except Exception as e:
                print(f"⚠️ Ошибка объяснения для {rec.get('item_id', 'unknown')}: {e}")
                explanations.append(self._generate_fallback_explanation(rec.get('item_id', 'unknown')))
        
        return explanations
    
    def _extract_features_from_recommendation(self, recommendation: Dict, pair_id: str) -> Dict[str, float]:
        """Извлекает фичи из рекомендации"""
        # Если фичи уже есть в рекомендации
        if 'features' in recommendation:
            return recommendation['features']
        
        # Иначе генерируем базовые фичи
        features = {
            'content_score': recommendation.get('content_score', 0.0),
            'cf_score': recommendation.get('cf_score', 0.0),
            'embedding_score': recommendation.get('embedding_score', 0.0),
            'price': recommendation.get('price', 0.0) / 1000.0,  # Нормализуем
            'final_score': recommendation.get('final_score', 0.0)
        }
        
        # Добавляем категориальные фичи
        category = recommendation.get('category', 'unknown')
        features[f'is_{category}'] = 1.0
        
        return features
    
    def save_explanations_to_history(self, pair_id: str, recommendations: List[Dict], 
                                   explanations: List[ExplanationResult]):
        """
        Сохраняет объяснения в recommendation_history для будущего анализа
        
        Args:
            pair_id: ID пары
            recommendations: Рекомендации
            explanations: Объяснения
        """
        try:
            # Создаем запись для сохранения
            history_entry = {
                'pair_id': pair_id,
                'timestamp': datetime.now().isoformat(),
                'recommendations_with_explanations': []
            }
            
            for rec, explanation in zip(recommendations, explanations):
                entry = {
                    'item_id': rec.get('item_id'),
                    'title': rec.get('title'),
                    'final_score': rec.get('final_score'),
                    'top_factors': explanation.top_factors[:3],  # Топ-3 фактора
                    'human_explanation': explanation.human_friendly,
                    'confidence': explanation.confidence_score,
                    'context_snapshot': [factor['explanation'] for factor in explanation.top_factors[:3]]
                }
                history_entry['recommendations_with_explanations'].append(entry)
            
            # Сохраняем в файл (в production это была бы база данных)
            os.makedirs('explanation_history', exist_ok=True)
            filename = f"explanation_history/explanations_{pair_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(history_entry, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Объяснения сохранены: {filename}")
            
        except Exception as e:
            print(f"⚠️ Ошибка сохранения объяснений: {e}")
    
    def generate_feature_importance_plot(self, save_path: str = "feature_importance.png"):
        """Генерирует график важности фич"""
        if not self.ltr_service.feature_importance:
            print("⚠️ Feature importance недоступен")
            return
        
        try:
            # Готовим данные
            features = list(self.ltr_service.feature_importance.keys())[:15]
            importances = list(self.ltr_service.feature_importance.values())[:15]
            
            # Создаем график
            plt.figure(figsize=(12, 8))
            plt.barh(features, importances)
            plt.title('Feature Importance в LTR модели')
            plt.xlabel('Важность')
            plt.tight_layout()
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            print(f"✅ График сохранен: {save_path}")
            
        except Exception as e:
            print(f"⚠️ Ошибка создания графика: {e}")
    
    def get_explainability_stats(self) -> Dict[str, Any]:
        """Возвращает статистику explainability сервиса"""
        return {
            'shap_available': SHAP_AVAILABLE and self.shap_explainer is not None,
            'ltr_model_loaded': self.ltr_service.ranker_model is not None,
            'feature_count': len(self.ltr_service.feature_names) if self.ltr_service.feature_names else 0,
            'feature_descriptions_count': len(self.feature_descriptions),
            'llm_wrapper_available': self.llm_wrapper is not None
        }

def main():
    """Демонстрация работы Explainability Service"""
    print("🔍 Тестирование Explainability Service")
    
    # Инициализируем сервис
    explainer = ExplainabilityService()
    
    # Проверяем статус
    stats = explainer.get_explainability_stats()
    print(f"\n📊 Статус сервиса:")
    for key, value in stats.items():
        print(f"  {key}: {value}")
    
    # Тестовые данные
    test_features = {
        'content_score': 0.85,
        'cf_score': 0.72,
        'embedding_score': 0.68,
        'price': 0.8,
        'price_match_score': 0.9,
        'same_archetype': 1.0,
        'budget_match': 1.0,
        'is_restaurant': 1.0,
        'is_cafe': 0.0,
        'user1_gourmets': 1.0,
        'user2_gourmets': 1.0,
        'content_cf_product': 0.61,
        'avg_activity': 0.75
    }
    
    print(f"\n🎯 Тестируем объяснение рекомендации...")
    
    # Объясняем рекомендацию
    explanation = explainer.explain_recommendation(
        pair_id="test_pair_123",
        item_id="restaurant_001",
        candidate_features=test_features
    )
    
    print(f"\n📋 Результат объяснения:")
    print(f"Item ID: {explanation.item_id}")
    print(f"Уверенность: {explanation.confidence_score:.3f}")
    print(f"Метод: {explanation.technical_details.get('method_used', 'unknown')}")
    
    print(f"\n🔍 Топ факторы:")
    for i, factor in enumerate(explanation.top_factors, 1):
        direction_icon = "👍" if factor['direction'] == 'positive' else "👎"
        print(f"  {i}. {direction_icon} {factor['explanation']}")
        print(f"     Значение: {factor['value']:.3f}, Вклад: {factor['contribution']:.3f}")
    
    print(f"\n💬 Человеко-понятное объяснение:")
    print(explanation.human_friendly)
    
    # Тест батчевого объяснения
    print(f"\n📦 Тест батчевого объяснения...")
    test_recommendations = [
        {
            'item_id': 'restaurant_001',
            'title': 'Ресторан "Итальянец"',
            'category': 'restaurant',
            'content_score': 0.85,
            'cf_score': 0.72,
            'embedding_score': 0.68,
            'price': 2500,
            'final_score': 0.75
        },
        {
            'item_id': 'cafe_002',
            'title': 'Кофейня "Аромат"',
            'category': 'cafe',
            'content_score': 0.78,
            'cf_score': 0.65,
            'embedding_score': 0.71,
            'price': 800,
            'final_score': 0.71
        }
    ]
    
    batch_explanations = explainer.explain_batch_recommendations("test_pair_123", test_recommendations)
    
    print(f"Объяснено рекомендаций: {len(batch_explanations)}")
    for i, exp in enumerate(batch_explanations, 1):
        print(f"  {i}. {exp.item_id}: {len(exp.top_factors)} факторов")
    
    # Сохраняем объяснения
    explainer.save_explanations_to_history("test_pair_123", test_recommendations, batch_explanations)
    
    # Генерируем график важности фич
    explainer.generate_feature_importance_plot("test_feature_importance.png")
    
    print("\n✅ Explainability Service готов!")

if __name__ == "__main__":
    main()
