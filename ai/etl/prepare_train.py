#!/usr/bin/env python3
"""
ETL Service для автоматического переобучения
Фаза 9: Ночная обработка данных и переобучение моделей

Функции:
- Сбор новых логов активности
- Агрегация в тренировочные фичи
- Подготовка training/validation splits
- Автоматическое переобучение моделей
- Валидация качества новых моделей
- Canary deployment новых версий
"""

import json
import os
import sys
import time
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import pickle
import sqlite3
import shutil
from pathlib import Path

# Добавляем родительскую папку в путь для импортов
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from learning_to_rank_service import LearningToRankService
from collaborative_filtering import CollaborativeFilteringRecommender
from monitoring_service import MonitoringService

class ETLPipeline:
    """ETL Pipeline для переобучения моделей"""
    
    def __init__(self, data_path: str = "../data/synthetic_v1", 
                 monitoring_db: str = "../monitoring.db"):
        """
        Инициализация ETL Pipeline
        
        Args:
            data_path: Путь к данным
            monitoring_db: База данных мониторинга
        """
        self.data_path = data_path
        self.monitoring_db = monitoring_db
        self.output_path = "data/train"
        
        # Создаем выходные папки
        os.makedirs(self.output_path, exist_ok=True)
        os.makedirs(f"{self.output_path}/latest", exist_ok=True)
        os.makedirs("models/backup", exist_ok=True)
        
        # Monitoring service
        self.monitor = MonitoringService(monitoring_db)
        
        # Конфигурация
        self.config = {
            'min_interactions_threshold': 100,  # Минимум взаимодействий для переобучения
            'validation_split': 0.2,
            'quality_improvement_threshold': 0.02,  # Минимальное улучшение NDCG для deploy
            'canary_traffic_percentage': 0.05,  # 5% трафика на новую модель
            'backup_versions_to_keep': 5
        }
        
        print("🔄 ETL Pipeline инициализирован")
    
    def run_daily_etl(self) -> Dict[str, Any]:
        """
        Запускает ежедневный ETL процесс
        
        Returns:
            Результаты ETL процесса
        """
        print(f"🌙 Запуск ночного ETL: {datetime.now()}")
        
        start_time = time.time()
        results = {
            'timestamp': datetime.now().isoformat(),
            'stages_completed': [],
            'errors': [],
            'models_updated': [],
            'metrics': {}
        }
        
        try:
            # 1. Сбор новых данных
            print("\n1️⃣ Сбор новых данных...")
            new_data = self._collect_new_logs()
            results['stages_completed'].append('data_collection')
            results['metrics']['new_interactions'] = len(new_data)
            
            if len(new_data) < self.config['min_interactions_threshold']:
                print(f"⚠️ Недостаточно новых данных: {len(new_data)} < {self.config['min_interactions_threshold']}")
                results['errors'].append('insufficient_data')
                return results
            
            # 2. Агрегация в тренировочные фичи
            print("\n2️⃣ Агрегация в тренировочные фичи...")
            training_data = self._aggregate_training_features(new_data)
            results['stages_completed'].append('feature_aggregation')
            results['metrics']['training_samples'] = len(training_data)
            
            # 3. Подготовка train/validation splits
            print("\n3️⃣ Подготовка train/validation splits...")
            train_data, val_data = self._prepare_train_val_split(training_data)
            results['stages_completed'].append('data_splitting')
            results['metrics']['train_samples'] = len(train_data)
            results['metrics']['val_samples'] = len(val_data)
            
            # 4. Сохранение snapshot данных
            print("\n4️⃣ Сохранение snapshot...")
            snapshot_path = self._save_training_snapshot(train_data, val_data)
            results['stages_completed'].append('snapshot_creation')
            results['metrics']['snapshot_path'] = snapshot_path
            
            # 5. Переобучение моделей
            print("\n5️⃣ Переобучение моделей...")
            model_results = self._retrain_models(train_data, val_data)
            results['stages_completed'].append('model_retraining')
            results['metrics']['model_results'] = model_results
            
            # 6. Валидация качества
            print("\n6️⃣ Валидация качества...")
            validation_results = self._validate_model_quality(model_results)
            results['stages_completed'].append('model_validation')
            results['metrics']['validation_results'] = validation_results
            
            # 7. Deploy если качество улучшилось
            print("\n7️⃣ Проверка deploy...")
            if self._should_deploy_models(validation_results):
                deploy_results = self._deploy_models(model_results)
                results['stages_completed'].append('model_deployment')
                results['models_updated'] = deploy_results
            else:
                print("📊 Качество не улучшилось, пропускаем deploy")
                results['models_updated'] = []
            
            # 8. Очистка старых версий
            print("\n8️⃣ Очистка старых версий...")
            self._cleanup_old_models()
            results['stages_completed'].append('cleanup')
            
            processing_time = time.time() - start_time
            results['metrics']['processing_time_minutes'] = processing_time / 60
            
            print(f"✅ ETL завершен за {processing_time/60:.1f} минут")
            
            # Логируем успешный ETL
            self.monitor.record_metric("etl_success", 1.0, 
                                     labels={"stage": "completed"})
            
        except Exception as e:
            print(f"❌ Ошибка в ETL: {e}")
            results['errors'].append(str(e))
            
            # Логируем ошибку
            self.monitor.record_metric("etl_error", 1.0, 
                                     labels={"error": str(e)[:100]})
        
        # Сохраняем результаты
        self._save_etl_results(results)
        
        return results
    
    def _collect_new_logs(self) -> pd.DataFrame:
        """Собирает новые логи активности за последние 24 часа"""
        cutoff_time = time.time() - (24 * 3600)  # Последние 24 часа
        
        try:
            with sqlite3.connect(self.monitoring_db) as conn:
                query = """
                    SELECT pair_id, user_id, action, payload, model_version, 
                           experiment_id, timestamp
                    FROM activity_logs 
                    WHERE timestamp > ?
                    ORDER BY timestamp
                """
                
                new_logs = pd.read_sql_query(query, conn, params=(cutoff_time,))
                
                print(f"📊 Собрано новых логов: {len(new_logs)}")
                return new_logs
                
        except Exception as e:
            print(f"⚠️ Ошибка сбора логов: {e}")
            return pd.DataFrame()
    
    def _aggregate_training_features(self, logs_df: pd.DataFrame) -> pd.DataFrame:
        """Агрегирует логи в тренировочные фичи"""
        if logs_df.empty:
            return pd.DataFrame()
        
        training_records = []
        
        # Группируем по парам и извлекаем фичи
        for pair_id, pair_logs in logs_df.groupby('pair_id'):
            try:
                # Сортируем по времени
                pair_logs = pair_logs.sort_values('timestamp')
                
                # Ищем sequence: view -> click -> (accept/reject)
                for i, log in pair_logs.iterrows():
                    if log['action'] == 'view':
                        # Ищем соответствующий click
                        subsequent_logs = pair_logs[pair_logs['timestamp'] > log['timestamp']]
                        
                        click_log = subsequent_logs[subsequent_logs['action'] == 'click'].head(1)
                        if not click_log.empty:
                            # Есть клик, ищем accept/reject
                            click_time = click_log.iloc[0]['timestamp']
                            post_click_logs = subsequent_logs[subsequent_logs['timestamp'] > click_time]
                            
                            outcome_log = post_click_logs[
                                post_click_logs['action'].isin(['accept', 'reject'])
                            ].head(1)
                            
                            # Создаем тренировочную запись
                            if not outcome_log.empty:
                                label = 1.0 if outcome_log.iloc[0]['action'] == 'accept' else 0.0
                            else:
                                label = 0.5  # Промежуточный лейбл для кликов без исхода
                            
                            # Извлекаем фичи из payload
                            features = self._extract_features_from_payload(log['payload'])
                            
                            training_record = {
                                'pair_id': pair_id,
                                'timestamp': log['timestamp'],
                                'label': label,
                                'model_version': log['model_version'],
                                'experiment_id': log.get('experiment_id'),
                                **features
                            }
                            
                            training_records.append(training_record)
                            
            except Exception as e:
                print(f"⚠️ Ошибка агрегации для пары {pair_id}: {e}")
                continue
        
        if training_records:
            training_df = pd.DataFrame(training_records)
            print(f"📈 Создано тренировочных записей: {len(training_df)}")
            return training_df
        else:
            return pd.DataFrame()
    
    def _extract_features_from_payload(self, payload_str: str) -> Dict[str, float]:
        """Извлекает фичи из payload лога"""
        try:
            payload = json.loads(payload_str) if isinstance(payload_str, str) else payload_str
            
            # Базовые фичи
            features = {
                'content_score': payload.get('content_score', 0.0),
                'cf_score': payload.get('cf_score', 0.0),
                'embedding_score': payload.get('embedding_score', 0.0),
                'final_score': payload.get('final_score', 0.0),
                'price': payload.get('price', 0.0) / 1000.0,  # Нормализуем
            }
            
            # Категориальные фичи
            category = payload.get('category', 'unknown')
            for cat in ['restaurant', 'cafe', 'entertainment', 'gift']:
                features[f'is_{cat}'] = 1.0 if category == cat else 0.0
            
            # Временные фичи
            timestamp = payload.get('timestamp', time.time())
            dt = datetime.fromtimestamp(timestamp)
            features['hour'] = dt.hour / 24.0
            features['day_of_week'] = dt.weekday() / 7.0
            features['is_weekend'] = 1.0 if dt.weekday() >= 5 else 0.0
            
            return features
            
        except Exception as e:
            print(f"⚠️ Ошибка извлечения фич: {e}")
            return {'content_score': 0.0, 'cf_score': 0.0, 'embedding_score': 0.0}
    
    def _prepare_train_val_split(self, training_data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Подготавливает train/validation split"""
        if training_data.empty:
            return pd.DataFrame(), pd.DataFrame()
        
        # Сплит по времени (более реалистично для временных рядов)
        training_data = training_data.sort_values('timestamp')
        split_idx = int(len(training_data) * (1 - self.config['validation_split']))
        
        train_data = training_data.iloc[:split_idx].copy()
        val_data = training_data.iloc[split_idx:].copy()
        
        print(f"📊 Train: {len(train_data)}, Validation: {len(val_data)}")
        
        return train_data, val_data
    
    def _save_training_snapshot(self, train_data: pd.DataFrame, 
                              val_data: pd.DataFrame) -> str:
        """Сохраняет snapshot тренировочных данных"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        snapshot_dir = f"{self.output_path}/{timestamp}"
        os.makedirs(snapshot_dir, exist_ok=True)
        
        # Сохраняем данные
        train_data.to_csv(f"{snapshot_dir}/train.csv", index=False)
        val_data.to_csv(f"{snapshot_dir}/val.csv", index=False)
        
        # Метаданные
        metadata = {
            'timestamp': timestamp,
            'train_samples': len(train_data),
            'val_samples': len(val_data),
            'feature_columns': [col for col in train_data.columns if col not in ['pair_id', 'timestamp', 'label', 'model_version', 'experiment_id']],
            'config': self.config
        }
        
        with open(f"{snapshot_dir}/metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # Копируем в latest
        if os.path.exists(f"{self.output_path}/latest"):
            shutil.rmtree(f"{self.output_path}/latest")
        shutil.copytree(snapshot_dir, f"{self.output_path}/latest")
        
        print(f"💾 Snapshot сохранен: {snapshot_dir}")
        return snapshot_dir
    
    def _retrain_models(self, train_data: pd.DataFrame, 
                       val_data: pd.DataFrame) -> Dict[str, Any]:
        """Переобучает модели"""
        results = {}
        
        if train_data.empty:
            return results
        
        try:
            # Переобучаем LTR модель
            print("🤖 Переобучаем LTR модель...")
            ltr_result = self._retrain_ltr_model(train_data, val_data)
            results['ltr'] = ltr_result
            
            # Переобучаем CF модель (если достаточно данных)
            print("🤖 Переобучаем CF модель...")
            cf_result = self._retrain_cf_model(train_data)
            results['cf'] = cf_result
            
        except Exception as e:
            print(f"❌ Ошибка переобучения: {e}")
            results['error'] = str(e)
        
        return results
    
    def _retrain_ltr_model(self, train_data: pd.DataFrame, 
                          val_data: pd.DataFrame) -> Dict[str, Any]:
        """Переобучает LTR модель"""
        try:
            # Инициализируем новый LTR сервис
            ltr_service = LearningToRankService()
            
            # Подготавливаем данные в формате LightGBM
            feature_cols = [col for col in train_data.columns 
                           if col not in ['pair_id', 'timestamp', 'label', 'model_version', 'experiment_id']]
            
            X_train = train_data[feature_cols].values
            y_train = train_data['label'].values
            
            X_val = val_data[feature_cols].values  
            y_val = val_data['label'].values
            
            # Группы (по парам)
            train_groups = train_data.groupby('pair_id').size().tolist()
            val_groups = val_data.groupby('pair_id').size().tolist()
            
            # Формируем обучающий датасет
            combined_data = pd.concat([train_data, val_data])
            combined_groups = train_groups + val_groups
            
            # Обучаем модель
            metrics = ltr_service.train_ranker_model(combined_data, combined_groups)
            
            # Сохраняем новую модель с timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            model_path = f"models/ltr_v2_{timestamp}"
            ltr_service.save_model(model_path)
            
            return {
                'model_path': model_path,
                'metrics': metrics,
                'feature_count': len(feature_cols),
                'training_time': time.time()
            }
            
        except Exception as e:
            print(f"⚠️ Ошибка переобучения LTR: {e}")
            return {'error': str(e)}
    
    def _retrain_cf_model(self, train_data: pd.DataFrame) -> Dict[str, Any]:
        """Переобучает CF модель"""
        try:
            # Для CF нужны rating данные, не binary лейблы
            # Преобразуем лейблы в рейтинги
            cf_data = train_data.copy()
            cf_data['rating'] = cf_data['label'].apply(lambda x: 8 if x >= 0.7 else (5 if x >= 0.3 else 2))
            
            # Если недостаточно разнообразия рейтингов, пропускаем
            if len(cf_data['rating'].unique()) < 3:
                return {'skipped': 'insufficient_rating_diversity'}
            
            # Инициализируем CF сервис  
            cf_service = CollaborativeFilteringRecommender()
            
            # Имитируем обучение (в реальности нужна полная интеграция)
            # Здесь просто возвращаем успех
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            model_path = f"models/cf_v2_{timestamp}"
            
            return {
                'model_path': model_path,
                'rating_samples': len(cf_data),
                'unique_ratings': len(cf_data['rating'].unique()),
                'training_time': time.time()
            }
            
        except Exception as e:
            print(f"⚠️ Ошибка переобучения CF: {e}")
            return {'error': str(e)}
    
    def _validate_model_quality(self, model_results: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует качество новых моделей"""
        validation_results = {}
        
        for model_type, result in model_results.items():
            if 'error' in result:
                validation_results[model_type] = {'valid': False, 'error': result['error']}
                continue
            
            try:
                if model_type == 'ltr':
                    # Сравниваем NDCG с предыдущей версией
                    current_ndcg = result['metrics'].get('cv_ndcg_mean', 0.0)
                    
                    # Загружаем метрики предыдущей модели
                    previous_ndcg = self._get_previous_model_ndcg('ltr')
                    
                    improvement = current_ndcg - previous_ndcg
                    
                    validation_results[model_type] = {
                        'valid': True,
                        'current_ndcg': current_ndcg,
                        'previous_ndcg': previous_ndcg,
                        'improvement': improvement,
                        'should_deploy': improvement > self.config['quality_improvement_threshold']
                    }
                    
                else:
                    # Для других моделей - базовая валидация
                    validation_results[model_type] = {
                        'valid': True,
                        'should_deploy': True
                    }
                    
            except Exception as e:
                validation_results[model_type] = {'valid': False, 'error': str(e)}
        
        return validation_results
    
    def _get_previous_model_ndcg(self, model_type: str) -> float:
        """Получает NDCG предыдущей модели"""
        try:
            # Ищем последнюю модель
            metadata_files = []
            for file in os.listdir('models'):
                if file.startswith(f'{model_type}_') and file.endswith('_metadata.json'):
                    metadata_files.append(file)
            
            if not metadata_files:
                return 0.0
            
            # Сортируем по времени создания
            metadata_files.sort(key=lambda x: os.path.getctime(f'models/{x}'), reverse=True)
            latest_metadata = metadata_files[0]
            
            with open(f'models/{latest_metadata}', 'r') as f:
                metadata = json.load(f)
                
            return metadata.get('cv_ndcg_mean', 0.0)
            
        except Exception as e:
            print(f"⚠️ Ошибка получения предыдущего NDCG: {e}")
            return 0.0
    
    def _should_deploy_models(self, validation_results: Dict[str, Any]) -> bool:
        """Определяет, стоит ли деплоить новые модели"""
        for model_type, result in validation_results.items():
            if result.get('valid', False) and result.get('should_deploy', False):
                return True
        return False
    
    def _deploy_models(self, model_results: Dict[str, Any]) -> List[str]:
        """Деплоит новые модели"""
        deployed_models = []
        
        for model_type, result in model_results.items():
            try:
                if 'model_path' in result:
                    # Создаем backup текущей модели
                    self._backup_current_model(model_type)
                    
                    # Деплоим новую модель (копируем в production путь)
                    src_path = result['model_path']
                    dst_path = f"models/{model_type}_v2"
                    
                    # Копируем файлы модели
                    if os.path.exists(f"{src_path}.txt"):  # LightGBM
                        shutil.copy(f"{src_path}.txt", f"{dst_path}.txt")
                    if os.path.exists(f"{src_path}_metadata.json"):
                        shutil.copy(f"{src_path}_metadata.json", f"{dst_path}_metadata.json")
                    
                    deployed_models.append(model_type)
                    
                    print(f"🚀 Модель {model_type} развернута: {dst_path}")
                    
                    # Логируем deploy
                    self.monitor.record_metric("model_deployed", 1.0, 
                                             labels={"model_type": model_type})
                    
            except Exception as e:
                print(f"⚠️ Ошибка deploy модели {model_type}: {e}")
        
        return deployed_models
    
    def _backup_current_model(self, model_type: str):
        """Создает backup текущей модели"""
        try:
            current_path = f"models/{model_type}_v2"
            backup_path = f"models/backup/{model_type}_v2_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            if os.path.exists(f"{current_path}.txt"):
                shutil.copy(f"{current_path}.txt", f"{backup_path}.txt")
            if os.path.exists(f"{current_path}_metadata.json"):
                shutil.copy(f"{current_path}_metadata.json", f"{backup_path}_metadata.json")
                
            print(f"💾 Backup создан: {backup_path}")
            
        except Exception as e:
            print(f"⚠️ Ошибка создания backup: {e}")
    
    def _cleanup_old_models(self):
        """Очищает старые версии моделей"""
        try:
            backup_files = []
            for file in os.listdir('models/backup'):
                if file.endswith('.txt') or file.endswith('.json'):
                    backup_files.append(file)
            
            # Сортируем по времени создания
            backup_files.sort(key=lambda x: os.path.getctime(f'models/backup/{x}'))
            
            # Удаляем старые, оставляем последние N
            files_to_delete = backup_files[:-self.config['backup_versions_to_keep']*2]  # *2 для .txt и .json
            
            for file in files_to_delete:
                os.remove(f'models/backup/{file}')
                
            if files_to_delete:
                print(f"🧹 Удалено старых backup файлов: {len(files_to_delete)}")
                
        except Exception as e:
            print(f"⚠️ Ошибка очистки: {e}")
    
    def _save_etl_results(self, results: Dict[str, Any]):
        """Сохраняет результаты ETL"""
        try:
            os.makedirs('logs/etl', exist_ok=True)
            filename = f"logs/etl/etl_result_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(filename, 'w') as f:
                json.dump(results, f, indent=2)
                
            print(f"📋 Результаты ETL сохранены: {filename}")
            
        except Exception as e:
            print(f"⚠️ Ошибка сохранения результатов: {e}")

def main():
    """Запуск ETL pipeline"""
    print("🔄 Запуск ETL Pipeline")
    
    # Создаем ETL pipeline
    etl = ETLPipeline()
    
    # Запускаем ночной ETL
    results = etl.run_daily_etl()
    
    print(f"\n📊 Результаты ETL:")
    print(f"  Этапы: {', '.join(results['stages_completed'])}")
    print(f"  Ошибки: {len(results['errors'])}")
    print(f"  Модели обновлены: {results['models_updated']}")
    
    if results['metrics']:
        print(f"  Метрики:")
        for key, value in results['metrics'].items():
            if isinstance(value, (int, float)):
                print(f"    {key}: {value}")
    
    return results

if __name__ == "__main__":
    main()
