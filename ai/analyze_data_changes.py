#!/usr/bin/env python3
"""
Анализ изменений в данных после внедрения реалистичной функции рейтинга
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

def analyze_rating_distribution():
    """Анализирует распределение рейтингов до и после изменений"""
    
    print("📊 АНАЛИЗ ИЗМЕНЕНИЙ В ДАННЫХ")
    print("="*80)
    
    # Загружаем новые данные
    interactions = pd.read_csv('data/synthetic_v1/interactions.csv')
    users = pd.read_csv('data/synthetic_v1/users.csv')
    product_catalog = pd.read_csv('data/synthetic_v1/product_catalog.csv')
    
    print(f"📈 Общая статистика:")
    print(f"  - Взаимодействий: {len(interactions):,}")
    print(f"  - Уникальных товаров: {len(product_catalog)}")
    print(f"  - Пользователей: {len(users)}")
    
    # Анализируем рейтинги
    rating_interactions = interactions[interactions['action'] == 'rating']
    
    print(f"\n📊 Анализ рейтингов:")
    print(f"  - Рейтинговых взаимодействий: {len(rating_interactions):,}")
    print(f"  - Средний рейтинг: {rating_interactions['rating'].mean():.3f}")
    print(f"  - Медианный рейтинг: {rating_interactions['rating'].median():.3f}")
    print(f"  - Стандартное отклонение: {rating_interactions['rating'].std():.3f}")
    print(f"  - Минимальный рейтинг: {rating_interactions['rating'].min():.3f}")
    print(f"  - Максимальный рейтинг: {rating_interactions['rating'].max():.3f}")
    
    # Распределение по диапазонам
    print(f"\n📈 Распределение рейтингов:")
    bins = [1, 3, 5, 7, 10]
    labels = ['Очень низкий (1-3)', 'Низкий (3-5)', 'Средний (5-7)', 'Высокий (7-10)']
    rating_interactions['rating_category'] = pd.cut(rating_interactions['rating'], bins=bins, labels=labels, include_lowest=True)
    
    distribution = rating_interactions['rating_category'].value_counts()
    for category, count in distribution.items():
        percentage = count / len(rating_interactions) * 100
        print(f"  - {category}: {count:,} ({percentage:.1f}%)")
    
    # Анализ по архетипам
    print(f"\n🎭 Анализ по архетипам пользователей:")
    
    # Объединяем с данными пользователей
    interactions_with_users = rating_interactions.merge(users, left_on='user_id', right_on='id', how='left')
    
    archetype_stats = interactions_with_users.groupby('archetype')['rating'].agg(['mean', 'std', 'count']).round(3)
    print(archetype_stats)
    
    # Анализ по категориям товаров
    print(f"\n🏪 Анализ по категориям товаров:")
    
    interactions_with_products = rating_interactions.merge(product_catalog, left_on='product_id', right_on='id', how='left')
    category_stats = interactions_with_products.groupby('category')['rating'].agg(['mean', 'std', 'count']).round(3)
    print(category_stats)
    
    # Проверяем наличие реалистичности
    print(f"\n🔍 Проверка реалистичности данных:")
    
    # 1. Variance в рейтингах (должна быть больше чем раньше)
    variance = rating_interactions['rating'].var()
    print(f"  - Дисперсия рейтингов: {variance:.3f}")
    
    # 2. Количество "неожиданных" оценок (serendipity эффект)
    # Попробуем найти случаи где гурман поставил высокую оценку не-гурметскому месту
    unexpected_ratings = 0
    
    for archetype in ['ArtLovers', 'Gamers', 'Gourmets', 'Fitness', 'Travelers', 'Adventurers']:
        archetype_users = users[users['archetype'] == archetype]['id'].values
        archetype_interactions = interactions_with_products[
            interactions_with_products['user_id'].isin(archetype_users)
        ]
        
        # Ищем высокие рейтинги для "неподходящих" категорий
        if archetype == 'Gourmets':
            non_food = archetype_interactions[~archetype_interactions['category'].isin(['restaurant', 'cafe'])]
            high_ratings = non_food[non_food['rating'] >= 8]
            unexpected_ratings += len(high_ratings)
        elif archetype == 'ArtLovers':
            non_culture = archetype_interactions[~archetype_interactions['category'].isin(['activity'])]
            high_ratings = non_culture[non_culture['rating'] >= 8]
            unexpected_ratings += len(high_ratings)
    
    total_high_ratings = len(rating_interactions[rating_interactions['rating'] >= 8])
    serendipity_rate = unexpected_ratings / max(total_high_ratings, 1) * 100
    
    print(f"  - 'Неожиданные' высокие оценки: {unexpected_ratings}")
    print(f"  - Serendipity rate: {serendipity_rate:.1f}%")
    
    # 3. Проверяем негативные оценки (должно быть больше)
    negative_ratings = len(rating_interactions[rating_interactions['rating'] <= 3])
    negative_rate = negative_ratings / len(rating_interactions) * 100
    print(f"  - Негативные рейтинги (≤3): {negative_ratings} ({negative_rate:.1f}%)")
    
    # Сравнение со старой системой (ожидаемые значения)
    print(f"\n📊 Сравнение с предыдущей системой:")
    print(f"  - Ожидали: среднее ~6-7, дисперсия ~1-2")
    print(f"  - Получили: среднее {rating_interactions['rating'].mean():.1f}, дисперсия {variance:.1f}")
    
    if variance > 2.0:
        print(f"  ✅ Дисперсия увеличилась - данные стали более реалистичными")
    else:
        print(f"  ⚠️ Дисперсия все еще низкая - возможно нужно больше шума")
    
    if 4.0 <= rating_interactions['rating'].mean() <= 7.0:
        print(f"  ✅ Средний рейтинг в реалистичном диапазоне")
    else:
        print(f"  ⚠️ Средний рейтинг вне ожидаемого диапазона")
    
    if negative_rate >= 15:
        print(f"  ✅ Достаточно негативных оценок")
    else:
        print(f"  ⚠️ Мало негативных оценок - система все еще слишком 'позитивная'")
    
    return {
        'mean_rating': rating_interactions['rating'].mean(),
        'rating_variance': variance,
        'negative_rate': negative_rate,
        'serendipity_rate': serendipity_rate,
        'total_interactions': len(interactions),
        'rating_interactions': len(rating_interactions)
    }

def simulate_collaborative_filtering_impact(stats):
    """Симулирует ожидаемое влияние на CF метрики"""
    
    print(f"\n🤖 ПРОГНОЗ ВЛИЯНИЯ НА COLLABORATIVE FILTERING:")
    print("="*80)
    
    # Предыдущие метрики
    old_ndcg = 0.915
    old_rmse = 2.470
    
    # Новые метрики (из нашего теста)
    new_ndcg = 0.916  # Фактически изменился минимально
    new_rmse = 5.124  # Значительно вырос
    
    print(f"📊 Изменения в метриках CF:")
    print(f"  - NDCG@10: {old_ndcg:.3f} → {new_ndcg:.3f} (изменение: {((new_ndcg/old_ndcg - 1)*100):+.1f}%)")
    print(f"  - RMSE: {old_rmse:.3f} → {new_rmse:.3f} (изменение: {((new_rmse/old_rmse - 1)*100):+.1f}%)")
    
    print(f"\n🔍 Анализ:")
    print(f"  ✅ RMSE вырос в 2+ раза - данные стали сложнее для предсказания")
    print(f"  ⚠️ NDCG остался практически неизменным - паттерны все еще слишком четкие")
    
    print(f"\n💡 Рекомендации для дальнейшего улучшения:")
    print(f"  1. Увеличить фактор случайного 'настроения' с ±1.8 до ±2.5")
    print(f"  2. Поднять вероятность 'плохого дня' с 5% до 10%")
    print(f"  3. Добавить больше cross-category предпочтений")
    print(f"  4. Увеличить каталог до 200+ товаров для большей разреженности")
    
    # Ожидаемый результат
    expected_ndcg_improvement = "0.4-0.6"
    print(f"\n🎯 Ожидаемый NDCG после дополнительных улучшений: {expected_ndcg_improvement}")

def main():
    """Запуск анализа"""
    try:
        stats = analyze_rating_distribution()
        simulate_collaborative_filtering_impact(stats)
        
        print(f"\n🎉 ЗАКЛЮЧЕНИЕ:")
        print("="*80)
        print(f"✅ Реалистичная функция рейтинга внедрена успешно")
        print(f"✅ Каталог расширен с 12 до 75+ товаров")  
        print(f"✅ RMSE стал более реалистичным (2.47 → 5.12)")
        print(f"⚠️ NDCG все еще слишком высок (0.915 → 0.916)")
        print(f"📈 Требуется дополнительная настройка для снижения NDCG до 0.4-0.6")
        
    except Exception as e:
        print(f"❌ Ошибка анализа: {e}")
        print(f"Проверьте наличие файлов данных в data/synthetic_v1/")

if __name__ == "__main__":
    main()
