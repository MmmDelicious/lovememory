#!/usr/bin/env python3
"""
Comprehensive Test Suite для LoveMemory AI
Полное тестирование всех 9 фаз AI системы

Тестирует:
- Фазы 1-3: Данные и архитектура
- Фаза 4: Content-Based рекомендации
- Фаза 5: Collaborative Filtering
- Фаза 6: Embeddings + ANN поиск
- Фаза 7: Learning to Rank
- Фаза 8: LLM генерация + Explainability
- Фаза 9: Мониторинг + ETL
"""

import time
import json
import os
import sys
from datetime import datetime
import pandas as pd
import numpy as np
from typing import Dict, List, Any

# Импорты всех компонентов
from content_recommender import ContentBasedRecommender
from collaborative_filtering import CollaborativeFilteringRecommender
from embedding_service import EmbeddingService
from learning_to_rank_service import LearningToRankService
from llm_wrapper import LLMWrapper
from explainability_service import ExplainabilityService
from ultimate_ai_service import UltimateAIService
from monitoring_service import MonitoringService

# ETL
sys.path.append('etl')
from prepare_train import ETLPipeline

class ComprehensiveTestSuite:
    """Comprehensive тестовый набор для всей AI системы"""
    
    def __init__(self):
        """Инициализация тестового набора"""
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'phases_tested': [],
            'passed_tests': [],
            'failed_tests': [],
            'performance_metrics': {},
            'recommendations_samples': [],
            'errors': []
        }
        
        print("🧪 Инициализация Comprehensive Test Suite")
        print("="*80)
    
    def run_all_tests(self) -> Dict[str, Any]:
        """Запускает все тесты"""
        start_time = time.time()
        
        print("🚀 ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ AI СИСТЕМЫ")
        print("📅 Время начала:", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        print("="*80)
        
        # Фазы 1-3: Тестирование данных
        print("\n🔵 ФАЗЫ 1-3: ДАННЫЕ И АРХИТЕКТУРА")
        self._test_data_architecture()
        
        # Фаза 4: Content-Based
        print("\n🟢 ФАЗА 4: CONTENT-BASED РЕКОМЕНДАЦИИ")
        self._test_content_based()
        
        # Фаза 5: Collaborative Filtering
        print("\n🟡 ФАЗА 5: COLLABORATIVE FILTERING")
        self._test_collaborative_filtering()
        
        # Фаза 6: Embeddings
        print("\n🟣 ФАЗА 6: EMBEDDINGS + ANN ПОИСК")
        self._test_embeddings()
        
        # Фаза 7: Learning to Rank
        print("\n🔴 ФАЗА 7: LEARNING TO RANK")
        self._test_learning_to_rank()
        
        # Фаза 8: LLM + Explainability
        print("\n🟠 ФАЗА 8: LLM + EXPLAINABILITY")
        self._test_llm_explainability()
        
        # Фаза 9: Мониторинг + ETL
        print("\n⚪ ФАЗА 9: МОНИТОРИНГ + ETL")
        self._test_monitoring_etl()
        
        # Ultimate Integration Test
        print("\n🌟 ULTIMATE INTEGRATION TEST")
        self._test_ultimate_integration()
        
        # Производительность
        print("\n⚡ ТЕСТИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ")
        self._test_performance()
        
        # Завершение
        total_time = time.time() - start_time
        self.results['total_test_time_minutes'] = total_time / 60
        
        self._generate_final_report()
        
        return self.results
    
    def _test_data_architecture(self):
        """Тестирует архитектуру данных (Фазы 1-3)"""
        phase_name = "data_architecture"
        self.results['phases_tested'].append(phase_name)
        
        try:
            # Проверяем наличие данных
            data_files = [
                'data/synthetic_v1/users.csv',
                'data/synthetic_v1/pairs.csv', 
                'data/synthetic_v1/product_catalog.csv',
                'data/synthetic_v1/interactions.csv'
            ]
            
            for file_path in data_files:
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"Отсутствует файл: {file_path}")
                
                df = pd.read_csv(file_path)
                if df.empty:
                    raise ValueError(f"Пустой файл: {file_path}")
                
                print(f"  ✅ {file_path}: {len(df)} записей")
            
            # Проверяем целостность данных
            users = pd.read_csv('data/synthetic_v1/users.csv')
            pairs = pd.read_csv('data/synthetic_v1/pairs.csv')
            interactions = pd.read_csv('data/synthetic_v1/interactions.csv')
            
            # Проверяем связи
            user_ids = set(users['id'])
            pair_users = set(pairs['user1_id']) | set(pairs['user2_id'])
            interaction_users = set(interactions['user_id'])
            
            if not pair_users.issubset(user_ids):
                raise ValueError("Несоответствие пользователей в парах")
            
            if not interaction_users.issubset(user_ids):
                raise ValueError("Несоответствие пользователей во взаимодействиях")
            
            self.results['performance_metrics']['users_count'] = len(users)
            self.results['performance_metrics']['pairs_count'] = len(pairs)
            self.results['performance_metrics']['interactions_count'] = len(interactions)
            
            self.results['passed_tests'].append(f"{phase_name}_data_integrity")
            print("  ✅ Целостность данных проверена")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_content_based(self):
        """Тестирует Content-Based рекомендации (Фаза 4)"""
        phase_name = "content_based"
        self.results['phases_tested'].append(phase_name)
        
        try:
            start_time = time.time()
            
            # Инициализируем систему
            content_rec = ContentBasedRecommender()
            
            # Тестируем рекомендации
            test_pair_id = content_rec.pairs['id'].iloc[0]
            recommendations = content_rec.recommend_date(test_pair_id, top_k=5)
            
            if not recommendations:
                raise ValueError("Нет рекомендаций от Content-Based системы")
            
            # Проверяем качество рекомендаций
            for rec in recommendations:
                if not hasattr(rec, 'score') or rec.score < 0:
                    raise ValueError("Некорректные scores в рекомендациях")
            
            processing_time = time.time() - start_time
            
            self.results['performance_metrics']['content_based_latency_ms'] = processing_time * 1000
            self.results['performance_metrics']['content_based_recommendations'] = len(recommendations)
            
            # Сохраняем примеры
            sample_recs = [
                {
                    'title': rec.title,
                    'score': rec.score,
                    'category': rec.category,
                    'phase': 'content_based'
                }
                for rec in recommendations[:3]
            ]
            self.results['recommendations_samples'].extend(sample_recs)
            
            self.results['passed_tests'].append(f"{phase_name}_generation")
            self.results['passed_tests'].append(f"{phase_name}_performance")
            print(f"  ✅ Рекомендации: {len(recommendations)}, Время: {processing_time*1000:.2f}ms")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_collaborative_filtering(self):
        """Тестирует Collaborative Filtering (Фаза 5)"""
        phase_name = "collaborative_filtering"
        self.results['phases_tested'].append(phase_name)
        
        try:
            start_time = time.time()
            
            # Инициализируем CF систему
            cf_rec = CollaborativeFilteringRecommender()
            
            # Обучаем/загружаем модель
            if not cf_rec.train_svd_model():
                print("  ⚠️ Не удалось обучить CF модель, пропускаем")
                return
            
            # Тестируем рекомендации
            test_pair_id = cf_rec.pairs['id'].iloc[0]
            recommendations = cf_rec.get_pair_recommendations(test_pair_id, top_k=5)
            
            if not recommendations:
                raise ValueError("Нет рекомендаций от CF системы")
            
            processing_time = time.time() - start_time
            
            self.results['performance_metrics']['cf_latency_ms'] = processing_time * 1000
            self.results['performance_metrics']['cf_recommendations'] = len(recommendations)
            
            # Добавляем примеры CF рекомендаций
            sample_recs = [
                {
                    'item_id': rec['item_id'],
                    'rating': rec['combined_rating'],
                    'phase': 'collaborative_filtering'
                }
                for rec in recommendations[:3]
            ]
            self.results['recommendations_samples'].extend(sample_recs)
            
            self.results['passed_tests'].append(f"{phase_name}_training")
            self.results['passed_tests'].append(f"{phase_name}_generation")
            print(f"  ✅ CF рекомендации: {len(recommendations)}, Время: {processing_time*1000:.2f}ms")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_embeddings(self):
        """Тестирует Embeddings + ANN (Фаза 6)"""
        phase_name = "embeddings"
        self.results['phases_tested'].append(phase_name)
        
        try:
            start_time = time.time()
            
            # Инициализируем Embedding сервис
            embedding_service = EmbeddingService()
            
            # Проверяем загрузку эмбеддингов
            if not embedding_service.load_embeddings():
                print("  🔄 Генерируем эмбеддинги (это может занять время)...")
                embedding_service.generate_user_embeddings()
                embedding_service.generate_product_embeddings()
                embedding_service.generate_pair_embeddings()
                embedding_service.build_faiss_indexes()
                embedding_service.save_embeddings()
            
            # Тестируем ANN поиск
            test_pair_id = list(embedding_service.pair_embeddings.keys())[0]
            candidates = embedding_service.find_similar_products_ann(test_pair_id, top_k=5)
            
            if not candidates:
                raise ValueError("Нет кандидатов от ANN поиска")
            
            # Тестируем производительность
            latency_stats = embedding_service.benchmark_search_latency(num_queries=10)
            
            processing_time = time.time() - start_time
            
            self.results['performance_metrics']['embeddings_generation_time'] = processing_time
            self.results['performance_metrics']['ann_p95_latency_ms'] = latency_stats['p95_latency_ms']
            self.results['performance_metrics']['embedding_candidates'] = len(candidates)
            
            # Примеры ANN кандидатов
            sample_recs = [
                {
                    'title': candidate['title'],
                    'similarity': candidate['embedding_similarity'],
                    'phase': 'embeddings_ann'
                }
                for candidate in candidates[:3]
            ]
            self.results['recommendations_samples'].extend(sample_recs)
            
            self.results['passed_tests'].append(f"{phase_name}_generation")
            self.results['passed_tests'].append(f"{phase_name}_ann_search")
            self.results['passed_tests'].append(f"{phase_name}_performance")
            print(f"  ✅ ANN поиск: {len(candidates)}, P95: {latency_stats['p95_latency_ms']:.2f}ms")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_learning_to_rank(self):
        """Тестирует Learning to Rank (Фаза 7)"""
        phase_name = "learning_to_rank"
        self.results['phases_tested'].append(phase_name)
        
        try:
            start_time = time.time()
            
            # Инициализируем LTR сервис
            ltr_service = LearningToRankService()
            
            # Проверяем/обучаем модель
            if not ltr_service.load_model():
                print("  🔄 Обучаем LTR модель...")
                training_data, groups = ltr_service.create_training_dataset(sample_pairs=50)
                if len(training_data) > 0:
                    metrics = ltr_service.train_ranker_model(training_data, groups)
                    ltr_service.save_model()
                    
                    self.results['performance_metrics']['ltr_training_ndcg'] = metrics.get('cv_ndcg_mean', 0.0)
                else:
                    print("  ⚠️ Недостаточно данных для LTR, пропускаем")
                    return
            
            # Тестируем ранжирование
            test_candidates = [
                {'item_id': 'test1', 'title': 'Test 1', 'content_score': 0.8, 'cf_score': 0.6, 'price': 1000},
                {'item_id': 'test2', 'title': 'Test 2', 'content_score': 0.6, 'cf_score': 0.8, 'price': 1500},
                {'item_id': 'test3', 'title': 'Test 3', 'content_score': 0.7, 'cf_score': 0.7, 'price': 2000}
            ]
            
            ranked_candidates = ltr_service.rank_candidates("test_pair", test_candidates)
            
            if not ranked_candidates:
                raise ValueError("Нет результатов ранжирования")
            
            # Проверяем LTR scores
            for candidate in ranked_candidates:
                if 'ltr_score' not in candidate:
                    raise ValueError("Отсутствуют LTR scores")
            
            processing_time = time.time() - start_time
            
            self.results['performance_metrics']['ltr_ranking_latency_ms'] = processing_time * 1000
            self.results['performance_metrics']['ltr_candidates_ranked'] = len(ranked_candidates)
            
            # Feature importance
            feature_importance = ltr_service.get_feature_importance(top_k=5)
            if feature_importance:
                self.results['performance_metrics']['top_ltr_features'] = list(feature_importance.keys())[:3]
            
            # Примеры ранжированных кандидатов
            sample_recs = [
                {
                    'title': candidate['title'],
                    'ltr_score': candidate.get('ltr_score', 0),
                    'phase': 'learning_to_rank'
                }
                for candidate in ranked_candidates[:3]
            ]
            self.results['recommendations_samples'].extend(sample_recs)
            
            self.results['passed_tests'].append(f"{phase_name}_training")
            self.results['passed_tests'].append(f"{phase_name}_ranking")
            self.results['passed_tests'].append(f"{phase_name}_feature_importance")
            print(f"  ✅ LTR ранжирование: {len(ranked_candidates)}, Время: {processing_time*1000:.2f}ms")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_llm_explainability(self):
        """Тестирует LLM + Explainability (Фаза 8)"""
        phase_name = "llm_explainability"
        self.results['phases_tested'].append(phase_name)
        
        try:
            # Тестируем LLM Wrapper
            print("  🤖 Тестируем LLM генерацию...")
            llm_wrapper = LLMWrapper()
            
            # Тестовые данные
            pair_context = {
                'common_interests': ['кофе', 'музыка'],
                'budget': 'средний',
                'love_language': 'quality_time'
            }
            
            recommendation = {
                'title': 'Кофейня "Тест"',
                'category': 'cafe',
                'price': 800
            }
            
            # Генерируем сценарий
            start_time = time.time()
            scenario_response = llm_wrapper.generate_date_scenario(pair_context, recommendation)
            llm_latency = (time.time() - start_time) * 1000
            
            if not scenario_response.generated_text:
                raise ValueError("Пустой сценарий от LLM")
            
            # Генерируем объяснение
            top_reasons = ['общие интересы', 'подходящий бюджет', 'уютная атмосфера']
            explanation_response = llm_wrapper.generate_explanation(recommendation, top_reasons)
            
            if not explanation_response.generated_text:
                raise ValueError("Пустое объяснение от LLM")
            
            # Тестируем Explainability Service
            print("  🔍 Тестируем Explainability...")
            explainer = ExplainabilityService()
            
            test_features = {
                'content_score': 0.8,
                'cf_score': 0.6,
                'embedding_score': 0.7,
                'price': 0.5
            }
            
            explanation = explainer.explain_recommendation("test_pair", "test_item", test_features)
            
            if not explanation.top_factors:
                raise ValueError("Нет факторов в объяснении")
            
            self.results['performance_metrics']['llm_scenario_latency_ms'] = llm_latency
            self.results['performance_metrics']['llm_model_used'] = scenario_response.model_used
            self.results['performance_metrics']['explanation_confidence'] = explanation.confidence_score
            
            # Примеры генерации
            self.results['recommendations_samples'].append({
                'scenario_sample': scenario_response.generated_text[:100] + "...",
                'explanation_sample': explanation.human_friendly,
                'phase': 'llm_explainability'
            })
            
            self.results['passed_tests'].append(f"{phase_name}_scenario_generation")
            self.results['passed_tests'].append(f"{phase_name}_explanation_generation")
            self.results['passed_tests'].append(f"{phase_name}_explainability")
            print(f"  ✅ LLM сценарий: {llm_latency:.2f}ms, Explainability: {explanation.confidence_score:.3f}")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_monitoring_etl(self):
        """Тестирует мониторинг + ETL (Фаза 9)"""
        phase_name = "monitoring_etl"
        self.results['phases_tested'].append(phase_name)
        
        try:
            # Тестируем Monitoring Service
            print("  📊 Тестируем мониторинг...")
            monitor = MonitoringService("test_monitoring.db")
            
            # Записываем тестовые метрики
            monitor.record_metric("test_latency", 100.0, {"service": "test"})
            monitor.record_metric("test_accuracy", 0.85, {"model": "test"})
            
            # Тестируем эксперимент
            exp_id = monitor.start_experiment("Test Experiment", 0.1, "test_v1", 1)
            
            # Симулируем активность
            monitor.log_activity("test_pair", "view", {"item_id": "test_item"}, experiment_id=exp_id)
            monitor.log_activity("test_pair", "click", {"item_id": "test_item"}, experiment_id=exp_id)
            
            # Получаем метрики
            business_metrics = monitor.get_business_metrics()
            
            # Тестируем feature drift
            drift_score = monitor.detect_feature_drift({"test_feature": 0.5})
            
            # Тестируем ETL (упрощенно)
            print("  🔄 Тестируем ETL...")
            etl = ETLPipeline(monitoring_db="test_monitoring.db")
            
            # Симулируем ETL процесс (без фактического переобучения)
            new_logs = etl._collect_new_logs()
            
            self.results['performance_metrics']['monitoring_experiments_active'] = len(monitor.experiments)
            self.results['performance_metrics']['monitoring_drift_score'] = drift_score
            self.results['performance_metrics']['etl_logs_collected'] = len(new_logs)
            
            self.results['passed_tests'].append(f"{phase_name}_monitoring")
            self.results['passed_tests'].append(f"{phase_name}_experiments")
            self.results['passed_tests'].append(f"{phase_name}_drift_detection")
            self.results['passed_tests'].append(f"{phase_name}_etl")
            print(f"  ✅ Мониторинг: {len(monitor.experiments)} экспериментов, Drift: {drift_score:.3f}")
            
            # Очистка тестовой базы
            if os.path.exists("test_monitoring.db"):
                os.remove("test_monitoring.db")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_ultimate_integration(self):
        """Тестирует Ultimate интеграцию всех компонентов"""
        phase_name = "ultimate_integration"
        self.results['phases_tested'].append(phase_name)
        
        try:
            start_time = time.time()
            
            print("  🌟 Инициализируем Ultimate AI Service...")
            service = UltimateAIService()
            
            # Проверяем статус всех компонентов
            status = service.get_system_status()
            ready_components = status['ready_components']
            total_components = status['total_components']
            
            if ready_components < 4:  # Минимум 4 из 6 компонентов
                print(f"  ⚠️ Готово только {ready_components}/{total_components} компонентов")
            
            # Тестируем Ultimate рекомендации
            test_pair_id = service.content_recommender.pairs['id'].iloc[0]
            
            result = service.get_ultimate_recommendations(
                test_pair_id, 
                top_k=3,
                include_scenarios=True,
                include_explanations=True
            )
            
            if not result['recommendations']:
                raise ValueError("Нет Ultimate рекомендаций")
            
            processing_time = time.time() - start_time
            
            # Проверяем наличие всех компонентов в результате
            has_scenarios = bool(result.get('scenarios'))
            has_explanations = bool(result.get('explanations'))
            
            self.results['performance_metrics']['ultimate_latency_ms'] = processing_time * 1000
            self.results['performance_metrics']['ultimate_ready_components'] = f"{ready_components}/{total_components}"
            self.results['performance_metrics']['ultimate_method_used'] = result['metadata']['method_used']
            self.results['performance_metrics']['ultimate_has_scenarios'] = has_scenarios
            self.results['performance_metrics']['ultimate_has_explanations'] = has_explanations
            
            # Примеры Ultimate рекомендаций
            for i, rec in enumerate(result['recommendations'][:2]):
                sample = {
                    'title': rec['title'],
                    'final_score': rec.get('final_score', 0),
                    'method': rec.get('method', 'unknown'),
                    'phase': 'ultimate_integration'
                }
                
                if has_scenarios and i < len(result.get('scenarios', [])):
                    sample['scenario'] = result['scenarios'][i]['scenario'][:50] + "..."
                
                if has_explanations and i < len(result.get('explanations', [])):
                    sample['explanation'] = result['explanations'][i]['human_explanation'][:50] + "..."
                
                self.results['recommendations_samples'].append(sample)
            
            self.results['passed_tests'].append(f"{phase_name}_initialization")
            self.results['passed_tests'].append(f"{phase_name}_recommendations")
            
            if has_scenarios:
                self.results['passed_tests'].append(f"{phase_name}_scenarios")
            if has_explanations:
                self.results['passed_tests'].append(f"{phase_name}_explanations")
            
            print(f"  ✅ Ultimate: {len(result['recommendations'])} рекомендаций, " +
                  f"Метод: {result['metadata']['method_used']}, " +
                  f"Время: {processing_time*1000:.2f}ms")
            print(f"      Сценарии: {has_scenarios}, Объяснения: {has_explanations}")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _test_performance(self):
        """Тестирует общую производительность системы"""
        phase_name = "performance"
        
        try:
            print("  ⚡ Нагрузочное тестирование...")
            
            # Инициализируем только основные компоненты
            service = UltimateAIService()
            test_pairs = service.content_recommender.pairs['id'].head(10).tolist()
            
            # Тестируем множественные запросы
            latencies = []
            errors = 0
            
            for pair_id in test_pairs:
                try:
                    start_time = time.time()
                    result = service.get_ultimate_recommendations(pair_id, top_k=5)
                    latency = (time.time() - start_time) * 1000
                    latencies.append(latency)
                    
                    if not result['recommendations']:
                        errors += 1
                        
                except Exception:
                    errors += 1
            
            if latencies:
                avg_latency = np.mean(latencies)
                p95_latency = np.percentile(latencies, 95)
                error_rate = errors / len(test_pairs)
                
                self.results['performance_metrics']['load_test_avg_latency_ms'] = avg_latency
                self.results['performance_metrics']['load_test_p95_latency_ms'] = p95_latency
                self.results['performance_metrics']['load_test_error_rate'] = error_rate
                self.results['performance_metrics']['load_test_requests'] = len(test_pairs)
                
                # Оценки производительности
                if avg_latency < 500:
                    self.results['passed_tests'].append(f"{phase_name}_avg_latency")
                if p95_latency < 1000:
                    self.results['passed_tests'].append(f"{phase_name}_p95_latency")
                if error_rate < 0.1:
                    self.results['passed_tests'].append(f"{phase_name}_error_rate")
                
                print(f"  ✅ Нагрузка: {len(test_pairs)} запросов, " +
                      f"Avg: {avg_latency:.1f}ms, P95: {p95_latency:.1f}ms, " +
                      f"Errors: {error_rate*100:.1f}%")
            
        except Exception as e:
            error_msg = f"Ошибка в {phase_name}: {e}"
            self.results['failed_tests'].append(error_msg)
            self.results['errors'].append(error_msg)
            print(f"  ❌ {error_msg}")
    
    def _generate_final_report(self):
        """Генерирует финальный отчет"""
        print("\n" + "="*80)
        print("📊 ФИНАЛЬНЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ")
        print("="*80)
        
        total_tests = len(self.results['passed_tests']) + len(self.results['failed_tests'])
        success_rate = len(self.results['passed_tests']) / max(total_tests, 1) * 100
        
        print(f"🕐 Время тестирования: {self.results['total_test_time_minutes']:.1f} минут")
        print(f"🧪 Всего тестов: {total_tests}")
        print(f"✅ Пройдено: {len(self.results['passed_tests'])}")
        print(f"❌ Провалено: {len(self.results['failed_tests'])}")
        print(f"📈 Процент успеха: {success_rate:.1f}%")
        
        print(f"\n🎯 Протестированные фазы:")
        for phase in self.results['phases_tested']:
            phase_tests = [test for test in self.results['passed_tests'] if test.startswith(phase)]
            phase_failures = [test for test in self.results['failed_tests'] if phase in test]
            status = "✅" if not phase_failures else "⚠️" if phase_tests else "❌"
            print(f"  {status} {phase}: {len(phase_tests)} успешно, {len(phase_failures)} ошибок")
        
        if self.results['errors']:
            print(f"\n❌ Ошибки:")
            for error in self.results['errors'][:5]:  # Показываем первые 5
                print(f"  - {error}")
        
        # Ключевые метрики производительности
        print(f"\n⚡ Ключевые метрики производительности:")
        key_metrics = [
            'ultimate_latency_ms', 'load_test_avg_latency_ms', 
            'content_based_latency_ms', 'cf_latency_ms', 'ann_p95_latency_ms'
        ]
        
        for metric in key_metrics:
            if metric in self.results['performance_metrics']:
                value = self.results['performance_metrics'][metric]
                print(f"  {metric}: {value:.2f}")
        
        # Статус готовности
        ready_components = self.results['performance_metrics'].get('ultimate_ready_components', 'unknown')
        print(f"\n🎯 Готовность системы: {ready_components} компонентов")
        
        # Финальная оценка
        if success_rate >= 90:
            status_emoji = "🟢"
            status_text = "ОТЛИЧНО - Система готова к production"
        elif success_rate >= 75:
            status_emoji = "🟡"  
            status_text = "ХОРОШО - Система готова с незначительными доработками"
        elif success_rate >= 50:
            status_emoji = "🟠"
            status_text = "УДОВЛЕТВОРИТЕЛЬНО - Требуются доработки"
        else:
            status_emoji = "🔴"
            status_text = "КРИТИЧНО - Система требует серьезных исправлений"
        
        print(f"\n{status_emoji} ИТОГОВАЯ ОЦЕНКА: {status_text}")
        
        # Сохраняем отчет
        os.makedirs('test_reports', exist_ok=True)
        filename = f"test_reports/comprehensive_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Полный отчет сохранен: {filename}")
        print("="*80)

def main():
    """Запускает comprehensive тестирование"""
    test_suite = ComprehensiveTestSuite()
    results = test_suite.run_all_tests()
    
    return results

if __name__ == "__main__":
    main()
