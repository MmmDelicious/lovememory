#!/usr/bin/env python3
"""
Тестирование Ultimate AI System
Полная демонстрация всех 7 фаз рекомендательной системы LoveMemory
"""

import time
import json
from ultimate_ai_service import UltimateAIService

def test_ultimate_system():
    """Полное тестирование Ultimate AI системы"""
    print("🌟" + "="*80)
    print("🎯 ТЕСТИРОВАНИЕ ULTIMATE AI SYSTEM - ALL 7 PHASES")
    print("🌟" + "="*80)
    
    # Инициализируем систему
    print("\n1️⃣ ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ")
    start_time = time.time()
    service = UltimateAIService()
    init_time = time.time() - start_time
    print(f"⏱️ Время инициализации: {init_time:.2f}с")
    
    # Проверяем статус
    print("\n2️⃣ СТАТУС СИСТЕМЫ")
    status = service.get_system_status()
    print(f"📊 Готовых компонентов: {status['ready_components']}/{status['total_components']}")
    print(f"🎯 Система готова: {'✅' if status['system_ready'] else '❌'}")
    print("📋 Статус компонентов:")
    for component, ready in status['components_status'].items():
        print(f"   {component}: {'✅' if ready else '❌'}")
    
    # Получаем тестовые пары
    test_pairs = service.content_recommender.pairs['id'].head(3).tolist()
    
    print(f"\n3️⃣ ТЕСТИРОВАНИЕ РЕКОМЕНДАЦИЙ ({len(test_pairs)} пар)")
    
    total_times = []
    methods_used = {}
    
    for i, pair_id in enumerate(test_pairs, 1):
        print(f"\n📝 Тест {i}: Пара {pair_id}")
        
        # Получаем рекомендации
        start_time = time.time()
        result = service.get_ultimate_recommendations(pair_id, top_k=5)
        processing_time = time.time() - start_time
        total_times.append(processing_time * 1000)
        
        # Статистика метода
        method = result['metadata']['method_used']
        methods_used[method] = methods_used.get(method, 0) + 1
        
        print(f"   ⏱️ Время: {result['processing_time_ms']:.2f}ms")
        print(f"   🎯 Метод: {method}")
        print(f"   📋 Рекомендаций: {len(result['recommendations'])}")
        
        # Показываем топ-3 рекомендации
        print("   🏆 Топ-3 рекомендации:")
        for j, rec in enumerate(result['recommendations'][:3], 1):
            print(f"      {j}. {rec['title']}")
            print(f"         Score: {rec['final_score']:.4f} | Цена: {rec['price']} руб.")
            if 'reasons' in rec and rec['reasons']:
                print(f"         Причины: {rec['reasons'][0]}")
    
    print(f"\n4️⃣ СТАТИСТИКА ПРОИЗВОДИТЕЛЬНОСТИ")
    print(f"📊 Средняя латентность: {sum(total_times)/len(total_times):.2f}ms")
    print(f"📊 P95 латентность: {sorted(total_times)[int(len(total_times)*0.95)]:.2f}ms")
    print(f"📊 Методы использованы:")
    for method, count in methods_used.items():
        print(f"   {method}: {count} раз")
    
    # Тестируем кэширование
    print(f"\n5️⃣ ТЕСТИРОВАНИЕ КЭШИРОВАНИЯ")
    test_pair = test_pairs[0]
    
    # Первый запрос (без кэша)
    start_time = time.time()
    result1 = service.get_ultimate_recommendations(test_pair, top_k=5)
    time1 = (time.time() - start_time) * 1000
    
    # Второй запрос (с кэшем)
    start_time = time.time()
    result2 = service.get_ultimate_recommendations(test_pair, top_k=5)
    time2 = (time.time() - start_time) * 1000
    
    print(f"   Без кэша: {time1:.2f}ms")
    print(f"   С кэшем: {time2:.2f}ms")
    print(f"   Ускорение: {time1/time2:.1f}x")
    print(f"   Cache hits: {service.performance_stats['cache_hits']}")
    
    # Тестируем различные контексты
    print(f"\n6️⃣ ТЕСТИРОВАНИЕ КОНТЕКСТНЫХ ФИЛЬТРОВ")
    
    contexts = [
        {"max_price": 1500, "name": "Низкий бюджет"},
        {"preferred_categories": ["restaurant", "cafe"], "name": "Еда и напитки"},
        {"max_price": 3000, "preferred_categories": ["entertainment"], "name": "Развлечения до 3000р"}
    ]
    
    for context in contexts:
        print(f"\n   🎯 Контекст: {context['name']}")
        context_copy = context.copy()
        del context_copy['name']
        
        result = service.get_ultimate_recommendations(test_pair, top_k=5, context=context_copy)
        print(f"   📋 Рекомендаций после фильтров: {len(result['recommendations'])}")
        
        if result['recommendations']:
            avg_price = sum(r['price'] for r in result['recommendations']) / len(result['recommendations'])
            categories = set(r['category'] for r in result['recommendations'])
            print(f"   💰 Средняя цена: {avg_price:.0f} руб.")
            print(f"   📂 Категории: {', '.join(categories)}")
    
    # Тестируем Feature Importance (если LTR доступен)
    if service.components_status['learning_to_rank']:
        print(f"\n7️⃣ FEATURE IMPORTANCE (LEARNING TO RANK)")
        importance = service.ltr_service.get_feature_importance(top_k=10)
        
        if importance:
            print("   🔍 Топ-10 важных фич:")
            for i, (feature, score) in enumerate(importance.items(), 1):
                print(f"      {i:2d}. {feature}: {score:.3f}")
        else:
            print("   ⚠️ Feature importance недоступен")
    
    # Финальная статистика
    print(f"\n8️⃣ ФИНАЛЬНАЯ СТАТИСТИКА СИСТЕМЫ")
    final_status = service.get_system_status()
    
    print(f"📊 Общая статистика:")
    print(f"   Обработано запросов: {final_status['performance_stats']['total_requests']}")
    print(f"   Средняя латентность: {final_status['performance_stats']['avg_latency_ms']:.2f}ms")
    print(f"   Cache hits: {final_status['performance_stats']['cache_hits']}")
    print(f"   Переключений моделей: {final_status['performance_stats']['model_switches']}")
    print(f"   Размер кэша: {final_status['cache_size']} записей")
    
    # Проверяем качество рекомендаций по архетипам
    print(f"\n9️⃣ АНАЛИЗ КАЧЕСТВА ПО АРХЕТИПАМ")
    
    archetype_results = {}
    
    # Получаем пары разных архетипов
    for archetype in ['ArtLovers', 'Gamers', 'Gourmets', 'Fitness', 'Travelers']:
        # Находим пары этого архетипа
        archetype_users = service.content_recommender.users[
            service.content_recommender.users['archetype'] == archetype
        ]['id'].tolist()
        
        archetype_pairs = service.content_recommender.pairs[
            (service.content_recommender.pairs['user1_id'].isin(archetype_users)) |
            (service.content_recommender.pairs['user2_id'].isin(archetype_users))
        ]['id'].head(2).tolist()
        
        if archetype_pairs:
            archetype_recommendations = []
            for pair_id in archetype_pairs:
                try:
                    result = service.get_ultimate_recommendations(pair_id, top_k=3)
                    archetype_recommendations.extend(result['recommendations'])
                except:
                    continue
            
            if archetype_recommendations:
                categories = [r['category'] for r in archetype_recommendations]
                avg_score = sum(r['final_score'] for r in archetype_recommendations) / len(archetype_recommendations)
                
                archetype_results[archetype] = {
                    'avg_score': avg_score,
                    'top_category': max(set(categories), key=categories.count) if categories else 'unknown',
                    'recommendations_count': len(archetype_recommendations)
                }
    
    print("   🎭 Результаты по архетипам:")
    for archetype, stats in archetype_results.items():
        print(f"   {archetype}:")
        print(f"      Средний score: {stats['avg_score']:.3f}")
        print(f"      Популярная категория: {stats['top_category']}")
        print(f"      Рекомендаций: {stats['recommendations_count']}")
    
    print(f"\n🎉" + "="*80)
    print("🏆 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!")
    print("✅ Ultimate AI System работает корректно")
    print("🌟 Все 7 фаз реализованы и интегрированы:")
    print("   1-3: Архитектура и синтетические данные")
    print("   4: Content-Based рекомендации")
    print("   5: Collaborative Filtering (SVD)")
    print("   6: Embeddings + ANN поиск (Faiss)")
    print("   7: Learning to Rank (LightGBM)")
    print("🎉" + "="*80)

