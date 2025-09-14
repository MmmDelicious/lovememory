#!/usr/bin/env python3
"""
Learning to Rank Service для LoveMemory AI
Фаза 7: Продвинутое ранжирование с LightGBM Ranker

Функции:
- Подготовка training dataset с фичами и лейблами
- Обучение LightGBM Ranker модели
- Группированная кросс-валидация по парам
- Feature engineering и importance анализ
- Production inference для ранжирования
"""

import json
import os
import pickle
import time
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import GroupKFold
from sklearn.metrics import ndcg_score
import warnings
warnings.filterwarnings('ignore')

# Импорты наших систем
from content_recommender import ContentBasedRecommender
from collaborative_filtering import CollaborativeFilteringRecommender
from embedding_service import EmbeddingService

class LearningToRankService:
    """Сервис Learning to Rank для объединения всех источников рекомендаций"""
    
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        """
        Инициализация LTR сервиса
        
        Args:
            data_path: Путь к данным
        """
        self.data_path = data_path
        
        # Загружаем компоненты
        print("🚀 Инициализируем Learning to Rank Service...")
        self.content_recommender = ContentBasedRecommender(data_path)
        self.cf_recommender = CollaborativeFilteringRecommender(data_path)
        self.embedding_service = EmbeddingService(data_path)
        
        # LightGBM модель
        self.ranker_model = None
        self.feature_names = []
        self.feature_importance = {}
        
        # Параметры модели
        self.lgb_params = {
            'objective': 'lambdarank',
            'metric': 'ndcg',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.8,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'lambda_l1': 0.1,
            'lambda_l2': 0.1,
            'min_data_in_leaf': 20,
            'verbose': -1
        }
        
        # Пути для сохранения
        os.makedirs('models', exist_ok=True)
        
        # Подготавливаем компоненты
        self._prepare_components()
    
    def _prepare_components(self):
        """Подготавливает все компоненты для работы"""
        print("⚙️ Подготавливаем компоненты LTR...")
        
        # Загружаем CF модель
        if os.path.exists('models/cf_svd_v1.pkl'):
            self.cf_recommender.load_model('models/cf_svd_v1')
        else:
            self.cf_recommender.train_svd_model()
        
        # Загружаем эмбеддинги
        if not self.embedding_service.load_embeddings():
            print("🧠 Генерируем эмбеддинги для LTR...")
            self.embedding_service.generate_user_embeddings()
            self.embedding_service.generate_product_embeddings()
            self.embedding_service.generate_pair_embeddings()
            self.embedding_service.build_faiss_indexes()
            self.embedding_service.save_embeddings()
        
        print("✅ Компоненты LTR готовы")
    
    def create_training_dataset(self, sample_pairs: int = 500) -> Tuple[pd.DataFrame, List[int]]:
        """
        Создает training dataset для Learning to Rank
        
        Args:
            sample_pairs: Количество пар для обучения
        
        Returns:
            (features_df, groups) - фичи и группы для LightGBM
        """
        print(f"📊 Создаем training dataset для {sample_pairs} пар...")
        
        # Выбираем случайные пары для обучения
        all_pairs = self.content_recommender.pairs['id'].tolist()
        sample_pair_ids = np.random.choice(all_pairs, min(sample_pairs, len(all_pairs)), replace=False)
        
        training_data = []
        groups = []  # Размеры групп для каждой пары
        
        for pair_idx, pair_id in enumerate(sample_pair_ids):
            try:
                # Получаем кандидатов от всех источников
                candidates = self._get_candidates_for_pair(pair_id)
                
                if len(candidates) == 0:
                    continue
                
                # Получаем лейблы (рейтинги) для этой пары
                labels = self._get_labels_for_pair(pair_id, candidates)
                
                # Генерируем фичи для каждого кандидата
                for candidate in candidates:
                    item_id = candidate['item_id']
                    
                    # Получаем все фичи
                    features = self._extract_features(pair_id, item_id, candidate)
                    
                    # Получаем лейбл (рейтинг пользователя или синтетический)
                    label = labels.get(item_id, 0)
                    
                    # Добавляем в dataset
                    row = {
                        'pair_id': pair_id,
                        'item_id': item_id,
                        'label': label,
                        **features
                    }
                    training_data.append(row)
                
                # Добавляем размер группы
                groups.append(len(candidates))
                
                if pair_idx % 100 == 0:
                    print(f"  Обработано пар: {pair_idx + 1}/{len(sample_pair_ids)}")
                
            except Exception as e:
                print(f"⚠️ Ошибка обработки пары {pair_id}: {e}")
                continue
        
        # Конвертируем в DataFrame
        features_df = pd.DataFrame(training_data)
        
        print(f"✅ Training dataset создан:")
        print(f"  - Общее количество записей: {len(features_df)}")
        print(f"  - Количество групп (пар): {len(groups)}")
        print(f"  - Количество фич: {len(features_df.columns) - 3}")  # -3 для pair_id, item_id, label
        
        return features_df, groups
    
    def _get_candidates_for_pair(self, pair_id: str, max_candidates: int = 50) -> List[Dict]:
        """Получает кандидатов от всех источников"""
        candidates = {}
        
        # Content-based кандидаты
        try:
            content_recs = self.content_recommender.recommend_date(pair_id, top_k=20)
            for rec in content_recs:
                candidates[rec.item_id] = {
                    'item_id': rec.item_id,
                    'title': rec.title,
                    'category': rec.category,
                    'price': rec.price,
                    'content_score': rec.score
                }
        except:
            pass
        
        # CF кандидаты
        try:
            cf_recs = self.cf_recommender.get_pair_recommendations(pair_id, top_k=20)
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
                        'cf_score': rec['combined_rating'] / 10.0
                    }
        except:
            pass
        
        # Embedding кандидаты
        try:
            embedding_recs = self.embedding_service.find_similar_products_ann(pair_id, top_k=20)
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
                        'embedding_score': rec['embedding_similarity']
                    }
        except:
            pass
        
        # Заполняем отсутствующие scores
        for candidate in candidates.values():
            candidate.setdefault('content_score', 0.0)
            candidate.setdefault('cf_score', 0.0)
            candidate.setdefault('embedding_score', 0.0)
        
        return list(candidates.values())[:max_candidates]
    
    def _get_labels_for_pair(self, pair_id: str, candidates: List[Dict]) -> Dict[str, float]:
        """Получает лейблы (рейтинги) для кандидатов"""
        labels = {}
        
        try:
            # Получаем пользователей пары
            pair = self.content_recommender.pairs[self.content_recommender.pairs['id'] == pair_id].iloc[0]
            user1_id = pair['user1_id']
            user2_id = pair['user2_id']
            
            # Получаем взаимодействия пользователей
            user_interactions = self.content_recommender.interactions[
                (self.content_recommender.interactions['user_id'] == user1_id) |
                (self.content_recommender.interactions['user_id'] == user2_id)
            ]
            
            # Создаем лейблы на основе рейтингов
            for _, interaction in user_interactions.iterrows():
                product_id = interaction['product_id']
                rating = interaction['rating']
                
                # Конвертируем в бинарные лейблы или relevance scores
                if rating >= 8:
                    relevance = 3  # Очень релевантно
                elif rating >= 6:
                    relevance = 2  # Релевантно
                elif rating >= 4:
                    relevance = 1  # Слабо релевантно
                else:
                    relevance = 0  # Не релевантно
                
                # Берем максимальный рейтинг, если оба пользователя оценили
                if product_id in labels:
                    labels[product_id] = max(labels[product_id], relevance)
                else:
                    labels[product_id] = relevance
            
            # Для товаров без явных рейтингов создаем синтетические лейблы
            # на основе архетипов и предпочтений
            for candidate in candidates:
                item_id = candidate['item_id']
                if item_id not in labels:
                    # Синтетический лейбл на основе scores
                    synthetic_score = (
                        candidate['content_score'] * 0.4 +
                        candidate['cf_score'] * 0.3 +
                        candidate['embedding_score'] * 0.3
                    )
                    
                    if synthetic_score >= 0.7:
                        labels[item_id] = 2
                    elif synthetic_score >= 0.5:
                        labels[item_id] = 1
                    else:
                        labels[item_id] = 0
            
        except Exception as e:
            print(f"⚠️ Ошибка получения лейблов для пары {pair_id}: {e}")
        
        return labels
    
    def _extract_features(self, pair_id: str, item_id: str, candidate: Dict) -> Dict[str, float]:
        """
        Извлекает все фичи для пары item
        
        Args:
            pair_id: ID пары
            item_id: ID товара
            candidate: Информация о кандидате
        
        Returns:
            Словарь с фичами
        """
        features = {}
        
        try:
            # 1. Базовые scores от разных моделей
            features['content_score'] = candidate.get('content_score', 0.0)
            features['cf_score'] = candidate.get('cf_score', 0.0)
            features['embedding_score'] = candidate.get('embedding_score', 0.0)
            
            # 2. Информация о товаре
            product_info = self._get_product_info(item_id)
            features['price'] = product_info.get('price', 0) / 1000.0  # Нормализуем цену
            features['price_log'] = np.log1p(product_info.get('price', 1))
            
            # 3. Категориальные фичи (one-hot encoding)
            category = product_info.get('category', 'unknown')
            features['is_restaurant'] = 1.0 if category == 'restaurant' else 0.0
            features['is_cafe'] = 1.0 if category == 'cafe' else 0.0
            features['is_entertainment'] = 1.0 if category == 'entertainment' else 0.0
            features['is_gift'] = 1.0 if category == 'gift' else 0.0
            
            # 4. Фичи пары
            pair_features = self._get_pair_features(pair_id)
            features.update(pair_features)
            
            # 5. Временные фичи
            features['day_of_week'] = datetime.now().weekday()
            features['is_weekend'] = 1.0 if datetime.now().weekday() >= 5 else 0.0
            
            # 6. Популярность товара
            popularity = self._get_item_popularity(item_id)
            features['item_popularity'] = popularity
            features['item_popularity_log'] = np.log1p(popularity)
            
            # 7. Комбинированные фичи
            features['content_cf_product'] = features['content_score'] * features['cf_score']
            features['content_embedding_product'] = features['content_score'] * features['embedding_score']
            features['cf_embedding_product'] = features['cf_score'] * features['embedding_score']
            
            # 8. Цена vs архетип match
            features['price_match_score'] = self._calculate_price_match(pair_id, product_info.get('price', 0))
            
        except Exception as e:
            print(f"⚠️ Ошибка извлечения фич для {pair_id}, {item_id}: {e}")
        
        return features
    
    def _get_product_info(self, item_id: str) -> Dict:
        """Получает информацию о товаре"""
        try:
            product = self.content_recommender.product_catalog[
                self.content_recommender.product_catalog['id'] == item_id
            ]
            if not product.empty:
                product = product.iloc[0]
                return product.to_dict()
        except:
            pass
        return {}
    
    def _get_pair_features(self, pair_id: str) -> Dict[str, float]:
        """Извлекает фичи пары"""
        features = {}
        
        try:
            pair = self.content_recommender.pairs[self.content_recommender.pairs['id'] == pair_id].iloc[0]
            user1 = self.content_recommender.users[self.content_recommender.users['id'] == pair['user1_id']].iloc[0]
            user2 = self.content_recommender.users[self.content_recommender.users['id'] == pair['user2_id']].iloc[0]
            
            # Возрастные фичи
            features['age_diff'] = abs(user1['age'] - user2['age']) / 50.0  # Нормализуем
            features['avg_age'] = (user1['age'] + user2['age']) / 2.0 / 50.0
            
            # Архетипы
            features['same_archetype'] = 1.0 if user1['archetype'] == user2['archetype'] else 0.0
            
            # Архетипы как фичи
            archetype1 = user1['archetype']
            archetype2 = user2['archetype']
            for archetype in ['ArtLovers', 'Gamers', 'Gourmets', 'Fitness', 'Travelers']:
                features[f'user1_{archetype.lower()}'] = 1.0 if archetype1 == archetype else 0.0
                features[f'user2_{archetype.lower()}'] = 1.0 if archetype2 == archetype else 0.0
            
            # Бюджетные предпочтения
            budget_match = 1.0 if user1['budget_preference'] == user2['budget_preference'] else 0.0
            features['budget_match'] = budget_match
            
            # Активность пользователей
            features['user1_activity'] = user1.get('activity_probability', 0.5)
            features['user2_activity'] = user2.get('activity_probability', 0.5)
            features['avg_activity'] = (features['user1_activity'] + features['user2_activity']) / 2.0
            
        except Exception as e:
            print(f"⚠️ Ошибка извлечения фич пары {pair_id}: {e}")
        
        return features
    
    def _get_item_popularity(self, item_id: str) -> float:
        """Вычисляет популярность товара"""
        try:
            item_interactions = self.content_recommender.interactions[
                self.content_recommender.interactions['product_id'] == item_id
            ]
            return len(item_interactions) / len(self.content_recommender.interactions)
        except:
            return 0.0
    
    def _calculate_price_match(self, pair_id: str, price: float) -> float:
        """Вычисляет соответствие цены предпочтениям пары"""
        try:
            pair = self.content_recommender.pairs[self.content_recommender.pairs['id'] == pair_id].iloc[0]
            user1 = self.content_recommender.users[self.content_recommender.users['id'] == pair['user1_id']].iloc[0]
            user2 = self.content_recommender.users[self.content_recommender.users['id'] == pair['user2_id']].iloc[0]
            
            # Простой расчет на основе budget_preference
            budget_map = {'low': 1000, 'medium': 2500, 'high': 5000}
            
            budget1 = budget_map.get(user1['budget_preference'], 2500)
            budget2 = budget_map.get(user2['budget_preference'], 2500)
            avg_budget = (budget1 + budget2) / 2.0
            
            # Чем ближе цена к бюджету, тем выше score
            if price <= avg_budget:
                return price / avg_budget
            else:
                return max(0.1, avg_budget / price)
                
        except:
            return 0.5
    
    def train_ranker_model(self, training_data: pd.DataFrame, groups: List[int], 
                          validation_split: float = 0.2, n_folds: int = 3) -> Dict:
        """
        Обучает LightGBM Ranker модель с кросс-валидацией
        
        Args:
            training_data: Training dataset
            groups: Размеры групп для каждой пары
            validation_split: Доля данных для валидации
            n_folds: Количество фолдов для кросс-валидации
        
        Returns:
            Метрики обучения
        """
        print("🚀 Обучаем LightGBM Ranker модель...")
        
        # Подготавливаем данные
        feature_cols = [col for col in training_data.columns 
                       if col not in ['pair_id', 'item_id', 'label']]
        self.feature_names = feature_cols
        
        X = training_data[feature_cols].values
        y = training_data['label'].values
        
        print(f"📊 Данные для обучения:")
        print(f"  - Фичи: {X.shape}")
        print(f"  - Лейблы: {y.shape}")
        print(f"  - Группы: {len(groups)}")
        
        # Группированная кросс-валидация
        group_kfold = GroupKFold(n_splits=n_folds)
        cv_scores = []
        feature_importances = []
        
        # Создаем группы для кросс-валидации (pair_id как группа)
        pair_groups = training_data['pair_id'].values
        
        fold = 0
        for train_idx, val_idx in group_kfold.split(X, y, groups=pair_groups):
            fold += 1
            print(f"  📊 Фолд {fold}/{n_folds}")
            
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            # Группы для train и val
            train_groups = [groups[i] for i in range(len(groups)) if any(idx in train_idx for idx in range(sum(groups[:i]), sum(groups[:i+1])))]
            val_groups = [groups[i] for i in range(len(groups)) if any(idx in val_idx for idx in range(sum(groups[:i]), sum(groups[:i+1])))]
            
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
            
            # Вычисляем NDCG@10 для каждой группы в validation
            ndcg_scores = []
            start_idx = 0
            for group_size in val_groups:
                end_idx = start_idx + group_size
                if group_size > 1:  # NDCG требует минимум 2 элемента
                    group_true = y_val[start_idx:end_idx]
                    group_pred = y_pred[start_idx:end_idx]
                    
                    # Reshape для NDCG
                    ndcg = ndcg_score([group_true], [group_pred], k=min(10, group_size))
                    ndcg_scores.append(ndcg)
                
                start_idx = end_idx
            
            if ndcg_scores:
                fold_ndcg = np.mean(ndcg_scores)
                cv_scores.append(fold_ndcg)
                print(f"    NDCG@10: {fold_ndcg:.4f}")
            
            # Сохраняем feature importance
            importance = model.feature_importance(importance_type='gain')
            feature_importances.append(importance)
        
        # Финальное обучение на всех данных
        print("🎯 Финальное обучение на всех данных...")
        train_data = lgb.Dataset(X, label=y, group=groups)
        
        self.ranker_model = lgb.train(
            self.lgb_params,
            train_data,
            num_boost_round=1000,
            callbacks=[lgb.log_evaluation(100)]
        )
        
        # Сохраняем feature importance
        if feature_importances:
            avg_importance = np.mean(feature_importances, axis=0)
            self.feature_importance = dict(zip(self.feature_names, avg_importance))
        
        # Метрики
        metrics = {
            'cv_ndcg_mean': np.mean(cv_scores) if cv_scores else 0.0,
            'cv_ndcg_std': np.std(cv_scores) if cv_scores else 0.0,
            'n_folds': len(cv_scores),
            'feature_count': len(self.feature_names),
            'training_samples': len(training_data),
            'training_groups': len(groups)
        }
        
        print(f"✅ Обучение завершено:")
        print(f"  CV NDCG@10: {metrics['cv_ndcg_mean']:.4f} ± {metrics['cv_ndcg_std']:.4f}")
        print(f"  Фичи: {metrics['feature_count']}")
        
        return metrics
    
    def rank_candidates(self, pair_id: str, candidates: List[Dict]) -> List[Dict]:
        """
        Ранжирует кандидатов с помощью обученной модели
        
        Args:
            pair_id: ID пары
            candidates: Список кандидатов для ранжирования
        
        Returns:
            Отсортированный список кандидатов
        """
        if self.ranker_model is None:
            print("⚠️ Ranker модель не обучена")
            return candidates
        
        try:
            # Извлекаем фичи для каждого кандидата
            features_list = []
            for candidate in candidates:
                features = self._extract_features(pair_id, candidate['item_id'], candidate)
                # Проверяем, что все фичи присутствуют
                feature_vector = [features.get(name, 0.0) for name in self.feature_names]
                features_list.append(feature_vector)
            
            if not features_list:
                return candidates
            
            # Предсказываем relevance scores
            X = np.array(features_list)
            scores = self.ranker_model.predict(X)
            
            # Добавляем scores к кандидатам и сортируем
            for i, candidate in enumerate(candidates):
                candidate['ltr_score'] = scores[i]
            
            # Сортируем по LTR score
            ranked_candidates = sorted(candidates, key=lambda x: x['ltr_score'], reverse=True)
            
            return ranked_candidates
            
        except Exception as e:
            print(f"❌ Ошибка ранжирования для пары {pair_id}: {e}")
            return candidates
    
    def get_feature_importance(self, top_k: int = 20) -> Dict[str, float]:
        """Возвращает важность фич"""
        if not self.feature_importance:
            return {}
        
        # Сортируем по важности
        sorted_features = sorted(self.feature_importance.items(), 
                               key=lambda x: x[1], reverse=True)
        
        return dict(sorted_features[:top_k])
    
    def save_model(self, model_path: str = 'models/ltr_v1'):
        """Сохраняет LTR модель"""
        if self.ranker_model is None:
            print("⚠️ Нет модели для сохранения")
            return
        
        # Сохраняем LightGBM модель
        self.ranker_model.save_model(f'{model_path}.txt')
        
        # Сохраняем метаданные
        metadata = {
            'model_id': 'ltr_v1',
            'type': 'learning_to_rank',
            'version': '1.0',
            'algorithm': 'lightgbm_ranker',
            'feature_names': self.feature_names,
            'feature_importance': self.feature_importance,
            'lgb_params': self.lgb_params,
            'created_at': datetime.now().isoformat()
        }
        
        with open(f'{model_path}_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ LTR модель сохранена в {model_path}")
    
    def load_model(self, model_path: str = 'models/ltr_v1'):
        """Загружает LTR модель"""
        try:
            # Загружаем LightGBM модель
            self.ranker_model = lgb.Booster(model_file=f'{model_path}.txt')
            
            # Загружаем метаданные
            with open(f'{model_path}_metadata.json', 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            self.feature_names = metadata['feature_names']
            self.feature_importance = metadata['feature_importance']
            
            print(f"✅ LTR модель загружена из {model_path}")
            return True
            
        except Exception as e:
            print(f"⚠️ Не удалось загрузить LTR модель: {e}")
            return False

def main():
    """Демонстрация работы Learning to Rank Service"""
    print("🚀 Запуск Learning to Rank Service")
    
    # Инициализируем сервис
    ltr_service = LearningToRankService()
    
    # Пытаемся загрузить существующую модель
    if not ltr_service.load_model():
        print("🔄 Обучаем новую LTR модель...")
        
        # Создаем training dataset
        training_data, groups = ltr_service.create_training_dataset(sample_pairs=200)
        
        if len(training_data) == 0:
            print("❌ Не удалось создать training dataset")
            return
        
        # Обучаем модель
        metrics = ltr_service.train_ranker_model(training_data, groups)
        
        # Сохраняем модель
        ltr_service.save_model()
        
        print(f"\n📈 Результаты обучения LTR:")
        print(f"  CV NDCG@10: {metrics['cv_ndcg_mean']:.4f} ± {metrics['cv_ndcg_std']:.4f}")
        print(f"  Обучающих примеров: {metrics['training_samples']}")
        print(f"  Групп (пар): {metrics['training_groups']}")
    
    # Тестируем ранжирование
    test_pair_id = ltr_service.content_recommender.pairs['id'].iloc[0]
    print(f"\n🎯 Тестируем LTR ранжирование для пары: {test_pair_id}")
    
    # Получаем кандидатов
    candidates = ltr_service._get_candidates_for_pair(test_pair_id, max_candidates=10)
    
    if candidates:
        # Ранжируем кандидатов
        ranked_candidates = ltr_service.rank_candidates(test_pair_id, candidates)
        
        print(f"\n📋 Топ-5 LTR ранжированных рекомендаций:")
        for i, candidate in enumerate(ranked_candidates[:5], 1):
            print(f"{i}. {candidate['title']}")
            print(f"   LTR Score: {candidate.get('ltr_score', 0):.4f}")
            print(f"   Content: {candidate.get('content_score', 0):.3f} | CF: {candidate.get('cf_score', 0):.3f} | Embedding: {candidate.get('embedding_score', 0):.3f}")
            print(f"   Цена: {candidate['price']} руб.")
            print()
    
    # Анализ важности фич
    feature_importance = ltr_service.get_feature_importance(top_k=10)
    if feature_importance:
        print(f"\n🔍 Топ-10 важных фич:")
        for i, (feature, importance) in enumerate(feature_importance.items(), 1):
            print(f"{i:2d}. {feature}: {importance:.3f}")
    
    print("\n🎉 Learning to Rank система готова!")
    print("✅ Фаза 7 (Learning to Rank) завершена успешно!")

if __name__ == "__main__":
    main()
