#!/usr/bin/env python3
"""
Content-Based Recommendation System для LoveMemory AI
Фаза 4: Baseline content-based рекомендации

Функции:
- recommend_date(pair_id, top_k=10) - основные рекомендации
- calculate_similarity_score - подсчет сходства профилей
- haversine_distance - расстояние между координатами
- gaussian_smoothing - сглаживание для distance_score
"""

import json
import math
import random
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dataclasses import dataclass

@dataclass
class RecommendationResult:
    """Результат рекомендации"""
    item_id: str
    title: str
    category: str
    score: float
    reasons: List[str]
    price: float
    location: Optional[Tuple[float, float]] = None

class ContentBasedRecommender:
    """Content-based рекомендательная система"""
    
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        """Инициализация с загрузкой данных"""
        self.data_path = data_path
        self.users = None
        self.pairs = None
        self.interactions = None
        self.product_catalog = None
        
        # Весовые коэффициенты (настраиваемые)
        self.weights = {
            'interest_overlap': 0.6,
            'distance_score': 0.2,
            'price_match': 0.2
        }
        
        # Параметры для distance scoring
        self.distance_params = {
            'max_distance_km': 50,  # Максимальное расстояние для рекомендаций
            'gaussian_sigma': 10    # Параметр сглаживания для гауссовой функции
        }
        
        self.load_data()
    
    def load_data(self):
        """Загружает синтетические данные"""
        try:
            print("📊 Загружаем синтетические данные...")
            
            # Загружаем CSV файлы
            self.users = pd.read_csv(f'{self.data_path}/users.csv')
            self.pairs = pd.read_csv(f'{self.data_path}/pairs.csv')
            self.interactions = pd.read_csv(f'{self.data_path}/interactions.csv')
            self.product_catalog = pd.read_csv(f'{self.data_path}/product_catalog.csv')
            
            print(f"✅ Данные загружены:")
            print(f"  - Пользователей: {len(self.users)}")
            print(f"  - Пар: {len(self.pairs)}")
            print(f"  - Взаимодействий: {len(self.interactions)}")
            print(f"  - Товаров: {len(self.product_catalog)}")
            
        except Exception as e:
            print(f"❌ Ошибка загрузки данных: {e}")
            raise
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Вычисляет расстояние между двумя точками на Земле в километрах
        используя формулу Haversine
        """
        # Радиус Земли в километрах
        R = 6371.0
        
        # Преобразуем градусы в радианы
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Разности координат
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Формула Haversine
        a = (math.sin(dlat/2)**2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def gaussian_smoothing(self, distance: float, sigma: float = None) -> float:
        """
        Применяет гауссово сглаживание к расстоянию
        Возвращает значение от 0 до 1, где 1 - близко, 0 - далеко
        """
        if sigma is None:
            sigma = self.distance_params['gaussian_sigma']
        
        # Гауссова функция: exp(-(x^2)/(2*sigma^2))
        return math.exp(-(distance**2) / (2 * sigma**2))
    
    def calculate_interest_overlap(self, user1_interests: Dict, user2_interests: Dict, 
                                 product_tags: List[str]) -> float:
        """
        Вычисляет пересечение интересов пары с тегами продукта
        """
        # Объединяем интересы пары
        pair_interests = set()
        
        # Добавляем интересы первого пользователя
        for interest, intensity in user1_interests.items():
            if intensity >= 5:  # Только значимые интересы
                pair_interests.add(interest.lower())
        
        # Добавляем интересы второго пользователя
        for interest, intensity in user2_interests.items():
            if intensity >= 5:  # Только значимые интересы
                pair_interests.add(interest.lower())
        
        # Вычисляем пересечение с тегами продукта
        product_tags_lower = [tag.lower() for tag in product_tags]
        overlap = len(pair_interests.intersection(set(product_tags_lower)))
        
        # Нормализуем по количеству тегов продукта
        if len(product_tags) == 0:
            return 0.0
        
        return min(1.0, overlap / len(product_tags))
    
    def calculate_price_match(self, user1_budget: str, user2_budget: str, 
                            product_price: float) -> float:
        """
        Вычисляет соответствие цены продукта бюджету пары
        """
        # Определяем общий бюджет пары
        budget_mapping = {
            'low': 1,
            'medium': 2,
            'high': 3
        }
        
        user1_budget_level = budget_mapping.get(user1_budget, 2)
        user2_budget_level = budget_mapping.get(user2_budget, 2)
        
        # Берем средний уровень бюджета
        avg_budget_level = (user1_budget_level + user2_budget_level) / 2
        
        # Определяем диапазоны цен
        price_ranges = {
            1: (0, 1000),      # low budget
            2: (500, 5000),    # medium budget  
            3: (2000, 20000)   # high budget
        }
        
        min_price, max_price = price_ranges.get(int(avg_budget_level), (500, 5000))
        
        # Вычисляем соответствие
        if min_price <= product_price <= max_price:
            return 1.0
        elif product_price < min_price:
            # Слишком дешево - может быть неинтересно
            return 0.7
        else:
            # Слишком дорого
            distance_penalty = (product_price - max_price) / max_price
            return max(0.0, 1.0 - distance_penalty)
    
    def calculate_distance_score(self, user1_city: str, user2_city: str, 
                               product_lat: float, product_lon: float) -> float:
        """
        Вычисляет score на основе расстояния до продукта/места
        """
        # Если у продукта нет координат, возвращаем нейтральный score
        if pd.isna(product_lat) or pd.isna(product_lon):
            return 0.5
        
        # Для простоты используем координаты Москвы как центр
        # В реальной системе нужно получать координаты городов пользователей
        moscow_lat, moscow_lon = 55.7558, 37.6176
        
        # Вычисляем расстояние
        distance = self.haversine_distance(moscow_lat, moscow_lon, product_lat, product_lon)
        
        # Если слишком далеко, возвращаем 0
        if distance > self.distance_params['max_distance_km']:
            return 0.0
        
        # Применяем гауссово сглаживание
        return self.gaussian_smoothing(distance)
    
    def get_recent_interactions(self, pair_id: str, limit: int = 20) -> List[Dict]:
        """
        Получает последние взаимодействия пары для персонализации
        """
        try:
            # Получаем ID пользователей в паре
            pair = self.pairs[self.pairs['id'] == pair_id].iloc[0]
            user1_id = pair['user1_id']
            user2_id = pair['user2_id']
            
            # Получаем последние взаимодействия
            pair_interactions = self.interactions[
                (self.interactions['user_id'] == user1_id) | 
                (self.interactions['user_id'] == user2_id)
            ].sort_values('created_at', ascending=False).head(limit)
            
            return pair_interactions.to_dict('records')
            
        except Exception as e:
            print(f"⚠️ Ошибка получения взаимодействий: {e}")
            return []
    
    def calculate_personalization_boost(self, pair_id: str, product_id: str) -> float:
        """
        Вычисляет boost для персонализации на основе последних взаимодействий
        """
        recent_interactions = self.get_recent_interactions(pair_id, 20)
        
        if not recent_interactions:
            return 1.0
        
        # Ищем взаимодействия с похожими продуктами
        product = self.product_catalog[self.product_catalog['id'] == product_id]
        if product.empty:
            return 1.0
        
        product_category = product.iloc[0]['category']
        product_tags = eval(product.iloc[0]['tags']) if isinstance(product.iloc[0]['tags'], str) else []
        
        boost = 1.0
        
        for interaction in recent_interactions:
            # Проверяем взаимодействия с продуктами той же категории
            if interaction.get('product_id'):
                interacted_product = self.product_catalog[
                    self.product_catalog['id'] == interaction['product_id']
                ]
                
                if not interacted_product.empty:
                    interacted_category = interacted_product.iloc[0]['category']
                    
                    if interacted_category == product_category:
                        # Положительное взаимодействие увеличивает boost
                        if interaction.get('rating', 0) >= 7:
                            boost += 0.1
                        # Отрицательное уменьшает
                        elif interaction.get('rating', 0) <= 4:
                            boost -= 0.05
        
        return max(0.5, min(2.0, boost))  # Ограничиваем boost от 0.5 до 2.0
    
    def recommend_date(self, pair_id: str, top_k: int = 10, 
                      user_location: Optional[Tuple[float, float]] = None) -> List[RecommendationResult]:
        """
        Основная функция рекомендаций для пары
        
        Args:
            pair_id: ID пары
            top_k: Количество рекомендаций
            user_location: Координаты пользователя (lat, lon)
        
        Returns:
            Список рекомендаций с scores и причинами
        """
        try:
            # Получаем информацию о паре
            pair = self.pairs[self.pairs['id'] == pair_id]
            if pair.empty:
                raise ValueError(f"Пара {pair_id} не найдена")
            
            pair = pair.iloc[0]
            user1_id = pair['user1_id']
            user2_id = pair['user2_id']
            
            # Получаем профили пользователей
            user1 = self.users[self.users['id'] == user1_id].iloc[0]
            user2 = self.users[self.users['id'] == user2_id].iloc[0]
            
            # Парсим интересы пользователей
            user1_interests = eval(user1['interests']) if isinstance(user1['interests'], str) else {}
            user2_interests = eval(user2['interests']) if isinstance(user2['interests'], str) else {}
            
            recommendations = []
            
            # Оцениваем каждый продукт в каталоге
            for _, product in self.product_catalog.iterrows():
                # Парсим теги продукта
                product_tags = eval(product['tags']) if isinstance(product['tags'], str) else []
                
                # Вычисляем компоненты score
                interest_score = self.calculate_interest_overlap(
                    user1_interests, user2_interests, product_tags
                )
                
                price_score = self.calculate_price_match(
                    user1['budget_preference'], user2['budget_preference'], 
                    product['price']
                )
                
                distance_score = self.calculate_distance_score(
                    user1['city'], user2['city'], 
                    product['latitude'], product['longitude']
                )
                
                # Вычисляем общий score
                total_score = (
                    self.weights['interest_overlap'] * interest_score +
                    self.weights['distance_score'] * distance_score +
                    self.weights['price_match'] * price_score
                )
                
                # Применяем персонализацию
                personalization_boost = self.calculate_personalization_boost(
                    pair_id, product['id']
                )
                
                final_score = total_score * personalization_boost
                
                # Собираем причины рекомендации
                reasons = []
                if interest_score > 0.3:
                    reasons.append(f"Соответствует интересам пары ({interest_score:.2f})")
                if price_score > 0.7:
                    reasons.append(f"Подходит по бюджету ({price_score:.2f})")
                if distance_score > 0.5:
                    reasons.append(f"Удобное расположение ({distance_score:.2f})")
                if personalization_boost > 1.1:
                    reasons.append(f"Персонализация (+{personalization_boost:.2f})")
                
                recommendations.append(RecommendationResult(
                    item_id=product['id'],
                    title=product['title'],
                    category=product['category'],
                    score=final_score,
                    reasons=reasons,
                    price=product['price'],
                    location=(product['latitude'], product['longitude']) if not pd.isna(product['latitude']) else None
                ))
            
            # Сортируем по score и возвращаем top_k
            recommendations.sort(key=lambda x: x.score, reverse=True)
            
            return recommendations[:top_k]
            
        except Exception as e:
            print(f"❌ Ошибка в recommend_date: {e}")
            return []
    
    def evaluate_baseline_metrics(self, test_pairs: List[str] = None, k: int = 10) -> Dict:
        """
        Вычисляет baseline метрики на синтетических данных
        
        Метрики:
        - Precision@k: доля релевантных рекомендаций в top-k
        - Recall@k: доля найденных релевантных элементов
        - NDCG@k: Normalized Discounted Cumulative Gain
        """
        if test_pairs is None:
            # Берем случайную выборку пар для тестирования
            test_pairs = self.pairs['id'].sample(min(100, len(self.pairs))).tolist()
        
        precision_scores = []
        recall_scores = []
        ndcg_scores = []
        
        for pair_id in test_pairs:
            try:
                # Получаем рекомендации
                recommendations = self.recommend_date(pair_id, top_k=k)
                
                # Получаем реальные взаимодействия пары
                pair = self.pairs[self.pairs['id'] == pair_id].iloc[0]
                user1_id = pair['user1_id']
                user2_id = pair['user2_id']
                
                # Получаем положительные взаимодействия (рейтинг >= 7)
                positive_interactions = self.interactions[
                    ((self.interactions['user_id'] == user1_id) | 
                     (self.interactions['user_id'] == user2_id)) &
                    (self.interactions['rating'] >= 7)
                ]
                
                relevant_items = set(positive_interactions['product_id'].tolist())
                recommended_items = set([rec.item_id for rec in recommendations])
                
                # Precision@k
                if len(recommended_items) > 0:
                    precision = len(relevant_items.intersection(recommended_items)) / len(recommended_items)
                    precision_scores.append(precision)
                
                # Recall@k
                if len(relevant_items) > 0:
                    recall = len(relevant_items.intersection(recommended_items)) / len(relevant_items)
                    recall_scores.append(recall)
                
                # NDCG@k (упрощенная версия)
                dcg = 0.0
                for i, rec in enumerate(recommendations):
                    if rec.item_id in relevant_items:
                        dcg += 1.0 / math.log2(i + 2)  # i+2 потому что log2(1) = 0
                
                # IDCG (Ideal DCG) - максимально возможный DCG
                idcg = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(relevant_items))))
                
                if idcg > 0:
                    ndcg = dcg / idcg
                    ndcg_scores.append(ndcg)
                
            except Exception as e:
                print(f"⚠️ Ошибка оценки для пары {pair_id}: {e}")
                continue
        
        # Вычисляем средние метрики
        metrics = {
            'precision_at_k': np.mean(precision_scores) if precision_scores else 0.0,
            'recall_at_k': np.mean(recall_scores) if recall_scores else 0.0,
            'ndcg_at_k': np.mean(ndcg_scores) if ndcg_scores else 0.0,
            'num_test_pairs': len(test_pairs),
            'weights': self.weights
        }
        
        return metrics
    
    def save_model_metadata(self, metrics: Dict, model_path: str = 'models/content_v1'):
        """
        Сохраняет метаданные модели в model_metadata
        """
        import os
        os.makedirs('models', exist_ok=True)
        
        metadata = {
            'model_id': 'content_v1',
            'type': 'content_based',
            'version': '1.0',
            'trained_on': {
                'num_users': len(self.users),
                'num_pairs': len(self.pairs),
                'num_interactions': len(self.interactions),
                'num_products': len(self.product_catalog)
            },
            'metrics': metrics,
            'parameters': {
                'weights': self.weights,
                'distance_params': self.distance_params
            },
            'created_at': datetime.now().isoformat()
        }
        
        with open(f'{model_path}_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Метаданные модели сохранены в {model_path}_metadata.json")

def main():
    """Демонстрация работы рекомендательной системы"""
    print("🚀 Запуск Content-Based Recommendation System")
    
    # Инициализируем рекомендательную систему
    recommender = ContentBasedRecommender()
    
    # Тестируем на случайной паре
    test_pair_id = recommender.pairs['id'].iloc[0]
    print(f"\n🎯 Тестируем рекомендации для пары: {test_pair_id}")
    
    # Получаем рекомендации
    recommendations = recommender.recommend_date(test_pair_id, top_k=5)
    
    print(f"\n📋 Топ-5 рекомендаций:")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec.title}")
        print(f"   Категория: {rec.category}")
        print(f"   Score: {rec.score:.3f}")
        print(f"   Цена: {rec.price:.0f} руб.")
        print(f"   Причины: {', '.join(rec.reasons)}")
        print()
    
    # Вычисляем baseline метрики
    print("📊 Вычисляем baseline метрики...")
    metrics = recommender.evaluate_baseline_metrics(k=10)
    
    print(f"\n📈 Результаты оценки:")
    print(f"  Precision@10: {metrics['precision_at_k']:.3f}")
    print(f"  Recall@10: {metrics['recall_at_k']:.3f}")
    print(f"  NDCG@10: {metrics['ndcg_at_k']:.3f}")
    print(f"  Тестовых пар: {metrics['num_test_pairs']}")
    
    # Сохраняем метаданные модели
    recommender.save_model_metadata(metrics)
    
    print("\n🎉 Content-based рекомендательная система готова!")

if __name__ == "__main__":
    main()
