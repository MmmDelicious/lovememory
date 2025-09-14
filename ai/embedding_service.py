import json
import os
import pickle
import time
import logging
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, data_path: str = 'data/synthetic_v1', model_name: str = 'paraphrase-multilingual-MiniLM-L12-v2'):
        self.data_path = data_path
        self.model_name = model_name
        
        try:
            logger.info(f"Loading model {model_name}")
            self.embedding_model = SentenceTransformer(model_name)
            self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
            logger.info(f"Model loaded, embedding dimension: {self.embedding_dim}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
        
        self.users = None
        self.pairs = None
        self.product_catalog = None
        self.interactions = None
        
        self.user_embeddings = {}
        self.product_embeddings = {}
        self.pair_embeddings = {}
        
        self.user_index = None
        self.product_index = None
        self.user_id_mapping = {}
        self.product_id_mapping = {}
        
        os.makedirs('embeddings_store', exist_ok=True)
        
        try:
            self.load_data()
        except Exception as e:
            logger.error(f"Failed to load data: {e}")
            raise
    
    def load_data(self):
        try:
            logger.info("Loading data")
            self.users = pd.read_csv(f'{self.data_path}/users.csv')
            self.pairs = pd.read_csv(f'{self.data_path}/pairs.csv')
            self.product_catalog = pd.read_csv(f'{self.data_path}/product_catalog.csv')
            self.interactions = pd.read_csv(f'{self.data_path}/interactions.csv')
            
            logger.info(f"Data loaded: {len(self.users)} users, {len(self.pairs)} pairs, {len(self.product_catalog)} products, {len(self.interactions)} interactions")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def create_user_text_representation(self, user_row: pd.Series) -> str:
        """
        Создает текстовое представление пользователя для эмбеддинга
        
        Args:
            user_row: Строка пользователя из DataFrame
        
        Returns:
            Текстовое описание пользователя
        """
        try:
            # Парсим интересы
            interests_dict = eval(user_row['interests'])
            top_interests = sorted(interests_dict.items(), key=lambda x: x[1], reverse=True)[:10]
            interests_text = ', '.join([f"{interest}" for interest, score in top_interests])
            
            # Парсим языки любви
            love_languages_dict = eval(user_row['love_languages'])
            primary_love_language = max(love_languages_dict.items(), key=lambda x: x[1])[0]
            
            # Формируем текст
            user_text = f"""
            Возраст: {user_row['age']}
            Пол: {user_row['gender']}
            Город: {user_row['city']}
            Архетип: {user_row['archetype']}
            Интересы: {interests_text}
            Основной язык любви: {primary_love_language}
            Бюджетные предпочтения: {user_row['budget_preference']}
            """.strip()
            
            return user_text
            
        except Exception as e:
            print(f"⚠️ Ошибка создания текста для пользователя: {e}")
            return f"Пользователь {user_row['age']} лет, {user_row['gender']}, {user_row['city']}"
    
    def create_product_text_representation(self, product_row: pd.Series) -> str:
        """
        Создает текстовое представление товара для эмбеддинга
        
        Args:
            product_row: Строка товара из DataFrame
        
        Returns:
            Текстовое описание товара
        """
        try:
            # Парсим теги
            tags_list = eval(product_row['tags'])
            tags_text = ', '.join(tags_list)
            
            # Формируем текст
            product_text = f"""
            Название: {product_row['title']}
            Категория: {product_row['category']}
            Теги: {tags_text}
            Язык любви: {product_row['love_language']}
            Цена: {product_row['price']} рублей
            """.strip()
            
            return product_text
            
        except Exception as e:
            print(f"⚠️ Ошибка создания текста для товара: {e}")
            return f"{product_row['title']} - {product_row['category']}"
    
    def create_pair_text_representation(self, pair_id: str) -> str:
        """
        Создает текстовое представление пары для эмбеддинга
        
        Args:
            pair_id: ID пары
        
        Returns:
            Текстовое описание пары
        """
        try:
            pair = self.pairs[self.pairs['id'] == pair_id].iloc[0]
            user1 = self.users[self.users['id'] == pair['user1_id']].iloc[0]
            user2 = self.users[self.users['id'] == pair['user2_id']].iloc[0]
            
            # Создаем объединенный профиль пары
            user1_text = self.create_user_text_representation(user1)
            user2_text = self.create_user_text_representation(user2)
            
            pair_text = f"Пара:\nПартнер 1: {user1_text}\nПартнер 2: {user2_text}"
            
            return pair_text
            
        except Exception as e:
            print(f"⚠️ Ошибка создания текста для пары {pair_id}: {e}")
            return f"Пара {pair_id}"
    
    def generate_user_embeddings(self, batch_size: int = 32) -> Dict[str, np.ndarray]:
        """
        Генерирует эмбеддинги для всех пользователей
        
        Args:
            batch_size: Размер батча для обработки
        
        Returns:
            Словарь {user_id: embedding}
        """
        print("🧠 Генерируем эмбеддинги пользователей...")
        start_time = time.time()
        
        # Создаем текстовые представления
        user_texts = []
        user_ids = []
        
        for idx, user_row in self.users.iterrows():
            user_text = self.create_user_text_representation(user_row)
            user_texts.append(user_text)
            user_ids.append(user_row['id'])
        
        # Генерируем эмбеддинги батчами
        embeddings = []
        for i in range(0, len(user_texts), batch_size):
            batch_texts = user_texts[i:i + batch_size]
            batch_embeddings = self.embedding_model.encode(batch_texts, show_progress_bar=False)
            embeddings.extend(batch_embeddings)
        
        # Сохраняем в словарь
        self.user_embeddings = {user_id: emb for user_id, emb in zip(user_ids, embeddings)}
        
        duration = time.time() - start_time
        print(f"✅ Эмбеддинги пользователей сгенерированы: {len(self.user_embeddings)} за {duration:.2f}с")
        
        return self.user_embeddings
    
    def generate_product_embeddings(self, batch_size: int = 32) -> Dict[str, np.ndarray]:
        """
        Генерирует эмбеддинги для всех товаров
        
        Args:
            batch_size: Размер батча для обработки
        
        Returns:
            Словарь {product_id: embedding}
        """
        print("🛍️ Генерируем эмбеддинги товаров...")
        start_time = time.time()
        
        # Создаем текстовые представления
        product_texts = []
        product_ids = []
        
        for idx, product_row in self.product_catalog.iterrows():
            product_text = self.create_product_text_representation(product_row)
            product_texts.append(product_text)
            product_ids.append(product_row['id'])
        
        # Генерируем эмбеддинги батчами
        embeddings = []
        for i in range(0, len(product_texts), batch_size):
            batch_texts = product_texts[i:i + batch_size]
            batch_embeddings = self.embedding_model.encode(batch_texts, show_progress_bar=False)
            embeddings.extend(batch_embeddings)
        
        # Сохраняем в словарь
        self.product_embeddings = {product_id: emb for product_id, emb in zip(product_ids, embeddings)}
        
        duration = time.time() - start_time
        print(f"✅ Эмбеддинги товаров сгенерированы: {len(self.product_embeddings)} за {duration:.2f}с")
        
        return self.product_embeddings
    
    def generate_pair_embeddings(self, batch_size: int = 32) -> Dict[str, np.ndarray]:
        """
        Генерирует эмбеддинги для всех пар
        
        Args:
            batch_size: Размер батча для обработки
        
        Returns:
            Словарь {pair_id: embedding}
        """
        print("💕 Генерируем эмбеддинги пар...")
        start_time = time.time()
        
        # Создаем текстовые представления
        pair_texts = []
        pair_ids = []
        
        for idx, pair_row in self.pairs.iterrows():
            pair_text = self.create_pair_text_representation(pair_row['id'])
            pair_texts.append(pair_text)
            pair_ids.append(pair_row['id'])
        
        # Генерируем эмбеддинги батчами
        embeddings = []
        for i in range(0, len(pair_texts), batch_size):
            batch_texts = pair_texts[i:i + batch_size]
            batch_embeddings = self.embedding_model.encode(batch_texts, show_progress_bar=False)
            embeddings.extend(batch_embeddings)
        
        # Сохраняем в словарь
        self.pair_embeddings = {pair_id: emb for pair_id, emb in zip(pair_ids, embeddings)}
        
        duration = time.time() - start_time
        print(f"✅ Эмбеддинги пар сгенерированы: {len(self.pair_embeddings)} за {duration:.2f}с")
        
        return self.pair_embeddings
    
    def build_faiss_indexes(self):
        """Строит Faiss индексы для быстрого поиска"""
        print("🚀 Строим Faiss индексы...")
        
        # Индекс для пользователей
        if self.user_embeddings:
            user_embeddings_matrix = np.array(list(self.user_embeddings.values())).astype('float32')
            self.user_index = faiss.IndexFlatL2(self.embedding_dim)
            self.user_index.add(user_embeddings_matrix)
            
            # Маппинг для быстрого поиска
            self.user_id_mapping = {i: user_id for i, user_id in enumerate(self.user_embeddings.keys())}
            print(f"✅ User index: {self.user_index.ntotal} векторов")
        
        # Индекс для товаров
        if self.product_embeddings:
            product_embeddings_matrix = np.array(list(self.product_embeddings.values())).astype('float32')
            self.product_index = faiss.IndexFlatL2(self.embedding_dim)
            self.product_index.add(product_embeddings_matrix)
            
            # Маппинг для быстрого поиска
            self.product_id_mapping = {i: product_id for i, product_id in enumerate(self.product_embeddings.keys())}
            print(f"✅ Product index: {self.product_index.ntotal} векторов")
    
    def find_similar_products_ann(self, pair_id: str, top_k: int = 10) -> List[Dict]:
        """
        Находит похожие товары с помощью ANN поиска
        
        Args:
            pair_id: ID пары
            top_k: Количество кандидатов
        
        Returns:
            Список кандидатов с cosine similarity
        """
        try:
            if pair_id not in self.pair_embeddings:
                print(f"⚠️ Эмбеддинг для пары {pair_id} не найден")
                return []
            
            if self.product_index is None:
                print("⚠️ Product index не построен")
                return []
            
            # Получаем эмбеддинг пары
            pair_embedding = self.pair_embeddings[pair_id].astype('float32').reshape(1, -1)
            
            # Поиск по индексу
            distances, indices = self.product_index.search(pair_embedding, top_k)
            
            # Конвертируем в cosine similarity и формируем результат
            candidates = []
            for distance, idx in zip(distances[0], indices[0]):
                if idx == -1:  # Faiss возвращает -1 если не найдено
                    continue
                
                product_id = self.product_id_mapping[idx]
                cosine_similarity = 1.0 / (1.0 + distance)  # Приблизительная конверсия
                
                # Получаем информацию о товаре
                product_info = self.product_catalog[self.product_catalog['id'] == product_id].iloc[0]
                
                candidates.append({
                    'item_id': product_id,
                    'title': product_info['title'],
                    'category': product_info['category'],
                    'price': product_info['price'],
                    'embedding_similarity': cosine_similarity,
                    'search_method': 'ann_embedding'
                })
            
            return candidates
            
        except Exception as e:
            print(f"❌ Ошибка ANN поиска для пары {pair_id}: {e}")
            return []
    
    def save_embeddings(self):
        """Сохраняет все эмбеддинги и индексы на диск"""
        print("💾 Сохраняем эмбеддинги...")
        
        # Сохраняем эмбеддинги
        with open('embeddings_store/user_embeddings.pkl', 'wb') as f:
            pickle.dump(self.user_embeddings, f)
        
        with open('embeddings_store/product_embeddings.pkl', 'wb') as f:
            pickle.dump(self.product_embeddings, f)
        
        with open('embeddings_store/pair_embeddings.pkl', 'wb') as f:
            pickle.dump(self.pair_embeddings, f)
        
        # Сохраняем Faiss индексы
        if self.user_index:
            faiss.write_index(self.user_index, 'embeddings_store/user_index.faiss')
        
        if self.product_index:
            faiss.write_index(self.product_index, 'embeddings_store/product_index.faiss')
        
        # Сохраняем маппинги
        with open('embeddings_store/user_id_mapping.json', 'w') as f:
            json.dump(self.user_id_mapping, f)
        
        with open('embeddings_store/product_id_mapping.json', 'w') as f:
            json.dump(self.product_id_mapping, f)
        
        # Метаданные
        metadata = {
            'model_name': self.model_name,
            'embedding_dim': self.embedding_dim,
            'num_users': len(self.user_embeddings),
            'num_products': len(self.product_embeddings),
            'num_pairs': len(self.pair_embeddings),
            'created_at': datetime.now().isoformat()
        }
        
        with open('embeddings_store/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("✅ Эмбеддинги сохранены в embeddings_store/")
    
    def load_embeddings(self):
        """Загружает эмбеддинги и индексы с диска"""
        print("📂 Загружаем эмбеддинги...")
        
        try:
            # Загружаем эмбеддинги
            with open('embeddings_store/user_embeddings.pkl', 'rb') as f:
                self.user_embeddings = pickle.load(f)
            
            with open('embeddings_store/product_embeddings.pkl', 'rb') as f:
                self.product_embeddings = pickle.load(f)
            
            with open('embeddings_store/pair_embeddings.pkl', 'rb') as f:
                self.pair_embeddings = pickle.load(f)
            
            # Загружаем Faiss индексы
            if os.path.exists('embeddings_store/user_index.faiss'):
                self.user_index = faiss.read_index('embeddings_store/user_index.faiss')
            
            if os.path.exists('embeddings_store/product_index.faiss'):
                self.product_index = faiss.read_index('embeddings_store/product_index.faiss')
            
            # Загружаем маппинги
            with open('embeddings_store/user_id_mapping.json', 'r') as f:
                user_mapping_str = json.load(f)
                self.user_id_mapping = {int(k): v for k, v in user_mapping_str.items()}
            
            with open('embeddings_store/product_id_mapping.json', 'r') as f:
                product_mapping_str = json.load(f)
                self.product_id_mapping = {int(k): v for k, v in product_mapping_str.items()}
            
            print("✅ Эмбеддинги загружены успешно")
            return True
            
        except Exception as e:
            print(f"⚠️ Не удалось загрузить эмбеддинги: {e}")
            return False
    
    def benchmark_search_latency(self, num_queries: int = 100) -> Dict[str, float]:
        """
        Бенчмарк латентности поиска
        
        Args:
            num_queries: Количество тестовых запросов
        
        Returns:
            Статистики времени выполнения
        """
        print(f"⏱️ Бенчмарк латентности на {num_queries} запросах...")
        
        # Выбираем случайные пары для тестирования
        test_pairs = np.random.choice(list(self.pair_embeddings.keys()), 
                                     min(num_queries, len(self.pair_embeddings)), 
                                     replace=False)
        
        latencies = []
        
        for pair_id in test_pairs:
            start_time = time.time()
            candidates = self.find_similar_products_ann(pair_id, top_k=10)
            latency = (time.time() - start_time) * 1000  # в миллисекундах
            latencies.append(latency)
        
        # Статистики
        stats = {
            'mean_latency_ms': np.mean(latencies),
            'p50_latency_ms': np.percentile(latencies, 50),
            'p95_latency_ms': np.percentile(latencies, 95),
            'p99_latency_ms': np.percentile(latencies, 99),
            'max_latency_ms': np.max(latencies),
            'num_queries': len(latencies)
        }
        
        print(f"📊 Результаты бенчмарка:")
        print(f"  Mean latency: {stats['mean_latency_ms']:.2f}ms")
        print(f"  P95 latency: {stats['p95_latency_ms']:.2f}ms")
        print(f"  P99 latency: {stats['p99_latency_ms']:.2f}ms")
        
        return stats

def main():
    """Демонстрация работы Embedding Service"""
    print("🚀 Запуск Embedding Service для LoveMemory AI")
    
    # Инициализируем сервис
    embedding_service = EmbeddingService()
    
    # Пытаемся загрузить существующие эмбеддинги
    if not embedding_service.load_embeddings():
        # Если не удалось загрузить, генерируем новые
        print("🔄 Генерируем новые эмбеддинги...")
        
        # Генерируем эмбеддинги для всех сущностей
        embedding_service.generate_user_embeddings()
        embedding_service.generate_product_embeddings()
        embedding_service.generate_pair_embeddings()
        
        # Строим индексы
        embedding_service.build_faiss_indexes()
        
        # Сохраняем на диск
        embedding_service.save_embeddings()
    else:
        print("✅ Эмбеддинги загружены с диска")
    
    # Тестируем поиск
    test_pair_id = list(embedding_service.pair_embeddings.keys())[0]
    print(f"\n🎯 Тестируем ANN поиск для пары: {test_pair_id}")
    
    candidates = embedding_service.find_similar_products_ann(test_pair_id, top_k=5)
    
    print(f"\n📋 Топ-5 кандидатов по эмбеддингам:")
    for i, candidate in enumerate(candidates, 1):
        print(f"{i}. {candidate['title']}")
        print(f"   Категория: {candidate['category']}")
        print(f"   Embedding Similarity: {candidate['embedding_similarity']:.3f}")
        print(f"   Цена: {candidate['price']} руб.")
        print()
    
    # Бенчмарк производительности
    stats = embedding_service.benchmark_search_latency(num_queries=50)
    
    if stats['p95_latency_ms'] > 300:
        print("⚠️ P95 latency > 300ms, требуется оптимизация")
    else:
        print("✅ Латентность в пределах нормы")
    
    print("\n🎉 Embedding Service готов к интеграции!")

if __name__ == "__main__":
    main()
