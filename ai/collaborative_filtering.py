import json
import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import pickle
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class CollaborativeFilteringRecommender:
    def __init__(self, data_path: str = 'data/synthetic_v1'):
        self.data_path = data_path
        self.users = None
        self.pairs = None
        self.interactions = None
        self.product_catalog = None
        
        self.n_factors = 5
        self.learning_rate = 0.005
        self.regularization = 0.02
        self.n_epochs = 100
        
        self.svd_model = None
        self.user_item_matrix = None
        self.user_mapping = {}
        self.item_mapping = {}
        self.reverse_user_mapping = {}
        self.reverse_item_mapping = {}
        
        try:
            self.load_data()
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise
    
    def load_data(self):
        try:
            logger.info("Loading data for collaborative filtering")
            
            self.users = pd.read_csv(f'{self.data_path}/users.csv')
            self.pairs = pd.read_csv(f'{self.data_path}/pairs.csv')
            self.interactions = pd.read_csv(f'{self.data_path}/interactions.csv')
            self.product_catalog = pd.read_csv(f'{self.data_path}/product_catalog.csv')
            
            logger.info(f"Data loaded: {len(self.users)} users, {len(self.pairs)} pairs, {len(self.interactions)} interactions, {len(self.product_catalog)} products")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def prepare_user_item_matrix(self):
        try:
            logger.info("Preparing user-item matrix")
            
            if self.interactions is None or self.interactions.empty:
                logger.error("No interactions data available")
                return False
            
            ratings_data = self.interactions[
                (self.interactions['rating'].notna()) & 
                (self.interactions['rating'] > 0)
            ].copy()
            
            if len(ratings_data) == 0:
                logger.warning("No rating data available for training")
                return False
            
            unique_users = sorted(ratings_data['user_id'].unique())
            unique_items = sorted(ratings_data['product_id'].unique())
            
            self.user_mapping = {user_id: idx for idx, user_id in enumerate(unique_users)}
            self.item_mapping = {item_id: idx for idx, item_id in enumerate(unique_items)}
            
            self.reverse_user_mapping = {idx: user_id for user_id, idx in self.user_mapping.items()}
            self.reverse_item_mapping = {idx: item_id for item_id, idx in self.item_mapping.items()}
            
            n_users = len(unique_users)
            n_items = len(unique_items)
            
            self.user_item_matrix = np.zeros((n_users, n_items))
            
            for _, row in ratings_data.iterrows():
                user_idx = self.user_mapping[row['user_id']]
                item_idx = self.item_mapping[row['product_id']]
                rating = row['rating']
                
                self.user_item_matrix[user_idx, item_idx] = rating
            
            fill_rate = (self.user_item_matrix > 0).sum() / (n_users * n_items) * 100
            logger.info(f"Matrix created: {n_users} users × {n_items} items, fill rate: {fill_rate:.2f}%")
            
            return True
            
        except Exception as e:
            logger.error(f"Error preparing user-item matrix: {e}")
            return False
    
    def train_svd_model(self):
        if self.user_item_matrix is None:
            if not self.prepare_user_item_matrix():
                return False
        
        try:
            logger.info(f"Training SVD model (n_factors={self.n_factors})")
            
            self.svd_model = TruncatedSVD(
                n_components=self.n_factors,
                random_state=42
            )
            
            self.svd_model.fit(self.user_item_matrix)
            self.user_item_matrix_transformed = self.svd_model.transform(self.user_item_matrix)
            
            logger.info("SVD model trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error training SVD model: {e}")
            return False
    
    def predict_rating(self, user_id: str, item_id: str) -> float:
        try:
            if self.svd_model is None:
                return 0.0
            
            if user_id not in self.user_mapping or item_id not in self.item_mapping:
                return 0.0
            
            user_idx = self.user_mapping[user_id]
            item_idx = self.item_mapping[item_id]
            
            user_factors = self.svd_model.transform(self.user_item_matrix[user_idx:user_idx+1])[0]
            item_factors = self.svd_model.components_[:, item_idx]
            
            predicted_rating = np.dot(user_factors, item_factors)
            
            return max(1.0, min(10.0, predicted_rating))
            
        except Exception as e:
            logger.warning(f"Error predicting rating for user {user_id}, item {item_id}: {e}")
            return 0.0
    
    def get_user_recommendations(self, user_id: str, top_k: int = 10) -> List[Dict]:
        """Получает рекомендации для пользователя"""
        if self.svd_model is None:
            return []
        
        if user_id not in self.user_mapping:
            return []
        
        user_idx = self.user_mapping[user_id]
        
        # Получаем факторы пользователя
        user_factors = self.svd_model.transform(self.user_item_matrix[user_idx:user_idx+1])[0]
        
        # Вычисляем предсказания для всех товаров
        predictions = []
        for item_id, item_idx in self.item_mapping.items():
            # Пропускаем товары, которые пользователь уже оценил
            if self.user_item_matrix[user_idx, item_idx] > 0:
                continue
            
            item_factors = self.svd_model.components_[:, item_idx]
            predicted_rating = np.dot(user_factors, item_factors)
            
            predictions.append({
                'item_id': item_id,
                'predicted_rating': max(1.0, min(10.0, predicted_rating))
            })
        
        # Сортируем по предсказанному рейтингу
        predictions.sort(key=lambda x: x['predicted_rating'], reverse=True)
        
        return predictions[:top_k]
    
    def get_pair_recommendations(self, pair_id: str, top_k: int = 10) -> List[Dict]:
        """Получает рекомендации для пары"""
        try:
            # Получаем пользователей пары
            pair = self.pairs[self.pairs['id'] == pair_id]
            if pair.empty:
                return []
            
            pair = pair.iloc[0]
            user1_id = pair['user1_id']
            user2_id = pair['user2_id']
            
            # Получаем рекомендации для каждого пользователя
            user1_recs = self.get_user_recommendations(user1_id, top_k * 2)
            user2_recs = self.get_user_recommendations(user2_id, top_k * 2)
            
            # Объединяем и усредняем рейтинги
            combined_recs = {}
            
            for rec in user1_recs:
                item_id = rec['item_id']
                combined_recs[item_id] = {
                    'item_id': item_id,
                    'user1_rating': rec['predicted_rating'],
                    'user2_rating': 0.0,
                    'combined_rating': rec['predicted_rating']
                }
            
            for rec in user2_recs:
                item_id = rec['item_id']
                if item_id in combined_recs:
                    combined_recs[item_id]['user2_rating'] = rec['predicted_rating']
                    combined_recs[item_id]['combined_rating'] = (
                        combined_recs[item_id]['user1_rating'] + rec['predicted_rating']
                    ) / 2
                else:
                    combined_recs[item_id] = {
                        'item_id': item_id,
                        'user1_rating': 0.0,
                        'user2_rating': rec['predicted_rating'],
                        'combined_rating': rec['predicted_rating']
                    }
            
            # Сортируем по комбинированному рейтингу
            final_recs = list(combined_recs.values())
            final_recs.sort(key=lambda x: x['combined_rating'], reverse=True)
            
            return final_recs[:top_k]
            
        except Exception as e:
            print(f"❌ Ошибка получения рекомендаций для пары: {e}")
            return []
    
    def evaluate_model(self, test_size: float = 0.2) -> Dict:
        """Оценивает модель с помощью кросс-валидации"""
        if self.user_item_matrix is None:
            return {'error': 'Model not trained'}
        
        print("📊 Оцениваем модель...")
        
        # Создаем тестовую выборку
        ratings_data = self.interactions[
            (self.interactions['rating'].notna()) & 
            (self.interactions['rating'] > 0)
        ].copy()
        
        if len(ratings_data) < 100:
            return {'error': 'Not enough data for evaluation'}
        
        # Разделяем на train/test
        train_data, test_data = train_test_split(
            ratings_data, 
            test_size=test_size, 
            random_state=42
        )
        
        # Обучаем модель на train данных
        train_matrix = np.zeros_like(self.user_item_matrix)
        
        for _, row in train_data.iterrows():
            if row['user_id'] in self.user_mapping and row['product_id'] in self.item_mapping:
                user_idx = self.user_mapping[row['user_id']]
                item_idx = self.item_mapping[row['product_id']]
                train_matrix[user_idx, item_idx] = row['rating']
        
        # Обучаем временную модель
        temp_model = TruncatedSVD(
            n_components=self.n_factors,
            random_state=42
        )
        temp_model.fit(train_matrix)
        
        # Предсказываем на test данных
        predictions = []
        actual_ratings = []
        
        for _, row in test_data.iterrows():
            if row['user_id'] in self.user_mapping and row['product_id'] in self.item_mapping:
                user_idx = self.user_mapping[row['user_id']]
                item_idx = self.item_mapping[row['product_id']]
                
                user_factors = temp_model.transform(train_matrix[user_idx:user_idx+1])[0]
                item_factors = temp_model.components_[:, item_idx]
                predicted_rating = np.dot(user_factors, item_factors)
                
                predictions.append(max(1.0, min(10.0, predicted_rating)))
                actual_ratings.append(row['rating'])
        
        if len(predictions) == 0:
            return {'error': 'No valid predictions'}
        
        # Вычисляем метрики
        rmse = np.sqrt(mean_squared_error(actual_ratings, predictions))
        mae = np.mean(np.abs(np.array(actual_ratings) - np.array(predictions)))
        
        # Вычисляем NDCG@10 ПРАВИЛЬНО - группируем по пользователям!
        print("🔧 Применяем ПРАВИЛЬНУЮ методологию NDCG (группировка по пользователям)...")
        
        ndcg_scores = []
        
        # Группируем тестовые данные по пользователям
        test_user_groups = test_data.groupby('user_id')
        users_processed = 0
        
        for user_id, user_group in test_user_groups:
            if user_id not in self.user_mapping or len(user_group) < 2:
                continue  # NDCG требует минимум 2 элемента
            
            users_processed += 1
            user_idx = self.user_mapping[user_id]
            
            # Получаем индексы товаров для этого пользователя
            user_item_ids = user_group['product_id'].values
            user_item_indices = []
            user_actual_ratings = []
            
            for i, item_id in enumerate(user_item_ids):
                if item_id in self.item_mapping:
                    user_item_indices.append(self.item_mapping[item_id])
                    user_actual_ratings.append(user_group.iloc[i]['rating'])
            
            if len(user_item_indices) < 2:
                continue
            
            # Предсказываем рейтинги ТОЛЬКО для товаров этого пользователя
            # Получаем user factors для этого пользователя
            user_factors = self.user_item_matrix_transformed[user_idx]
            
            user_predictions = []
            for item_idx in user_item_indices:
                # Предсказание = user_factors @ item_factors 
                item_factors = self.svd_model.components_[:, item_idx]
                prediction = np.dot(user_factors, item_factors)
                user_predictions.append(prediction)
            
            user_predictions = np.array(user_predictions)
            user_actual_ratings = np.array(user_actual_ratings)
            
            # Считаем NDCG для этого конкретного пользователя
            if len(user_predictions) >= 2:
                # Сортируем по предсказаниям (топ товары для ЭТОГО пользователя)
                sorted_indices = np.argsort(user_predictions)[::-1]
                
                # DCG для этого пользователя
                dcg = sum(user_actual_ratings[idx] / np.log2(i + 2) 
                         for i, idx in enumerate(sorted_indices[:10]))
                
                # IDCG для этого пользователя (идеальная сортировка ЕГО рейтингов)
                sorted_actual = sorted(user_actual_ratings, reverse=True)
                idcg = sum(rating / np.log2(i + 2) 
                          for i, rating in enumerate(sorted_actual[:10]))
                
                if idcg > 0:
                    user_ndcg = dcg / idcg
                    ndcg_scores.append(user_ndcg)
        
        print(f"📊 Обработано пользователей для NDCG: {users_processed}")
        print(f"📊 Валидных NDCG расчетов: {len(ndcg_scores)}")
        
        metrics = {
            'rmse': float(rmse),
            'mae': float(mae),
            'ndcg_at_10': float(np.mean(ndcg_scores)) if ndcg_scores else 0.0,
            'num_predictions': len(predictions),
            'test_size': len(test_data),
            'train_size': len(train_data)
        }
        
        print(f"✅ Метрики вычислены:")
        print(f"  RMSE: {metrics['rmse']:.3f}")
        print(f"  MAE: {metrics['mae']:.3f}")
        print(f"  NDCG@10: {metrics['ndcg_at_10']:.3f}")
        
        return metrics
    
    def save_model(self, model_path: str = 'models/cf_svd_v1'):
        """Сохраняет модель"""
        import os
        os.makedirs('models', exist_ok=True)
        
        # Сохраняем модель
        with open(f'{model_path}.pkl', 'wb') as f:
            pickle.dump({
                'svd_model': self.svd_model,
                'user_mapping': self.user_mapping,
                'item_mapping': self.item_mapping,
                'reverse_user_mapping': self.reverse_user_mapping,
                'reverse_item_mapping': self.reverse_item_mapping,
                'n_factors': self.n_factors
            }, f)
        
        # Сохраняем метаданные
        metadata = {
            'model_id': 'cf_svd_v1',
            'type': 'collaborative_filtering',
            'version': '1.0',
            'trained_on': {
                'num_users': len(self.user_mapping),
                'num_items': len(self.item_mapping),
                'num_interactions': len(self.interactions)
            },
            'parameters': {
                'n_factors': self.n_factors,
                'learning_rate': self.learning_rate,
                'regularization': self.regularization,
                'n_epochs': self.n_epochs
            },
            'created_at': datetime.now().isoformat()
        }
        
        with open(f'{model_path}_metadata.json', 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Модель сохранена в {model_path}")
    
    def load_model(self, model_path: str = 'models/cf_svd_v1'):
        """Загружает модель"""
        try:
            with open(f'{model_path}.pkl', 'rb') as f:
                model_data = pickle.load(f)
            
            self.svd_model = model_data['svd_model']
            self.user_mapping = model_data['user_mapping']
            self.item_mapping = model_data['item_mapping']
            self.reverse_user_mapping = model_data['reverse_user_mapping']
            self.reverse_item_mapping = model_data['reverse_item_mapping']
            self.n_factors = model_data['n_factors']
            
            print(f"✅ Модель загружена из {model_path}")
            return True
            
        except Exception as e:
            print(f"❌ Ошибка загрузки модели: {e}")
            return False

def main():
    """Демонстрация работы коллаборативной фильтрации"""
    print("🚀 Запуск Collaborative Filtering Recommendation System")
    
    # Инициализируем рекомендательную систему
    cf_recommender = CollaborativeFilteringRecommender()
    
    # Обучаем модель
    if not cf_recommender.train_svd_model():
        print("❌ Не удалось обучить модель")
        return
    
    # Оцениваем модель
    metrics = cf_recommender.evaluate_model()
    if 'error' not in metrics:
        print(f"\n📈 Результаты оценки:")
        print(f"  RMSE: {metrics['rmse']:.3f}")
        print(f"  MAE: {metrics['mae']:.3f}")
        print(f"  NDCG@10: {metrics['ndcg_at_10']:.3f}")
    
    # Тестируем рекомендации
    test_pair_id = cf_recommender.pairs['id'].iloc[0]
    print(f"\n🎯 Тестируем рекомендации для пары: {test_pair_id}")
    
    recommendations = cf_recommender.get_pair_recommendations(test_pair_id, top_k=5)
    
    print(f"\n📋 Топ-5 рекомендаций CF:")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. Item ID: {rec['item_id']}")
        print(f"   Combined Rating: {rec['combined_rating']:.3f}")
        print(f"   User1 Rating: {rec['user1_rating']:.3f}")
        print(f"   User2 Rating: {rec['user2_rating']:.3f}")
        print()
    
    # Сохраняем модель
    cf_recommender.save_model()
    
    print("🎉 Collaborative Filtering система готова!")

if __name__ == "__main__":
    main()
