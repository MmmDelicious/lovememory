#!/usr/bin/env python3
"""
Hybrid Recommendation System для LoveMemory AI
Объединяет Content-Based и Collaborative Filtering подходы
"""

import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import pickle
import os

# Импортируем наши рекомендательные системы
from content_recommender import ContentBasedRecommender, RecommendationResult
from collaborative_filtering import CollaborativeFilteringRecommender

class HybridRecommender:
    """Гибридная рекомендательная система"""
    
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        """Инициализация с загрузкой данных"""
        self.data_path = data_path
        
        # Инициализируем компоненты
        self.content_recommender = ContentBasedRecommender(data_path)
        self.cf_recommender = CollaborativeFilteringRecommender(data_path)
        
        # Веса для объединения (настраиваемые)
        self.hybrid_weights = {
            'content_weight': 0.6,
            'cf_weight': 0.4
        }
        
        # Модели обучены
        self.content_trained = False
        self.cf_trained = False
    
    def train_models(self):
        """Обучает обе модели"""
        print("🚀 Обучаем гибридную модель...")
        
        # Обучаем content-based модель (уже готова)
        self.content_trained = True
        print("✅ Content-based модель готова")
        
        # Обучаем collaborative filtering модель
        if self.cf_recommender.train_svd_model():
            self.cf_trained = True
            print("✅ Collaborative filtering модель обучена")
        else:
            print("⚠️ Не удалось обучить CF модель")
        
        return self.content_trained and self.cf_trained
    
    def recommend_date(self, pair_id: str, top_k: int = 10, 
                      user_location: Optional[Tuple[float, float]] = None) -> List[Dict]:
        """
        Основная функция гибридных рекомендаций
        
        Args:
            pair_id: ID пары
            top_k: Количество рекомендаций
            user_location: Координаты пользователя
        
        Returns:
            Список гибридных рекомендаций
        """
        try:
            print(f"🎯 Генерируем гибридные рекомендации для пары: {pair_id}")
            
            # Получаем content-based рекомендации
            content_recs = []
            if self.content_trained:
                content_recs = self.content_recommender.recommend_date(pair_id, top_k * 2, user_location)
                print(f"📊 Content-based: {len(content_recs)} рекомендаций")
            
            # Получаем collaborative filtering рекомендации
            cf_recs = []
            if self.cf_trained:
                cf_recs = self.cf_recommender.get_pair_recommendations(pair_id, top_k * 2)
                print(f"📊 Collaborative filtering: {len(cf_recs)} рекомендаций")
            
            # Объединяем рекомендации
            hybrid_recs = self._combine_recommendations(content_recs, cf_recs, top_k)
            
            print(f"✅ Гибридные рекомендации: {len(hybrid_recs)} элементов")
            return hybrid_recs
            
        except Exception as e:
            print(f"❌ Ошибка в гибридных рекомендациях: {e}")
            return []
    
    def _combine_recommendations(self, content_recs: List[RecommendationResult], 
                               cf_recs: List[Dict], top_k: int) -> List[Dict]:
        """Объединяет рекомендации от обеих моделей"""
        
        # Создаем словарь для объединения
        combined_scores = {}
        
        # Добавляем content-based рекомендации
        for rec in content_recs:
            item_id = rec.item_id
            content_score = rec.score
            
            combined_scores[item_id] = {
                'item_id': item_id,
                'title': rec.title,
                'category': rec.category,
                'price': rec.price,
                'location': rec.location,
                'reasons': rec.reasons,
                'content_score': content_score,
                'cf_score': 0.0,
                'hybrid_score': 0.0
            }
        
        # Добавляем collaborative filtering рекомендации
        for rec in cf_recs:
            item_id = rec['item_id']
            cf_score = rec['combined_rating'] / 10.0  # Нормализуем к 0-1
            
            if item_id in combined_scores:
                # Обновляем существующий элемент
                combined_scores[item_id]['cf_score'] = cf_score
            else:
                # Добавляем новый элемент
                # Получаем информацию о товаре из каталога
                product_info = self._get_product_info(item_id)
                
                combined_scores[item_id] = {
                    'item_id': item_id,
                    'title': product_info.get('title', item_id),
                    'category': product_info.get('category', 'unknown'),
                    'price': product_info.get('price', 0),
                    'location': product_info.get('location'),
                    'reasons': ['Рекомендовано похожими парами'],
                    'content_score': 0.0,
                    'cf_score': cf_score,
                    'hybrid_score': 0.0
                }
        
        # Вычисляем гибридные scores
        for item_id, item_data in combined_scores.items():
            content_score = item_data['content_score']
            cf_score = item_data['cf_score']
            
            # Гибридный score с весами
            hybrid_score = (
                self.hybrid_weights['content_weight'] * content_score +
                self.hybrid_weights['cf_weight'] * cf_score
            )
            
            item_data['hybrid_score'] = hybrid_score
        
        # Сортируем по гибридному score
        final_recs = list(combined_scores.values())
        final_recs.sort(key=lambda x: x['hybrid_score'], reverse=True)
        
        return final_recs[:top_k]
    
    def _get_product_info(self, item_id: str) -> Dict:
        """Получает информацию о товаре из каталога"""
        try:
            product = self.content_recommender.product_catalog[
                self.content_recommender.product_catalog['id'] == item_id
            ]
            
            if not product.empty:
                product = product.iloc[0]
                return {
                    'title': product['title'],
                    'category': product['category'],
                    'price': product['price'],
                    'location': (product['latitude'], product['longitude']) if not pd.isna(product['latitude']) else None
                }
        except Exception as e:
            print(f"⚠️ Ошибка получения информации о товаре {item_id}: {e}")
        
        return {}
    
    def evaluate_hybrid_model(self, test_pairs: List[str] = None, k: int = 10) -> Dict:
        """Оценивает гибридную модель"""
        print("📊 Оцениваем гибридную модель...")
        
        if test_pairs is None:
            test_pairs = self.content_recommender.pairs['id'].sample(min(50, len(self.content_recommender.pairs))).tolist()
        
        precision_scores = []
        recall_scores = []
        ndcg_scores = []
        
        for pair_id in test_pairs:
            try:
                # Получаем гибридные рекомендации
                recommendations = self.recommend_date(pair_id, top_k=k)
                
                # Получаем реальные взаимодействия пары
                pair = self.content_recommender.pairs[self.content_recommender.pairs['id'] == pair_id].iloc[0]
                user1_id = pair['user1_id']
                user2_id = pair['user2_id']
                
                # Получаем положительные взаимодействия (рейтинг >= 7)
                positive_interactions = self.content_recommender.interactions[
                    ((self.content_recommender.interactions['user_id'] == user1_id) | 
                     (self.content_recommender.interactions['user_id'] == user2_id)) &
                    (self.content_recommender.interactions['rating'] >= 7)
                ]
                
                relevant_items = set(positive_interactions['product_id'].tolist())
                recommended_items = set([rec['item_id'] for rec in recommendations])
                
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
                    if rec['item_id'] in relevant_items:
                        dcg += 1.0 / math.log2(i + 2)
                
                # IDCG
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
            'hybrid_weights': self.hybrid_weights,
            'content_trained': self.content_trained,
            'cf_trained': self.cf_trained
        }
        
        return metrics
    
    def update_hybrid_weights(self, content_weight: float, cf_weight: float):
        """Обновляет веса гибридной модели"""
        if abs(content_weight + cf_weight - 1.0) > 0.01:
            raise ValueError("Веса должны суммироваться к 1.0")
        
        self.hybrid_weights = {
            'content_weight': content_weight,
            'cf_weight': cf_weight
        }
        
        print(f"✅ Веса обновлены: Content={content_weight:.2f}, CF={cf_weight:.2f}")
    
    def save_hybrid_model(self, model_path: str = 'models/hybrid_v1'):
        """Сохраняет гибридную модель"""
        os.makedirs('models', exist_ok=True)
        
        # Сохраняем CF модель
        if self.cf_trained:
            self.cf_recommender.save_model(f'{model_path}_cf')
        
        # Сохраняем метаданные гибридной модели
        metadata = {
            'model_id': 'hybrid_v1',
            'type': 'hybrid',
            'version': '1.0',
            'trained_on': {
                'num_users': len(self.content_recommender.users),
                'num_pairs': len(self.content_recommender.pairs),
                'num_interactions': len(self.content_recommender.interactions),
                'num_products': len(self.content_recommender.product_catalog)
            },
            'parameters': {
                'hybrid_weights': self.hybrid_weights,
                'content_weights': self.content_recommender.weights,
                'cf_n_factors': self.cf_recommender.n_factors
            },
            'created_at': datetime.now().isoformat()
        }
        
        with open(f'{model_path}_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Гибридная модель сохранена в {model_path}")

def main():
    """Демонстрация работы гибридной рекомендательной системы"""
    print("🚀 Запуск Hybrid Recommendation System")
    
    # Инициализируем гибридную систему
    hybrid_recommender = HybridRecommender()
    
    # Обучаем модели
    if not hybrid_recommender.train_models():
        print("❌ Не удалось обучить модели")
        return
    
    # Тестируем на случайной паре
    test_pair_id = hybrid_recommender.content_recommender.pairs['id'].iloc[0]
    print(f"\n🎯 Тестируем гибридные рекомендации для пары: {test_pair_id}")
    
    # Получаем рекомендации
    recommendations = hybrid_recommender.recommend_date(test_pair_id, top_k=5)
    
    print(f"\n📋 Топ-5 гибридных рекомендаций:")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec['title']}")
        print(f"   Категория: {rec['category']}")
        print(f"   Гибридный Score: {rec['hybrid_score']:.3f}")
        print(f"   Content Score: {rec['content_score']:.3f}")
        print(f"   CF Score: {rec['cf_score']:.3f}")
        print(f"   Цена: {rec['price']:.0f} руб.")
        print(f"   Причины: {', '.join(rec['reasons'])}")
        print()
    
    # Вычисляем метрики
    print("📊 Вычисляем метрики гибридной модели...")
    metrics = hybrid_recommender.evaluate_hybrid_model(k=10)
    
    print(f"\n📈 Результаты оценки гибридной модели:")
    print(f"  Precision@10: {metrics['precision_at_k']:.3f}")
    print(f"  Recall@10: {metrics['recall_at_k']:.3f}")
    print(f"  NDCG@10: {metrics['ndcg_at_k']:.3f}")
    print(f"  Тестовых пар: {metrics['num_test_pairs']}")
    print(f"  Веса: Content={metrics['hybrid_weights']['content_weight']:.2f}, CF={metrics['hybrid_weights']['cf_weight']:.2f}")
    
    # Сохраняем модель
    hybrid_recommender.save_hybrid_model()
    
    print("\n🎉 Гибридная рекомендательная система готова!")

if __name__ == "__main__":
    import math
    main()
