"""
🎯 Multi-Objective Ranker для LoveMemory AI
Фаза 2.1: Многоцелевое Ранжирование

Инновационный подход к рекомендациям, который оптимизирует не только точность,
но и эмоциональную ценность рекомендаций:

1. Релевантность (Relevance) - насколько это подходит паре
2. Новизна (Novelty) - насколько это ново и неожиданно  
3. Эмпатия (Empathy) - насколько хорошо учитывает интересы обоих партнеров

Коммерческая цель: создать рекомендации, которые не просто точны, но и дарят эмоции
"""

import json
import os
import pickle
import time
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import GroupKFold
from sklearn.metrics import ndcg_score
from dataclasses import dataclass
import warnings
warnings.filterwarnings('ignore')

from content_recommender import ContentBasedRecommender
from collaborative_filtering import CollaborativeFilteringRecommender
from embedding_service import EmbeddingService
from personality_engine import PersonalityProfile, personality_engine

@dataclass
class MultiObjectiveScore:
    """Многоцелевая оценка рекомендации"""
    relevance: float  # Релевантность (0-1)
    novelty: float    # Новизна (0-1)
    empathy: float    # Эмпатия (0-1)
    combined: float   # Итоговая оценка
    
    def to_dict(self) -> Dict[str, float]:
        return {
            'relevance': self.relevance,
            'novelty': self.novelty,
            'empathy': self.empathy,
            'combined': self.combined
        }

