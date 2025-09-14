#!/usr/bin/env python3
"""
Enhanced Hybrid Recommendation System для LoveMemory AI
Фаза 6: Интеграция Content-Based + Collaborative Filtering + Embedding-based ANN

Объединяет:
- Content-Based рекомендации
- Collaborative Filtering
- Embedding-based поиск с Faiss
"""

import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import pickle
import os
import math

# Импортируем существующие системы
from content_recommender import ContentBasedRecommender, RecommendationResult
from collaborative_filtering import CollaborativeFilteringRecommender
from embedding_service import EmbeddingService

class EnhancedHybridRecommender:
    """Расширенная гибридная рекомендательная система с эмбеддингами"""
    
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        """Инициализация с загрузкой всех компонентов"""
        self.data_path = data_path
        
        # Инициализируем все компоненты
        print("🚀 Инициализируем Enhanced Hybrid Recommender...")
        self.content_recommender = ContentBasedRecommender(data_path)
        self.cf_recommender = CollaborativeFilteringRecommender(data_path)
        self.embedding_service = EmbeddingService(data_path)
        
        # Веса для объединения трех подходов
        self.hybrid_weights = {
            'content_weight': 0.4,
            'cf_weight': 0.3,
            'embedding_weight': 0.3
        }
        
        # Статус обучения моделей
        self.content_trained = False
        self.cf_trained = False
        self.embeddings_ready = False
    
    def train_all_models(self):
        """Обучает все модели и готовит эмбеддинги"""
        print("🔥 Обучаем все модели Enhanced Hybrid системы...")
        
        # 1. Content-based модель (уже готова)
        self.content_trained = True
        print("✅ Content-based модель готова")
        
        # 2. Collaborative filtering модель
        if self.cf_recommender.train_svd_model():
            self.cf_trained = True
            print("✅ Collaborative filtering модель обучена")
        else:
            print("⚠️ Не удалось обучить CF модель")
        
        # 3. Embedding модель
        if not self.embedding_service.load_embeddings():
            # Генерируем эмбеддинги если их нет
            print("🧠 Генерируем эмбеддинги...")
            self.embedding_service.generate_user_embeddings()
            self.embedding_service.generate_product_embeddings()
            self.embedding_service.generate_pair_embeddings()
            self.embedding_service.build_faiss_indexes()
            self.embedding_service.save_embeddings()
        
        self.embeddings_ready = True
        print("✅ Embedding система готова")
        
        success = self.content_trained and self.cf_trained and self.embeddings_ready
        print(f"🎯 Enhanced Hybrid система готова: {success}")
        return success
    
    def recommend_date_enhanced(self, pair_id: str, top_k: int = 10, 
                               user_location: Optional[Tuple[float, float]] = None) -> List[Dict]:
        """
        Главная функция Enhanced гибридных рекомендаций
        
        Объединяет кандидатов от трех источников:
        1. Content-based scoring
        2. Collaborative filtering
        3. Embedding-based ANN search
        
        Args:
            pair_id: ID пары
            top_k: Количество рекомендаций
            user_location: Координаты пользователя
        
        Returns:
            Список enhanced гибридных рекомендаций
        """
        try:
            print(f"🎯 Enhanced гибридные рекомендации для пары: {pair_id}")
            
            # Собираем кандидатов от всех трех источников
            all_candidates = {}
            
            # 1. Content-based кандидаты
            if self.content_trained:
                content_recs = self.content_recommender.recommend_date(pair_id, top_k * 3, user_location)
                print(f"📊 Content-based: {len(content_recs)} кандидатов")
                
                for rec in content_recs:
                    item_id = rec.item_id
                    all_candidates[item_id] = {
                        'item_id': item_id,
                        'title': rec.title,
                        'category': rec.category,
                        'price': rec.price,
                        'location': rec.location,
                        'reasons': rec.reasons.copy(),
                        'content_score': rec.score,
                        'cf_score': 0.0,
                        'embedding_score': 0.0,
                        'final_score': 0.0
                    }
            
            # 2. Collaborative filtering кандидаты
            if self.cf_trained:
                cf_recs = self.cf_recommender.get_pair_recommendations(pair_id, top_k * 3)
                print(f"📊 Collaborative filtering: {len(cf_recs)} кандидатов")
                
                for rec in cf_recs:
                    item_id = rec['item_id']
                    cf_score = rec['combined_rating'] / 10.0  # Нормализуем к 0-1
                    
                    if item_id in all_candidates:
                        all_candidates[item_id]['cf_score'] = cf_score
                        all_candidates[item_id]['reasons'].append('Популярно среди похожих пар')
                    else:
                        # Получаем информацию о товаре
                        product_info = self._get_product_info(item_id)
                        all_candidates[item_id] = {
                            'item_id': item_id,
                            'title': product_info.get('title', item_id),
                            'category': product_info.get('category', 'unknown'),
                            'price': product_info.get('price', 0),
                            'location': product_info.get('location'),
                            'reasons': ['Популярно среди похожих пар'],
                            'content_score': 0.0,
                            'cf_score': cf_score,
                            'embedding_score': 0.0,
                            'final_score': 0.0
                        }
            
            # 3. Embedding-based кандидаты
            if self.embeddings_ready:
                embedding_candidates = self.embedding_service.find_similar_products_ann(pair_id, top_k * 3)
                print(f"📊 Embedding ANN: {len(embedding_candidates)} кандидатов")
                
                for candidate in embedding_candidates:
                    item_id = candidate['item_id']
                    embedding_score = candidate['embedding_similarity']
                    
                    if item_id in all_candidates:
                        all_candidates[item_id]['embedding_score'] = embedding_score
                        all_candidates[item_id]['reasons'].append('Семантически похож на ваши предпочтения')
                    else:
                        all_candidates[item_id] = {
                            'item_id': item_id,
                            'title': candidate['title'],
                            'category': candidate['category'],
                            'price': candidate['price'],
                            'location': None,
                            'reasons': ['Семантически похож на ваши предпочтения'],
                            'content_score': 0.0,
                            'cf_score': 0.0,
                            'embedding_score': embedding_score,
                            'final_score': 0.0
                        }
            
            # Вычисляем финальные scores
            for item_id, candidate in all_candidates.items():
                content_score = candidate['content_score']
                cf_score = candidate['cf_score']
                embedding_score = candidate['embedding_score']
                
                # Enhanced гибридный score с тремя компонентами
                final_score = (
                    self.hybrid_weights['content_weight'] * content_score +
                    self.hybrid_weights['cf_weight'] * cf_score +
                    self.hybrid_weights['embedding_weight'] * embedding_score
                )
                
                candidate['final_score'] = final_score
                
                # Добавляем детализацию scores в reasons
                score_details = f"Scores: Content={content_score:.3f}, CF={cf_score:.3f}, Emb={embedding_score:.3f}"
                candidate['reasons'].append(score_details)
            
            # Сортируем по финальному score
            final_recommendations = list(all_candidates.values())
            final_recommendations.sort(key=lambda x: x['final_score'], reverse=True)
            
            print(f"✅ Enhanced рекомендации: {len(final_recommendations[:top_k])} топ кандидатов")
            return final_recommendations[:top_k]
            
        except Exception as e:
            print(f"❌ Ошибка в Enhanced гибридных рекомендациях: {e}")
            return []
    
    def _get_product_info(self, item_id: str) -> Dict:
        """Получает информацию о товаре из каталога"""
        return self.content_recommender._get_product_info(item_id)
    
    def evaluate_enhanced_model(self, test_pairs: List[str] = None, k: int = 10) -> Dict:
        """Оценивает Enhanced гибридную модель"""
        print("📊 Оцениваем Enhanced гибридную модель...")
        
        if test_pairs is None:
            test_pairs = self.content_recommender.pairs['id'].sample(min(30, len(self.content_recommender.pairs))).tolist()
        
        precision_scores = []
        recall_scores = []
        ndcg_scores = []
        diversity_scores = []
        
        for pair_id in test_pairs:
            try:
                # Получаем Enhanced рекомендации
                recommendations = self.recommend_date_enhanced(pair_id, top_k=k)
                
                if not recommendations:
                    continue
                
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
                
                # NDCG@k
                dcg = 0.0
                for i, rec in enumerate(recommendations):
                    if rec['item_id'] in relevant_items:
                        dcg += 1.0 / math.log2(i + 2)
                
                # IDCG
                idcg = sum(1.0 / math.log2(i + 2) for i in range(min(k, len(relevant_items))))
                
                if idcg > 0:
                    ndcg = dcg / idcg
                    ndcg_scores.append(ndcg)
                
                # Diversity (разнообразие категорий)
                categories = set([rec['category'] for rec in recommendations])
                diversity = len(categories) / len(recommendations) if recommendations else 0
                diversity_scores.append(diversity)
                
            except Exception as e:
                print(f"⚠️ Ошибка оценки для пары {pair_id}: {e}")
                continue
        
        # Вычисляем средние метрики
        metrics = {
            'precision_at_k': np.mean(precision_scores) if precision_scores else 0.0,
            'recall_at_k': np.mean(recall_scores) if recall_scores else 0.0,
            'ndcg_at_k': np.mean(ndcg_scores) if ndcg_scores else 0.0,
            'diversity_at_k': np.mean(diversity_scores) if diversity_scores else 0.0,
            'num_test_pairs': len(test_pairs),
            'enhanced_weights': self.hybrid_weights,
            'all_models_ready': self.content_trained and self.cf_trained and self.embeddings_ready
        }
        
        return metrics
    
    def update_enhanced_weights(self, content_weight: float, cf_weight: float, embedding_weight: float):
        """Обновляет веса Enhanced гибридной модели"""
        total_weight = content_weight + cf_weight + embedding_weight
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError("Веса должны суммироваться к 1.0")
        
        self.hybrid_weights = {
            'content_weight': content_weight,
            'cf_weight': cf_weight,
            'embedding_weight': embedding_weight
        }
        
        print(f"✅ Enhanced веса обновлены: Content={content_weight:.2f}, CF={cf_weight:.2f}, Embedding={embedding_weight:.2f}")
    
    def save_enhanced_model(self, model_path: str = 'models/enhanced_hybrid_v1'):
        """Сохраняет Enhanced гибридную модель"""
        os.makedirs('models', exist_ok=True)
        
        # Сохраняем компоненты
        if self.cf_trained:
            self.cf_recommender.save_model(f'{model_path}_cf')
        
        if self.embeddings_ready:
            self.embedding_service.save_embeddings()
        
        # Сохраняем метаданные Enhanced модели
        metadata = {
            'model_id': 'enhanced_hybrid_v1',
            'type': 'enhanced_hybrid',
            'version': '1.0',
            'components': {
                'content_based': self.content_trained,
                'collaborative_filtering': self.cf_trained,
                'embedding_ann': self.embeddings_ready
            },
            'trained_on': {
                'num_users': len(self.content_recommender.users),
                'num_pairs': len(self.content_recommender.pairs),
                'num_interactions': len(self.content_recommender.interactions),
                'num_products': len(self.content_recommender.product_catalog)
            },
            'parameters': {
                'enhanced_weights': self.hybrid_weights,
                'content_weights': self.content_recommender.weights,
                'cf_n_factors': self.cf_recommender.n_factors,
                'embedding_model': self.embedding_service.model_name,
                'embedding_dim': self.embedding_service.embedding_dim
            },
            'created_at': datetime.now().isoformat()
        }
        
        with open(f'{model_path}_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Enhanced гибридная модель сохранена в {model_path}")

def main():
    """Демонстрация работы Enhanced гибридной рекомендательной системы"""
    print("🚀 Запуск Enhanced Hybrid Recommendation System")
    
    # Инициализируем Enhanced гибридную систему
    enhanced_recommender = EnhancedHybridRecommender()
    
    # Обучаем все модели
    if not enhanced_recommender.train_all_models():
        print("❌ Не удалось обучить все модели")
        return
    
    # Тестируем на случайной паре
    test_pair_id = enhanced_recommender.content_recommender.pairs['id'].iloc[0]
    print(f"\n🎯 Тестируем Enhanced рекомендации для пары: {test_pair_id}")
    
    # Получаем рекомендации
    recommendations = enhanced_recommender.recommend_date_enhanced(test_pair_id, top_k=5)
    
    print(f"\n📋 Топ-5 Enhanced гибридных рекомендаций:")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec['title']}")
        print(f"   Категория: {rec['category']}")
        print(f"   Final Score: {rec['final_score']:.3f}")
        print(f"   Content: {rec['content_score']:.3f} | CF: {rec['cf_score']:.3f} | Embedding: {rec['embedding_score']:.3f}")
        print(f"   Цена: {rec['price']:.0f} руб.")
        print(f"   Причины: {len(rec['reasons'])} объяснений")
        print()
    
    # Вычисляем метрики
    print("📊 Оцениваем Enhanced модель...")
    metrics = enhanced_recommender.evaluate_enhanced_model(k=10)
    
    print(f"\n📈 Результаты Enhanced гибридной модели:")
    print(f"  Precision@10: {metrics['precision_at_k']:.3f}")
    print(f"  Recall@10: {metrics['recall_at_k']:.3f}")
    print(f"  NDCG@10: {metrics['ndcg_at_k']:.3f}")
    print(f"  Diversity@10: {metrics['diversity_at_k']:.3f}")
    print(f"  Тестовых пар: {metrics['num_test_pairs']}")
    weights = metrics['enhanced_weights']
    print(f"  Веса: Content={weights['content_weight']:.2f}, CF={weights['cf_weight']:.2f}, Embedding={weights['embedding_weight']:.2f}")
    
    # Тестируем производительность
    latency_stats = enhanced_recommender.embedding_service.benchmark_search_latency(num_queries=20)
    
    print(f"\n⏱️ Производительность:")
    print(f"  P95 latency: {latency_stats['p95_latency_ms']:.2f}ms")
    if latency_stats['p95_latency_ms'] > 300:
        print("  ⚠️ Требуется оптимизация (P95 > 300ms)")
    else:
        print("  ✅ Производительность в норме")
    
    # Сохраняем модель
    enhanced_recommender.save_enhanced_model()
    
    print("\n🎉 Enhanced Hybrid система готова к production!")
    print("✅ Фаза 6 (Embeddings + ANN) завершена успешно!")

if __name__ == "__main__":
    main()