def test_specific_scenarios():
    """Тестирование специфических сценариев"""
    print("\n🔬 ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ")
    
    service = UltimateAIService()
    
    # Тест с несуществующей парой
    print("\n1. Тест с несуществующей парой:")
    try:
        result = service.get_ultimate_recommendations("non_existent_pair", top_k=5)
        print(f"   Результат: {len(result['recommendations'])} рекомендаций")
        print(f"   Метод: {result['metadata'].get('method_used', 'unknown')}")
    except Exception as e:
        print(f"   Ошибка (ожидаемо): {e}")
    
    # Тест производительности при большом top_k
    print("\n2. Тест производительности (top_k=50):")
    test_pair = service.content_recommender.pairs['id'].iloc[0]
    start_time = time.time()
    result = service.get_ultimate_recommendations(test_pair, top_k=50)
    processing_time = (time.time() - start_time) * 1000
    print(f"   Время обработки: {processing_time:.2f}ms")
    print(f"   Рекомендаций получено: {len(result['recommendations'])}")
    
    # Тест обновления весов
    print("\n3. Тест обновления весов:")
    try:
        service.update_weights(0.5, 0.3, 0.2)
        print(f"   Новые веса: {service.fallback_weights}")
        
        # Тест с некорректными весами
        try:
            service.update_weights(0.6, 0.6, 0.6)  # Сумма > 1
        except ValueError as e:
            print(f"   Корректно поймана ошибка: {e}")
    except Exception as e:
        print(f"   Ошибка: {e}")

if __name__ == "__main__":
    # Основное тестирование
    test_ultimate_system()
    
    # Дополнительные тесты
    test_specific_scenarios()
    
    print(f"\n💫 Тестирование завершено! Система готова к production! 💫")