class MultiObjectiveRanker:
    """
    Многоцелевой ранкер - следующее поколение рекомендательных систем
    
    Не просто подбирает подходящие места, а создает эмоционально значимые рекомендации,
    которые учитывают динамику отношений и создают новые впечатления
    """
    
    def __init__(self, data_path: str = 'data/synthetic_v2_enhanced'):
        """
        Инициализация многоцелевого ранкера
        
        Args:
            data_path: Путь к enhanced данным с OCEAN личностями
        """
        self.data_path = data_path
        print("🎯 Инициализируем Multi-Objective Ranker...")
        
        # Загружаем базовые компоненты
        self.content_recommender = ContentBasedRecommender(data_path)
        self.cf_recommender = CollaborativeFilteringRecommender(data_path)
        self.embedding_service = EmbeddingService(data_path)
        
        # Многоцелевая модель
        self.multi_objective_model = None
        self.feature_names = []
        self.feature_importance = {}
        
        # Веса для многоцелевой функции
        self.objective_weights = {
            'relevance': 0.5,   # Основа - релевантность
            'novelty': 0.3,     # Важна новизна для избежания рутины
            'empathy': 0.2      # Баланс интересов партнеров
        }
        
        # Параметры модели (настроенные для многоцелевой оптимизации)
        self.lgb_params = {
            'objective': 'lambdarank',
            'metric': 'ndcg',
            'boosting_type': 'gbdt',
            'num_leaves': 63,  # Увеличиваем для более сложной модели
            'learning_rate': 0.03,  # Снижаем для стабильности
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'lambda_l1': 0.1,
            'lambda_l2': 0.1,
            'min_data_in_leaf': 20,
            'min_gain_to_split': 0.1,
            'verbose': -1
        }
        
        # Подготавливаем компоненты
        self._prepare_components()
        
        # Загружаем enhanced данные если доступны
        self._load_enhanced_data()
    
    def _prepare_components(self):
        """Подготавливает все компоненты для работы"""
        print("⚙️ Подготавливаем компоненты Multi-Objective Ranker...")
        
        # Загружаем CF модель
        if os.path.exists('models/cf_svd_v1.pkl'):
            self.cf_recommender.load_model('models/cf_svd_v1')
        else:
            print("🔄 Тренируем CF модель...")
            self.cf_recommender.train_svd_model()
        
        # Загружаем эмбеддинги
        if not self.embedding_service.load_embeddings():
            print("🧠 Генерируем эмбеддинги...")
            self.embedding_service.generate_user_embeddings()
            self.embedding_service.generate_product_embeddings()
            self.embedding_service.generate_pair_embeddings()
            self.embedding_service.build_faiss_indexes()
            self.embedding_service.save_embeddings()
        
        print("✅ Компоненты готовы")
    
    def _load_enhanced_data(self):
        """Загружает enhanced данные с OCEAN личностями"""
        try:
            # Пытаемся загрузить enhanced данные
            enhanced_users_path = f"{self.data_path}/users.csv"
            enhanced_pairs_path = f"{self.data_path}/pairs.csv"
            enhanced_interactions_path = f"{self.data_path}/interactions.csv"
            
            if all(os.path.exists(p) for p in [enhanced_users_path, enhanced_pairs_path, enhanced_interactions_path]):
                print("📊 Загружаем Enhanced данные с OCEAN личностями...")
                self.enhanced_users = pd.read_csv(enhanced_users_path)
                self.enhanced_pairs = pd.read_csv(enhanced_pairs_path)
                self.enhanced_interactions = pd.read_csv(enhanced_interactions_path)
                print(f"✅ Enhanced данные загружены: {len(self.enhanced_users)} пользователей, {len(self.enhanced_pairs)} пар")
            else:
                print("⚠️ Enhanced данные не найдены, используем базовые")
                self.enhanced_users = None
                self.enhanced_pairs = None
                self.enhanced_interactions = None
                
        except Exception as e:
            print(f"⚠️ Ошибка загрузки enhanced данных: {e}")
            self.enhanced_users = None
            self.enhanced_pairs = None
            self.enhanced_interactions = None
    
    def calculate_relevance_score(self, pair_id: str, item_info: Dict, 
                                candidate_scores: Dict) -> float:
        """
        Вычисляет релевантность рекомендации (традиционная метрика)
        
        Args:
            pair_id: ID пары
            item_info: Информация о товаре
            candidate_scores: Scores от базовых моделей
            
        Returns:
            Релевантность (0-1)
        """
        # Базовая релевантность от существующих моделей
        content_score = candidate_scores.get('content_score', 0.0)
        cf_score = candidate_scores.get('cf_score', 0.0)
        embedding_score = candidate_scores.get('embedding_score', 0.0)
        
        # Взвешенная комбинация (проверенные веса)
        base_relevance = (
            content_score * 0.4 +
            cf_score * 0.3 +
            embedding_score * 0.3
        )
        
        # Дополнительные факторы релевантности
        relevance_boost = 0
        
        try:
            # Получаем информацию о паре
            if self.enhanced_pairs is not None:
                pair_info = self.enhanced_pairs[self.enhanced_pairs['id'] == pair_id]
                if not pair_info.empty:
                    harmony_index = pair_info.iloc[0].get('harmony_index', 0.5)
                    # Гармоничные пары получают бонус к релевантности
                    relevance_boost += harmony_index * 0.1
            
            # Бюджетное соответствие
            if 'price' in item_info:
                # Простая проверка бюджетного соответствия
                price = item_info['price']
                if 500 <= price <= 2500:  # Разумный диапазон
                    relevance_boost += 0.05
                elif price > 3000:  # Дорого
                    relevance_boost -= 0.1
        
        except Exception as e:
            # Игнорируем ошибки в расчете бонусов
            pass
        
        final_relevance = min(1.0, max(0.0, base_relevance + relevance_boost))
        return final_relevance
    
    def calculate_novelty_score(self, pair_id: str, item_info: Dict) -> float:
        """
        Вычисляет новизну рекомендации (инновационная метрика)
        
    Новизна важна для:
        - Предотвращения рутины в отношениях
        - Создания ярких впечатлений
        - Открытия новых интересов
        
        Args:
            pair_id: ID пары
            item_info: Информация о товаре
            
        Returns:
            Новизна (0-1)
        """
        novelty_score = 0.5  # Базовая новизна
        
        try:
            # 1. Внутренняя новизна товара
            item_novelty = item_info.get('novelty', 0.5)
            novelty_score += item_novelty * 0.3
            
            # 2. Новизна для конкретной пары
            if self.enhanced_interactions is not None:
                # Проверяем, посещала ли пара это место
                pair_interactions = self.enhanced_interactions[
                    self.enhanced_interactions['pair_id'] == pair_id
                ]
                
                item_title = item_info.get('title', '')
                visited_count = len(pair_interactions[
                    pair_interactions['product_id'] == item_title
                ])
                
                if visited_count == 0:
                    novelty_score += 0.3  # Новое место для пары
                elif visited_count == 1:
                    novelty_score += 0.1  # Было один раз - может стоит повторить
                else:
                    novelty_score -= 0.2 * min(visited_count - 1, 3)  # Штраф за частые посещения
                
                # 3. Новизна категории для пары
                item_category = item_info.get('category', '')
                category_interactions = pair_interactions[
                    pair_interactions['product_category'] == item_category
                ]
                
                if len(category_interactions) == 0:
                    novelty_score += 0.2  # Новая категория
            
            # 4. Сезонная/временная новизна
            current_season = self._get_current_season()
            item_tags = item_info.get('tags', [])
            
            seasonal_keywords = {
                'winter': ['новогодний', 'зимний', 'горячий'],
                'spring': ['весенний', 'свежий', 'цветущий'],
                'summer': ['летний', 'прохладный', 'открытый'],
                'autumn': ['осенний', 'уютный', 'теплый']
            }
            
            season_keywords = seasonal_keywords.get(current_season, [])
            for keyword in season_keywords:
                if any(keyword in tag.lower() for tag in item_tags):
                    novelty_score += 0.1
                    break
            
            # 5. Тренды и актуальность (симуляция)
            trending_categories = ['entertainment', 'activity']  # Симуляция трендовых категорий
            if item_category in trending_categories:
                novelty_score += 0.1
                
        except Exception as e:
            # В случае ошибки возвращаем базовую новизну
            pass
        
        return min(1.0, max(0.0, novelty_score))
    
    def calculate_empathy_score(self, pair_id: str, item_info: Dict) -> float:
        """
        Вычисляет эмпатию рекомендации (уникальная метрика)
        
        Эмпатия измеряет, насколько рекомендация учитывает интересы ОБОИХ партнеров
        и способствует гармонии в отношениях.
        
        Args:
            pair_id: ID пары
            item_info: Информация о товаре
            
        Returns:
            Эмпатия (0-1)
        """
        empathy_score = 0.3  # Базовая эмпатия
        
        try:
            # Получаем информацию о паре и пользователях
            if self.enhanced_pairs is not None and self.enhanced_users is not None:
                pair_info = self.enhanced_pairs[self.enhanced_pairs['id'] == pair_id]
                if pair_info.empty:
                    return 0.5
                
                pair_row = pair_info.iloc[0]
                user1_id = pair_row['user1_id']
                user2_id = pair_row['user2_id']
                
                user1 = self.enhanced_users[self.enhanced_users['id'] == user1_id]
                user2 = self.enhanced_users[self.enhanced_users['id'] == user2_id]
                
                if user1.empty or user2.empty:
                    return 0.5
                
                user1_row = user1.iloc[0]
                user2_row = user2.iloc[0]
                
                # 1. Баланс интересов
                item_tags = item_info.get('tags', [])
                
                # Получаем интересы пользователей (работаем с разными форматами)
                user1_interests = self._parse_interests(user1_row.get('interests', '{}'))
                user2_interests = self._parse_interests(user2_row.get('interests', '{}'))
                
                user1_appeal = self._calculate_interest_appeal(user1_interests, item_tags)
                user2_appeal = self._calculate_interest_appeal(user2_interests, item_tags)
                
                # Высокая эмпатия когда оба заинтересованы
                if user1_appeal > 0.5 and user2_appeal > 0.5:
                    empathy_score += 0.3
                elif abs(user1_appeal - user2_appeal) < 0.2:  # Схожий уровень интереса
                    empathy_score += 0.2
                elif max(user1_appeal, user2_appeal) > 0.8:  # Один очень заинтересован
                    empathy_score += 0.1
                
                # 2. Учет языков любви
                item_love_language = item_info.get('love_language', '')
                
                user1_love_langs = self._parse_love_languages(user1_row.get('love_languages', '{}'))
                user2_love_langs = self._parse_love_languages(user2_row.get('love_languages', '{}'))
                
                # Проверяем соответствие языкам любви
                user1_lang_match = user1_love_langs.get(item_love_language, 0.0)
                user2_lang_match = user2_love_langs.get(item_love_language, 0.0)
                
                avg_lang_match = (user1_lang_match + user2_lang_match) / 2
                empathy_score += avg_lang_match * 0.2
                
                # 3. Компромиссность на основе личности
                try:
                    user1_personality = self._parse_personality(user1_row.get('personality', '{}'))
                    user2_personality = self._parse_personality(user2_row.get('personality', '{}'))
                    
                    # Доброжелательные люди больше идут на компромиссы
                    avg_agreeableness = (
                        user1_personality.get('agreeableness', 0.5) +
                        user2_personality.get('agreeableness', 0.5)
                    ) / 2
                    
                    # Если активность требует компромисса, учитываем доброжелательность
                    if abs(user1_appeal - user2_appeal) > 0.3:  # Разные интересы
                        empathy_score += avg_agreeableness * 0.15
                        
                except:
                    pass
                
                # 4. Гармония пары
                harmony_index = pair_row.get('harmony_index', 0.5)
                if harmony_index > 0.7:  # Гармоничные пары
                    empathy_score += 0.1
                
                # 5. Подходящая цена для обоих
                item_price = item_info.get('price', 1000)
                user1_budget = user1_row.get('budget_preference', 'medium')
                user2_budget = user2_row.get('budget_preference', 'medium')
                
                budget_ranges = {'low': 1000, 'medium': 2500, 'high': 5000}
                user1_max = budget_ranges.get(user1_budget, 2500)
                user2_max = budget_ranges.get(user2_budget, 2500)
                
                if item_price <= min(user1_max, user2_max):
                    empathy_score += 0.1  # Доступно для обоих
                elif item_price <= max(user1_max, user2_max):
                    empathy_score += 0.05  # Доступно для одного
                
        except Exception as e:
            # В случае ошибки возвращаем базовую эмпатию
            pass
        
        return min(1.0, max(0.0, empathy_score))
    
    def _parse_interests(self, interests_str: str) -> Dict[str, float]:
        """Парсит интересы пользователя из строки"""
        try:
            if isinstance(interests_str, str):
                return eval(interests_str) if interests_str else {}
            elif isinstance(interests_str, dict):
                return interests_str
            else:
                return {}
        except:
            return {}
    
    def _parse_love_languages(self, love_langs_str: str) -> Dict[str, float]:
        """Парсит языки любви из строки"""
        try:
            if isinstance(love_langs_str, str):
                return eval(love_langs_str) if love_langs_str else {}
            elif isinstance(love_langs_str, dict):
                return love_langs_str
            else:
                return {}
        except:
            return {}
    
    def _parse_personality(self, personality_str: str) -> Dict[str, float]:
        """Парсит личность OCEAN из строки"""
        try:
            if isinstance(personality_str, str):
                return eval(personality_str) if personality_str else {}
            elif isinstance(personality_str, dict):
                return personality_str
            else:
                return {}
        except:
            return {}
    
    def _calculate_interest_appeal(self, interests: Dict[str, float], tags: List[str]) -> float:
        """Вычисляет привлекательность на основе интересов"""
        if not interests or not tags:
            return 0.3
        
        total_appeal = 0
        matches = 0
        
        for tag in tags:
            for interest, intensity in interests.items():
                if tag.lower() in interest.lower() or interest.lower() in tag.lower():
                    total_appeal += intensity / 10.0  # Нормализуем интенсивность
                    matches += 1
        
        if matches == 0:
            return 0.3
        
        return min(1.0, total_appeal / matches)
    
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
    
    def calculate_multi_objective_score(self, pair_id: str, item_info: Dict, 
                                      candidate_scores: Dict) -> MultiObjectiveScore:
        """
        Вычисляет полную многоцелевую оценку
        
        Args:
            pair_id: ID пары
            item_info: Информация о товаре
            candidate_scores: Базовые scores от моделей
            
        Returns:
            MultiObjectiveScore с детализацией
        """
        # Вычисляем каждую компоненту
        relevance = self.calculate_relevance_score(pair_id, item_info, candidate_scores)
        novelty = self.calculate_novelty_score(pair_id, item_info)
        empathy = self.calculate_empathy_score(pair_id, item_info)
        
        # Итоговая оценка как взвешенная сумма
        combined = (
            relevance * self.objective_weights['relevance'] +
            novelty * self.objective_weights['novelty'] +
            empathy * self.objective_weights['empathy']
        )
        
        return MultiObjectiveScore(
            relevance=round(relevance, 3),
            novelty=round(novelty, 3),
            empathy=round(empathy, 3),
            combined=round(combined, 3)
        )
    
    def extract_enhanced_features(self, pair_id: str, item_id: str, candidate: Dict) -> Dict[str, float]:
        """
        Извлекает расширенный набор фич для многоцелевого ранжирования
        
        Включает все базовые фичи + новые многоцелевые метрики
        """
        features = {}
        
        # 1. Базовые scores от разных моделей
        features['content_score'] = candidate.get('content_score', 0.0)
        features['cf_score'] = candidate.get('cf_score', 0.0)
        features['embedding_score'] = candidate.get('embedding_score', 0.0)
        
        # 2. Многоцелевые scores
        item_info = {
            'title': candidate.get('title', ''),
            'category': candidate.get('category', 'unknown'),
            'price': candidate.get('price', 1000),
            'tags': candidate.get('tags', []),
            'love_language': candidate.get('love_language', 'quality_time'),
            'novelty': candidate.get('novelty', 0.5)
        }
        
        multi_scores = self.calculate_multi_objective_score(pair_id, item_info, candidate)
        features['relevance_score'] = multi_scores.relevance
        features['novelty_score'] = multi_scores.novelty
        features['empathy_score'] = multi_scores.empathy
        
        # 3. Информация о товаре
        features['price'] = item_info['price'] / 1000.0  # Нормализуем
        features['price_log'] = np.log1p(item_info['price'])
        features['item_novelty'] = item_info.get('novelty', 0.5)
        
        # 4. Категориальные фичи
        category = item_info['category']
        features['is_restaurant'] = 1.0 if category == 'restaurant' else 0.0
        features['is_cafe'] = 1.0 if category == 'cafe' else 0.0
        features['is_entertainment'] = 1.0 if category == 'entertainment' else 0.0
        features['is_activity'] = 1.0 if category == 'activity' else 0.0
        features['is_bar'] = 1.0 if category == 'bar' else 0.0
        features['is_gift'] = 1.0 if category == 'gift' else 0.0
        
        # 5. Фичи пары и пользователей
        pair_features = self._get_enhanced_pair_features(pair_id)
        features.update(pair_features)
        
        # 6. Временные и контекстные фичи
        features['day_of_week'] = datetime.now().weekday()
        features['is_weekend'] = 1.0 if datetime.now().weekday() >= 5 else 0.0
        features['hour_of_day'] = datetime.now().hour / 24.0
        
        # 7. Комбинированные фичи
        features['relevance_novelty_product'] = features['relevance_score'] * features['novelty_score']
        features['empathy_relevance_product'] = features['empathy_score'] * features['relevance_score']
        features['all_objectives_product'] = features['relevance_score'] * features['novelty_score'] * features['empathy_score']
        
        # 8. Дополнительные многоцелевые фичи
        features['novelty_vs_relevance_ratio'] = features['novelty_score'] / max(0.1, features['relevance_score'])
        features['empathy_vs_relevance_ratio'] = features['empathy_score'] / max(0.1, features['relevance_score'])
        
        # 9. Цена vs цели
        features['price_empathy_interaction'] = features['price'] * features['empathy_score']
        features['novelty_price_interaction'] = features['novelty_score'] / max(0.1, features['price'])
        
        return features
    
    def _get_enhanced_pair_features(self, pair_id: str) -> Dict[str, float]:
        """Извлекает улучшенные фичи пары с OCEAN личностями"""
        features = {}
        
        try:
            if self.enhanced_pairs is not None and self.enhanced_users is not None:
                pair_info = self.enhanced_pairs[self.enhanced_pairs['id'] == pair_id]
                if not pair_info.empty:
                    pair_row = pair_info.iloc[0]
                    
                    # Метрики отношений
                    features['harmony_index'] = pair_row.get('harmony_index', 0.5)
                    features['routine_index'] = pair_row.get('routine_index', 0.0)
                    features['adventure_appetite'] = pair_row.get('adventure_appetite', 0.5)
                    
                    # Получаем пользователей
                    user1_id = pair_row['user1_id']
                    user2_id = pair_row['user2_id']
                    
                    user1 = self.enhanced_users[self.enhanced_users['id'] == user1_id]
                    user2 = self.enhanced_users[self.enhanced_users['id'] == user2_id]
                    
                    if not user1.empty and not user2.empty:
                        user1_row = user1.iloc[0]
                        user2_row = user2.iloc[0]
                        
                        # Базовые демографические фичи
                        features['age_diff'] = abs(user1_row['age'] - user2_row['age']) / 50.0
                        features['avg_age'] = (user1_row['age'] + user2_row['age']) / 2.0 / 50.0
                        
                        # Архетипы
                        features['same_archetype'] = 1.0 if user1_row['archetype'] == user2_row['archetype'] else 0.0
                        
                        # OCEAN личность фичи
                        try:
                            user1_personality = self._parse_personality(user1_row.get('personality', '{}'))
                            user2_personality = self._parse_personality(user2_row.get('personality', '{}'))
                            
                            # Средние значения OCEAN
                            features['avg_openness'] = (user1_personality.get('openness', 0.5) + 
                                                       user2_personality.get('openness', 0.5)) / 2
                            features['avg_conscientiousness'] = (user1_personality.get('conscientiousness', 0.5) + 
                                                                user2_personality.get('conscientiousness', 0.5)) / 2
                            features['avg_extraversion'] = (user1_personality.get('extraversion', 0.5) + 
                                                           user2_personality.get('extraversion', 0.5)) / 2
                            features['avg_agreeableness'] = (user1_personality.get('agreeableness', 0.5) + 
                                                            user2_personality.get('agreeableness', 0.5)) / 2
                            features['avg_neuroticism'] = (user1_personality.get('neuroticism', 0.5) + 
                                                          user2_personality.get('neuroticism', 0.5)) / 2
                            
                            # Различия в OCEAN (важно для совместимости)
                            features['openness_diff'] = abs(user1_personality.get('openness', 0.5) - 
                                                           user2_personality.get('openness', 0.5))
                            features['agreeableness_diff'] = abs(user1_personality.get('agreeableness', 0.5) - 
                                                               user2_personality.get('agreeableness', 0.5))
                            
                            # Специальные комбинации
                            features['both_open'] = 1.0 if (user1_personality.get('openness', 0.5) > 0.7 and 
                                                           user2_personality.get('openness', 0.5) > 0.7) else 0.0
                            features['both_agreeable'] = 1.0 if (user1_personality.get('agreeableness', 0.5) > 0.7 and 
                                                                user2_personality.get('agreeableness', 0.5) > 0.7) else 0.0
                            
                        except:
                            # Фолбэк значения
                            for key in ['avg_openness', 'avg_conscientiousness', 'avg_extraversion', 
                                       'avg_agreeableness', 'avg_neuroticism', 'openness_diff', 
                                       'agreeableness_diff', 'both_open', 'both_agreeable']:
                                features[key] = 0.5
                        
                        # Бюджетная совместимость
                        budget_match = 1.0 if user1_row['budget_preference'] == user2_row['budget_preference'] else 0.0
                        features['budget_match'] = budget_match
                        
                        # Активность
                        features['avg_activity'] = (user1_row.get('activity_probability', 0.5) + 
                                                   user2_row.get('activity_probability', 0.5)) / 2
                        
            # Фолбэк значения если данные недоступны
            for key in ['harmony_index', 'routine_index', 'adventure_appetite', 'age_diff', 'avg_age',
                       'same_archetype', 'budget_match', 'avg_activity']:
                if key not in features:
                    features[key] = 0.5
                    
        except Exception as e:
            # В случае ошибки заполняем фолбэк значениями
            default_features = {
                'harmony_index': 0.5, 'routine_index': 0.0, 'adventure_appetite': 0.5,
                'age_diff': 0.3, 'avg_age': 0.6, 'same_archetype': 0.0,
                'avg_openness': 0.5, 'avg_conscientiousness': 0.5, 'avg_extraversion': 0.5,
                'avg_agreeableness': 0.5, 'avg_neuroticism': 0.5,
                'openness_diff': 0.3, 'agreeableness_diff': 0.3,
                'both_open': 0.0, 'both_agreeable': 0.0,
                'budget_match': 0.5, 'avg_activity': 0.5
            }
            features.update(default_features)
        
        return features
    
    def create_multi_objective_training_dataset(self, sample_pairs: int = 300) -> Tuple[pd.DataFrame, List[int]]:
        """
        Создает training dataset для многоцелевого ранжирования
        
        Args:
            sample_pairs: Количество пар для обучения
            
        Returns:
            (features_df, groups) - фичи и группы для LightGBM
        """
        print(f"🎯 Создаем Multi-Objective training dataset для {sample_pairs} пар...")
        
        # Выбираем пары (preferably enhanced if available)
        if self.enhanced_pairs is not None:
            all_pairs = self.enhanced_pairs['id'].tolist()
            print(f"📊 Используем Enhanced данные: {len(all_pairs)} пар доступно")
        else:
            all_pairs = self.content_recommender.pairs['id'].tolist()
            print(f"📊 Используем базовые данные: {len(all_pairs)} пар доступно")
        
        sample_pair_ids = np.random.choice(all_pairs, min(sample_pairs, len(all_pairs)), replace=False)
        
        training_data = []
        groups = []
        
        for pair_idx, pair_id in enumerate(sample_pair_ids):
            try:
                # Получаем кандидатов (используем базовую логику но с enhanced фичами)
                candidates = self._get_candidates_for_pair(pair_id)
                
                if len(candidates) == 0:
                    continue
                
                # Получаем лейблы для многоцелевого обучения
                labels = self._get_multi_objective_labels(pair_id, candidates)
                
                # Генерируем enhanced фичи
                for candidate in candidates:
                    item_id = candidate['item_id']
                    
                    # Извлекаем enhanced фичи
                    features = self.extract_enhanced_features(pair_id, item_id, candidate)
                    
                    # Получаем многоцелевой лейбл
                    label = labels.get(item_id, 0)
                    
                    # Добавляем в dataset
                    row = {
                        'pair_id': pair_id,
                        'item_id': item_id,
                        'label': label,
                        **features
                    }
                    training_data.append(row)
                
                groups.append(len(candidates))
                
                if pair_idx % 50 == 0:
                    print(f"  Обработано пар: {pair_idx + 1}/{len(sample_pair_ids)}")
                
            except Exception as e:
                print(f"⚠️ Ошибка обработки пары {pair_id}: {e}")
                continue
        
        features_df = pd.DataFrame(training_data)
        
        print(f"✅ Multi-Objective training dataset создан:")
        print(f"  - Общее количество записей: {len(features_df)}")
        print(f"  - Количество групп (пар): {len(groups)}")
        print(f"  - Количество фич: {len(features_df.columns) - 3}")
        print(f"  - Новых многоцелевых фич: relevance_score, novelty_score, empathy_score")
        
        return features_df, groups
    
    def _get_candidates_for_pair(self, pair_id: str, max_candidates: int = 40) -> List[Dict]:
        """Получает кандидатов от всех источников (базовая логика)"""
        candidates = {}
        
        # Content-based кандидаты
        try:
            content_recs = self.content_recommender.recommend_date(pair_id, top_k=15)
            for rec in content_recs:
                candidates[rec.item_id] = {
                    'item_id': rec.item_id,
                    'title': rec.title,
                    'category': rec.category,
                    'price': rec.price,
                    'content_score': rec.score,
                    'tags': getattr(rec, 'tags', []),
                    'love_language': getattr(rec, 'love_language', 'quality_time'),
                    'novelty': getattr(rec, 'novelty', 0.5)
                }
        except:
            pass
        
        # CF кандидаты
        try:
            cf_recs = self.cf_recommender.get_pair_recommendations(pair_id, top_k=15)
            for rec in cf_recs:
                item_id = rec['item_id']
                if item_id in candidates:
                    candidates[item_id]['cf_score'] = rec['combined_rating'] / 10.0
                else:
                    product_info = self._get_product_info(item_id)
                    candidates[item_id] = {
                        'item_id': item_id,
                        'title': product_info.get('title', 'Unknown'),
                        'category': product_info.get('category', 'unknown'),
                        'price': product_info.get('price', 0),
                        'content_score': 0.0,
                        'cf_score': rec['combined_rating'] / 10.0,
                        'tags': product_info.get('tags', []),
                        'love_language': product_info.get('love_language', 'quality_time'),
                        'novelty': product_info.get('novelty', 0.5)
                    }
        except:
            pass
        
        # Embedding кандидаты
        try:
            embedding_recs = self.embedding_service.find_similar_products_ann(pair_id, top_k=15)
            for rec in embedding_recs:
                item_id = rec['item_id']
                if item_id in candidates:
                    candidates[item_id]['embedding_score'] = rec['embedding_similarity']
                else:
                    candidates[item_id] = {
                        'item_id': item_id,
                        'title': rec['title'],
                        'category': rec['category'],
                        'price': rec['price'],
                        'content_score': 0.0,
                        'cf_score': 0.0,
                        'embedding_score': rec['embedding_similarity'],
                        'tags': rec.get('tags', []),
                        'love_language': rec.get('love_language', 'quality_time'),
                        'novelty': rec.get('novelty', 0.5)
                    }
        except:
            pass
        
        # Заполняем отсутствующие scores
        for candidate in candidates.values():
            candidate.setdefault('content_score', 0.0)
            candidate.setdefault('cf_score', 0.0)
            candidate.setdefault('embedding_score', 0.0)
        
        return list(candidates.values())[:max_candidates]
    
    def _get_multi_objective_labels(self, pair_id: str, candidates: List[Dict]) -> Dict[str, float]:
        """
        Создает многоцелевые лейблы для обучения
        
        Лейбл учитывает не только традиционный рейтинг, но и новизну/эмпатию
        """
        labels = {}
        
        try:
            # Базовые лейблы от взаимодействий
            base_labels = self._get_base_labels_from_interactions(pair_id, candidates)
            
            # Дополняем многоцелевыми метриками
            for candidate in candidates:
                item_id = candidate['item_id']
                
                # Базовый лейбл
                base_label = base_labels.get(item_id, 0)
                
                # Вычисляем многоцелевые scores
                item_info = {
                    'title': candidate.get('title', ''),
                    'category': candidate.get('category', ''),
                    'price': candidate.get('price', 1000),
                    'tags': candidate.get('tags', []),
                    'love_language': candidate.get('love_language', 'quality_time'),
                    'novelty': candidate.get('novelty', 0.5)
                }
                
                multi_scores = self.calculate_multi_objective_score(pair_id, item_info, candidate)
                
                # Комбинируем базовый лейбл с многоцелевыми scores
                enhanced_label = (
                    base_label * 0.6 +  # Базовый рейтинг пользователей
                    multi_scores.combined * 3.0 * 0.4  # Многоцелевая оценка (scale to 0-3)
                )
                
                # Конвертируем в дискретные лейблы для LTR
                if enhanced_label >= 2.5:
                    labels[item_id] = 3  # Очень релевантно
                elif enhanced_label >= 1.8:
                    labels[item_id] = 2  # Релевантно
                elif enhanced_label >= 1.2:
                    labels[item_id] = 1  # Слабо релевантно
                else:
                    labels[item_id] = 0  # Не релевантно
                    
        except Exception as e:
            print(f"⚠️ Ошибка создания многоцелевых лейблов для пары {pair_id}: {e}")
            # Фолбэк на простые лейблы
            for candidate in candidates:
                item_id = candidate['item_id']
                # Простой лейбл на основе базовых scores
                simple_score = (
                    candidate.get('content_score', 0) * 0.4 +
                    candidate.get('cf_score', 0) * 0.3 +
                    candidate.get('embedding_score', 0) * 0.3
                )
                
                if simple_score >= 0.7:
                    labels[item_id] = 2
                elif simple_score >= 0.5:
                    labels[item_id] = 1
                else:
                    labels[item_id] = 0
        
        return labels
    
    def _get_base_labels_from_interactions(self, pair_id: str, candidates: List[Dict]) -> Dict[str, float]:
        """Получает базовые лейблы от существующих взаимодействий"""
        labels = {}
        
        try:
            # Используем enhanced interactions если доступны
            interactions_data = self.enhanced_interactions if self.enhanced_interactions is not None else self.content_recommender.interactions
            
            # Получаем пользователей пары
            if self.enhanced_pairs is not None:
                pair_info = self.enhanced_pairs[self.enhanced_pairs['id'] == pair_id]
            else:
                pair_info = self.content_recommender.pairs[self.content_recommender.pairs['id'] == pair_id]
            
            if pair_info.empty:
                return labels
            
            pair_row = pair_info.iloc[0]
            user1_id = pair_row['user1_id']
            user2_id = pair_row['user2_id']
            
            # Получаем взаимодействия
            user_interactions = interactions_data[
                (interactions_data['user_id'] == user1_id) |
                (interactions_data['user_id'] == user2_id)
            ]
            
            # Создаем лейблы на основе рейтингов
            for _, interaction in user_interactions.iterrows():
                product_id = interaction['product_id']
                rating = interaction.get('rating', 5)
                
                if pd.isna(rating):
                    continue
                
                # Конвертируем рейтинг в relevance score
                relevance = rating / 10.0  # Нормализуем
                
                # Берем максимальный рейтинг если оба пользователя оценили
                if product_id in labels:
                    labels[product_id] = max(labels[product_id], relevance)
                else:
                    labels[product_id] = relevance
                    
        except Exception as e:
            pass
        
        return labels
    
    def _get_product_info(self, item_id: str) -> Dict:
        """Получает информацию о продукте"""
        try:
            product = self.content_recommender.product_catalog[
                self.content_recommender.product_catalog['id'] == item_id
            ]
            if not product.empty:
                return product.iloc[0].to_dict()
        except:
            pass
        return {}
    
    def train_multi_objective_model(self, training_data: pd.DataFrame, groups: List[int], 
                                  validation_split: float = 0.2, n_folds: int = 3) -> Dict:
        """
        Обучает многоцелевую LightGBM модель
        
        Args:
            training_data: Training dataset with enhanced features
            groups: Размеры групп для каждой пары
            validation_split: Доля данных для валидации
            n_folds: Количество фолдов для кросс-валидации
            
        Returns:
            Метрики обучения
        """
        print("🎯 Обучаем Multi-Objective LightGBM модель...")
        
        # Подготавливаем данные
        feature_cols = [col for col in training_data.columns 
                       if col not in ['pair_id', 'item_id', 'label']]
        self.feature_names = feature_cols
        
        X = training_data[feature_cols].values
        y = training_data['label'].values
        
        print(f"📊 Данные для многоцелевого обучения:")
        print(f"  - Фичи: {X.shape}")
        print(f"  - Лейблы: {y.shape}")
        print(f"  - Группы: {len(groups)}")
        print(f"  - Новых многоцелевых фич: {len([f for f in feature_cols if any(obj in f for obj in ['relevance', 'novelty', 'empathy'])])}")
        
        # Группированная кросс-валидация
        group_kfold = GroupKFold(n_splits=n_folds)
        cv_scores = []
        feature_importances = []
        
        pair_groups = training_data['pair_id'].values
        
        fold = 0
        for train_idx, val_idx in group_kfold.split(X, y, groups=pair_groups):
            fold += 1
            print(f"  📊 Фолд {fold}/{n_folds}")
            
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            # Определяем группы для train и val
            train_groups = []
            val_groups = []
            
            # Простой подход: равномерно распределяем группы
            train_pair_count = len(set(training_data.iloc[train_idx]['pair_id']))
            val_pair_count = len(set(training_data.iloc[val_idx]['pair_id']))
            
            # Приблизительные размеры групп
            avg_group_size = len(training_data) // len(groups)
            train_groups = [avg_group_size] * train_pair_count
            val_groups = [avg_group_size] * val_pair_count
            
            # Корректируем если необходимо
            if sum(train_groups) != len(X_train):
                train_groups[-1] += len(X_train) - sum(train_groups)
            if sum(val_groups) != len(X_val):
                val_groups[-1] += len(X_val) - sum(val_groups)
            
            # Обучаем модель
            train_data = lgb.Dataset(X_train, label=y_train, group=train_groups)
            val_data = lgb.Dataset(X_val, label=y_val, group=val_groups, reference=train_data)
            
            model = lgb.train(
                self.lgb_params,
                train_data,
                valid_sets=[val_data],
                num_boost_round=1000,
                callbacks=[lgb.early_stopping(50), lgb.log_evaluation(100)]
            )
            
            # Предсказания для валидации
            y_pred = model.predict(X_val)
            
            # Вычисляем NDCG@10
            try:
                ndcg_scores = []
                start_idx = 0
                for group_size in val_groups:
                    end_idx = start_idx + group_size
                    if group_size > 1:
                        group_true = y_val[start_idx:end_idx]
                        group_pred = y_pred[start_idx:end_idx]
                        
                        ndcg = ndcg_score([group_true], [group_pred], k=min(10, group_size))
                        ndcg_scores.append(ndcg)
                    
                    start_idx = end_idx
                
                if ndcg_scores:
                    fold_ndcg = np.mean(ndcg_scores)
                    cv_scores.append(fold_ndcg)
                    print(f"    Multi-Objective NDCG@10: {fold_ndcg:.4f}")
                    
            except Exception as e:
                print(f"    ⚠️ Ошибка расчета NDCG: {e}")
            
            # Feature importance
            importance = model.feature_importance(importance_type='gain')
            feature_importances.append(importance)
        
        # Финальное обучение на всех данных
        print("🎯 Финальное обучение Multi-Objective модели на всех данных...")
        train_data = lgb.Dataset(X, label=y, group=groups)
        
        self.multi_objective_model = lgb.train(
            self.lgb_params,
            train_data,
            num_boost_round=1000,
            callbacks=[lgb.log_evaluation(100)]
        )
        
        # Feature importance
        if feature_importances:
            avg_importance = np.mean(feature_importances, axis=0)
            self.feature_importance = dict(zip(self.feature_names, avg_importance))
        
        # Метрики
        metrics = {
            'cv_ndcg_mean': np.mean(cv_scores) if cv_scores else 0.0,
            'cv_ndcg_std': np.std(cv_scores) if cv_scores else 0.0,
            'n_folds': len(cv_scores),
            'feature_count': len(self.feature_names),
            'multi_objective_features': len([f for f in self.feature_names if any(obj in f for obj in ['relevance', 'novelty', 'empathy'])]),
            'training_samples': len(training_data),
            'training_groups': len(groups)
        }
        
        print(f"✅ Multi-Objective обучение завершено:")
        print(f"  CV NDCG@10: {metrics['cv_ndcg_mean']:.4f} ± {metrics['cv_ndcg_std']:.4f}")
        print(f"  Всего фич: {metrics['feature_count']}")
        print(f"  Многоцелевых фич: {metrics['multi_objective_features']}")
        
        return metrics
    
    def rank_candidates_multi_objective(self, pair_id: str, candidates: List[Dict]) -> List[Dict]:
        """
        Ранжирует кандидатов с помощью многоцелевой модели
        
        Args:
            pair_id: ID пары
            candidates: Список кандидатов
            
        Returns:
            Отсортированный список с многоцелевыми оценками
        """
        if self.multi_objective_model is None:
            print("⚠️ Multi-Objective модель не обучена")
            return candidates
        
        try:
            # Извлекаем enhanced фичи для каждого кандидата
            features_list = []
            for candidate in candidates:
                features = self.extract_enhanced_features(pair_id, candidate['item_id'], candidate)
                feature_vector = [features.get(name, 0.0) for name in self.feature_names]
                features_list.append(feature_vector)
            
            if not features_list:
                return candidates
            
            # Предсказываем relevance scores
            X = np.array(features_list)
            scores = self.multi_objective_model.predict(X)
            
            # Добавляем scores и детализированные метрики
            enhanced_candidates = []
            for i, candidate in enumerate(candidates):
                # Вычисляем детализированные многоцелевые оценки
                item_info = {
                    'title': candidate.get('title', ''),
                    'category': candidate.get('category', ''),
                    'price': candidate.get('price', 1000),
                    'tags': candidate.get('tags', []),
                    'love_language': candidate.get('love_language', 'quality_time'),
                    'novelty': candidate.get('novelty', 0.5)
                }
                
                multi_scores = self.calculate_multi_objective_score(pair_id, item_info, candidate)
                
                enhanced_candidate = candidate.copy()
                enhanced_candidate.update({
                    'multi_objective_score': scores[i],
                    'relevance_score': multi_scores.relevance,
                    'novelty_score': multi_scores.novelty,
                    'empathy_score': multi_scores.empathy,
                    'combined_score': multi_scores.combined,
                    'method': 'multi_objective_ranker'
                })
                
                enhanced_candidates.append(enhanced_candidate)
            
            # Сортируем по multi-objective score
            ranked_candidates = sorted(enhanced_candidates, 
                                     key=lambda x: x['multi_objective_score'], reverse=True)
            
            return ranked_candidates
            
        except Exception as e:
            print(f"❌ Ошибка многоцелевого ранжирования для пары {pair_id}: {e}")
            return candidates
    
    def save_multi_objective_model(self, model_path: str = 'models/multi_objective_v1'):
        """Сохраняет многоцелевую модель"""
        if self.multi_objective_model is None:
            print("⚠️ Нет модели для сохранения")
            return
        
        # Сохраняем LightGBM модель
        self.multi_objective_model.save_model(f'{model_path}.txt')
        
        # Сохраняем метаданные
        metadata = {
            'model_id': 'multi_objective_v1',
            'type': 'multi_objective_learning_to_rank',
            'version': '1.0',
            'algorithm': 'lightgbm_multi_objective_ranker',
            'feature_names': self.feature_names,
            'feature_importance': self.feature_importance,
            'objective_weights': self.objective_weights,
            'lgb_params': self.lgb_params,
            'objectives': ['relevance', 'novelty', 'empathy'],
            'created_at': datetime.now().isoformat()
        }
        
        with open(f'{model_path}_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Multi-Objective модель сохранена в {model_path}")
    
    def load_multi_objective_model(self, model_path: str = 'models/multi_objective_v1'):
        """Загружает многоцелевую модель"""
        try:
            # Загружаем LightGBM модель
            self.multi_objective_model = lgb.Booster(model_file=f'{model_path}.txt')
            
            # Загружаем метаданные
            with open(f'{model_path}_metadata.json', 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            self.feature_names = metadata['feature_names']
            self.feature_importance = metadata['feature_importance']
            self.objective_weights = metadata['objective_weights']
            
            print(f"✅ Multi-Objective модель загружена из {model_path}")
            return True
            
        except Exception as e:
            print(f"⚠️ Не удалось загрузить Multi-Objective модель: {e}")
            return False
    
    def get_feature_importance(self, top_k: int = 15) -> Dict[str, float]:
        """Возвращает важность фич с выделением многоцелевых"""
        if not self.feature_importance:
            return {}
        
        sorted_features = sorted(self.feature_importance.items(), 
                               key=lambda x: x[1], reverse=True)
        
        return dict(sorted_features[:top_k])
    
    def analyze_multi_objective_performance(self, test_pairs: List[str] = None, num_test_pairs: int = 50) -> Dict:
        """
        Анализирует производительность многоцелевой модели
        
        Args:
            test_pairs: Список пар для тестирования
            num_test_pairs: Количество случайных пар для тестирования
            
        Returns:
            Детальная аналитика производительности
        """
        print("📊 Анализируем производительность Multi-Objective Ranker...")
        
        if test_pairs is None:
            # Выбираем случайные пары для тестирования
            if self.enhanced_pairs is not None:
                all_pairs = self.enhanced_pairs['id'].tolist()
            else:
                all_pairs = self.content_recommender.pairs['id'].tolist()
            
            test_pairs = np.random.choice(all_pairs, min(num_test_pairs, len(all_pairs)), replace=False)
        
        analysis_results = {
            'tested_pairs': len(test_pairs),
            'objective_scores': {'relevance': [], 'novelty': [], 'empathy': [], 'combined': []},
            'performance_metrics': {},
            'feature_analysis': {},
            'examples': []
        }
        
        for pair_id in test_pairs[:min(num_test_pairs, len(test_pairs))]:
            try:
                # Получаем кандидатов
                candidates = self._get_candidates_for_pair(pair_id, max_candidates=20)
                
                if len(candidates) < 3:
                    continue
                
                # Ранжируем с помощью многоцелевой модели
                ranked_candidates = self.rank_candidates_multi_objective(pair_id, candidates)
                
                # Анализируем топ-5 рекомендаций
                top_recommendations = ranked_candidates[:5]
                
                for rec in top_recommendations:
                    analysis_results['objective_scores']['relevance'].append(rec.get('relevance_score', 0))
                    analysis_results['objective_scores']['novelty'].append(rec.get('novelty_score', 0))
                    analysis_results['objective_scores']['empathy'].append(rec.get('empathy_score', 0))
                    analysis_results['objective_scores']['combined'].append(rec.get('combined_score', 0))
                
                # Сохраняем пример для демонстрации
                if len(analysis_results['examples']) < 3:
                    example = {
                        'pair_id': pair_id,
                        'top_3_recommendations': [
                            {
                                'title': rec['title'],
                                'relevance': rec.get('relevance_score', 0),
                                'novelty': rec.get('novelty_score', 0),
                                'empathy': rec.get('empathy_score', 0),
                                'combined': rec.get('combined_score', 0),
                                'multi_objective_score': rec.get('multi_objective_score', 0)
                            }
                            for rec in top_recommendations[:3]
                        ]
                    }
                    analysis_results['examples'].append(example)
                    
            except Exception as e:
                print(f"⚠️ Ошибка анализа пары {pair_id}: {e}")
                continue
        
        # Вычисляем статистики
        for objective, scores in analysis_results['objective_scores'].items():
            if scores:
                analysis_results['performance_metrics'][objective] = {
                    'mean': round(np.mean(scores), 3),
                    'std': round(np.std(scores), 3),
                    'min': round(np.min(scores), 3),
                    'max': round(np.max(scores), 3)
                }
        
        # Анализ важности фич
        analysis_results['feature_analysis'] = {
            'top_features': self.get_feature_importance(10),
            'multi_objective_features': {
                name: importance for name, importance in self.feature_importance.items()
                if any(obj in name for obj in ['relevance', 'novelty', 'empathy'])
            }
        }
        
        return analysis_results

def main():
    """Демонстрация работы Multi-Objective Ranker"""
    print("🎯 Запуск Multi-Objective Ranker - Фаза 2.1")
    print("🚀 Многоцелевое ранжирование: Релевантность + Новизна + Эмпатия")
    
    # Инициализируем ранкер
    ranker = MultiObjectiveRanker()
    
    # Пытаемся загрузить существующую модель
    if not ranker.load_multi_objective_model():
        print("🔄 Обучаем новую Multi-Objective модель...")
        
        # Создаем training dataset
        training_data, groups = ranker.create_multi_objective_training_dataset(sample_pairs=150)
        
        if len(training_data) == 0:
            print("❌ Не удалось создать training dataset")
            return
        
        # Обучаем модель
        metrics = ranker.train_multi_objective_model(training_data, groups)
        
        # Сохраняем модель
        ranker.save_multi_objective_model()
        
        print(f"\n📈 Результаты обучения Multi-Objective модели:")
        print(f"  CV NDCG@10: {metrics['cv_ndcg_mean']:.4f} ± {metrics['cv_ndcg_std']:.4f}")
        print(f"  Многоцелевых фич: {metrics['multi_objective_features']}")
    
    # Тестируем многоцелевое ранжирование
    if ranker.enhanced_pairs is not None:
        test_pair_id = ranker.enhanced_pairs['id'].iloc[0]
    else:
        test_pair_id = ranker.content_recommender.pairs['id'].iloc[0]
    
    print(f"\n🎯 Тестируем Multi-Objective ранжирование для пары: {test_pair_id}")
    
    # Получаем кандидатов
    candidates = ranker._get_candidates_for_pair(test_pair_id, max_candidates=10)
    
    if candidates:
        # Ранжируем кандидатов
        ranked_candidates = ranker.rank_candidates_multi_objective(test_pair_id, candidates)
        
        print(f"\n📋 Топ-5 Multi-Objective рекомендаций:")
        for i, candidate in enumerate(ranked_candidates[:5], 1):
            print(f"{i}. {candidate['title']}")
            print(f"   Multi-Objective Score: {candidate.get('multi_objective_score', 0):.4f}")
            print(f"   Релевантность: {candidate.get('relevance_score', 0):.3f} | " +
                  f"Новизна: {candidate.get('novelty_score', 0):.3f} | " +
                  f"Эмпатия: {candidate.get('empathy_score', 0):.3f}")
            print(f"   Цена: {candidate['price']} руб. | Категория: {candidate['category']}")
            print()
    
    # Анализируем производительность
    print("\n📊 Анализируем производительность системы...")
    analysis = ranker.analyze_multi_objective_performance(num_test_pairs=20)
    
    print(f"\n📈 Статистика Multi-Objective scores:")
    for objective, stats in analysis['performance_metrics'].items():
        print(f"  {objective.title()}: μ={stats['mean']:.3f} σ={stats['std']:.3f} [{stats['min']:.3f}, {stats['max']:.3f}]")
    
    # Топ важных фич
    feature_importance = ranker.get_feature_importance(top_k=10)
    if feature_importance:
        print(f"\n🔍 Топ-10 важных фич Multi-Objective модели:")
        for i, (feature, importance) in enumerate(feature_importance.items(), 1):
            print(f"{i:2d}. {feature}: {importance:.3f}")
    
    print(f"\n🎉 Multi-Objective Ranker готов!")
    print(f"✅ Фаза 2.1 (Многоцелевое ранжирование) завершена успешно!")

if __name__ == "__main__":
    main()
