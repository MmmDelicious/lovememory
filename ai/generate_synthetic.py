"""
Генератор синтетических данных для LoveMemory AI
Создает 2000 виртуальных пар с архетипами для холодного старта ML моделей
"""

import random
import uuid
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import os

# Архетипы пользователей согласно плану
ARCHETYPES = {
    'Gourmets': {
        'interests': ['Итальянская кухня', 'Азиатская кухня', 'Кофе', 'Вино', 'Крафтовое пиво', 'Десерты'],
        'love_languages': {'quality_time': 0.8, 'physical_touch': 0.3, 'words_of_affirmation': 0.6, 'acts_of_service': 0.7, 'receiving_gifts': 0.4},
        'budget_preference': 'medium',
        'time_preference': {'evening': 0.9, 'afternoon': 0.6, 'morning': 0.2, 'night': 0.3},
        'activity_probability': 0.8
    },
    'Homebodies': {
        'interests': ['Сериалы', 'Настольные игры', 'Кулинария', 'Книги', 'Рукоделие', 'Домашние животные'],
        'love_languages': {'quality_time': 0.9, 'physical_touch': 0.8, 'words_of_affirmation': 0.7, 'acts_of_service': 0.6, 'receiving_gifts': 0.5},
        'budget_preference': 'low',
        'time_preference': {'evening': 0.8, 'afternoon': 0.7, 'morning': 0.4, 'night': 0.5},
        'activity_probability': 0.6
    },
    'Gamers': {
        'interests': ['Видеоигры', 'Настольные игры', 'Квесты', 'Фантастика', 'Электронная музыка', 'Технологии'],
        'love_languages': {'quality_time': 0.7, 'physical_touch': 0.4, 'words_of_affirmation': 0.5, 'acts_of_service': 0.3, 'receiving_gifts': 0.8},
        'budget_preference': 'medium',
        'time_preference': {'evening': 0.9, 'night': 0.8, 'afternoon': 0.5, 'morning': 0.1},
        'activity_probability': 0.9
    },
    'Travelers': {
        'interests': ['Городские поездки', 'Пляжный отдых', 'Горы', 'Фотография', 'Культурный туризм', 'Автопутешествия'],
        'love_languages': {'quality_time': 0.9, 'physical_touch': 0.6, 'words_of_affirmation': 0.7, 'acts_of_service': 0.5, 'receiving_gifts': 0.6},
        'budget_preference': 'high',
        'time_preference': {'morning': 0.8, 'afternoon': 0.9, 'evening': 0.7, 'night': 0.3},
        'activity_probability': 0.7
    },
    'Fitness': {
        'interests': ['Фитнес', 'Бег', 'Йога', 'Плавание', 'Велосипед', 'Здоровое питание'],
        'love_languages': {'quality_time': 0.6, 'physical_touch': 0.9, 'words_of_affirmation': 0.5, 'acts_of_service': 0.8, 'receiving_gifts': 0.3},
        'budget_preference': 'medium',
        'time_preference': {'morning': 0.9, 'afternoon': 0.7, 'evening': 0.6, 'night': 0.2},
        'activity_probability': 0.8
    },
    'ArtLovers': {
        'interests': ['Живопись', 'Театр', 'Музыка', 'Фотография', 'Дизайн', 'Художественная литература'],
        'love_languages': {'quality_time': 0.8, 'physical_touch': 0.5, 'words_of_affirmation': 0.9, 'acts_of_service': 0.4, 'receiving_gifts': 0.7},
        'budget_preference': 'medium',
        'time_preference': {'evening': 0.8, 'afternoon': 0.6, 'morning': 0.3, 'night': 0.4},
        'activity_probability': 0.7
    }
}

# Список всех интересов (83+)
ALL_INTERESTS = [
    'Итальянская кухня', 'Азиатская кухня', 'Кофе', 'Десерты', 'Барбекю', 'Вегетарианская еда',
    'Уличная еда', 'Крафтовое пиво', 'Вино', 'Мексиканская кухня', 'Французская кухня', 'Японская кухня',
    'Индийская кухня', 'Морепродукты', 'Стрит-фуд', 'Блокбастеры', 'Драмы', 'Комедии', 'Ужасы',
    'Мультфильмы', 'Документальные фильмы', 'Сериалы', 'Арт-хаус', 'Триллеры', 'Романтические фильмы',
    'Фантастика', 'Фэнтези', 'Фитнес', 'Бег', 'Плавание', 'Велосипед', 'Йога', 'Теннис', 'Футбол',
    'Волейбол', 'Скалолазание', 'Бокс', 'Баскетбол', 'Гольф', 'Лыжи', 'Серфинг', 'Пилатес',
    'Городские поездки', 'Пляжный отдых', 'Горы', 'Экстрим-туризм', 'Культурный туризм', 'Кемпинг',
    'Круизы', 'Автопутешествия', 'Бэкпэкинг', 'Спа-отдых', 'Гастрономические туры', 'Фототуры',
    'Рок', 'Поп-музыка', 'Электронная музыка', 'Джаз', 'Классическая музыка', 'Хип-хоп',
    'Инди-музыка', 'Кантри', 'Регги', 'Фолк', 'Живопись', 'Театр', 'Скульптура', 'Дизайн',
    'Архитектура', 'Стрит-арт', 'Фотография', 'Мода', 'Художественная литература', 'Детективы',
    'Фантастика', 'Психология', 'История', 'Биографии', 'Поэзия', 'Философия', 'Видеоигры',
    'Настольные игры', 'Карточные игры', 'Квесты', 'Боулинг', 'Бильярд', 'Дартс', 'Пазлы',
    'Рисование', 'Рукоделие', 'Садоводство', 'Коллекционирование', 'Кулинария', 'Танцы',
    'Музыкальные инструменты', 'Ремонт', 'Программирование', 'Гаджеты', 'Криптовалюты',
    'ИИ и машинное обучение', 'VR/AR', 'Животные', 'Растения', 'Астрономия', 'Геология',
    'Метеорология', 'Волонтерство', 'Образование', 'Политика', 'Религия', 'Социальные сети'
]

# Каталог товаров/мест (2000+)
PRODUCT_CATALOG = [
    # Рестораны (20 позиций)
    {'title': 'Ресторан "Итальянец"', 'category': 'restaurant', 'price': 2500, 'tags': ['Итальянская кухня', 'Романтический'], 'love_language': 'quality_time'},
    {'title': 'Суши-бар "Токио"', 'category': 'restaurant', 'price': 1800, 'tags': ['Японская кухня', 'Свежие продукты'], 'love_language': 'acts_of_service'},
    {'title': 'Ресторан "Фрация"', 'category': 'restaurant', 'price': 3200, 'tags': ['Французская кухня', 'Изысканный'], 'love_language': 'quality_time'},
    {'title': 'Пиццерия "Мама Мия"', 'category': 'restaurant', 'price': 1200, 'tags': ['Пицца', 'Итальянская кухня'], 'love_language': 'quality_time'},
    {'title': 'Ресторан "Азия"', 'category': 'restaurant', 'price': 2100, 'tags': ['Азиатская кухня', 'Аутентичный'], 'love_language': 'quality_time'},
    {'title': 'Стейк-хаус "Мясо"', 'category': 'restaurant', 'price': 2800, 'tags': ['Мясо', 'Гриль'], 'love_language': 'acts_of_service'},
    {'title': 'Ресторан "Грин"', 'category': 'restaurant', 'price': 1600, 'tags': ['Вегетарианский', 'Здоровое питание'], 'love_language': 'acts_of_service'},
    {'title': 'Ресторан "Русь"', 'category': 'restaurant', 'price': 1900, 'tags': ['Русская кухня', 'Традиционный'], 'love_language': 'quality_time'},
    {'title': 'Тайский ресторан "Бангкок"', 'category': 'restaurant', 'price': 2200, 'tags': ['Тайская кухня', 'Острый'], 'love_language': 'quality_time'},
    {'title': 'Ресторан "Море"', 'category': 'restaurant', 'price': 2600, 'tags': ['Морепродукты', 'Свежий'], 'love_language': 'acts_of_service'},
    {'title': 'Грузинский ресторан "Тбилиси"', 'category': 'restaurant', 'price': 2000, 'tags': ['Грузинская кухня', 'Хачапури'], 'love_language': 'quality_time'},
    {'title': 'Мексиканский ресторан "Текила"', 'category': 'restaurant', 'price': 1700, 'tags': ['Мексиканская кухня', 'Острый'], 'love_language': 'quality_time'},
    {'title': 'Немецкий ресторан "Бавария"', 'category': 'restaurant', 'price': 2300, 'tags': ['Немецкая кухня', 'Пиво'], 'love_language': 'quality_time'},
    {'title': 'Индийский ресторан "Бомбей"', 'category': 'restaurant', 'price': 1800, 'tags': ['Индийская кухня', 'Специи'], 'love_language': 'quality_time'},
    {'title': 'Армянский ресторан "Ереван"', 'category': 'restaurant', 'price': 2100, 'tags': ['Армянская кухня', 'Шашлык'], 'love_language': 'quality_time'},
    
    # Кафе (15 позиций)
    {'title': 'Кофейня "Аромат"', 'category': 'cafe', 'price': 500, 'tags': ['Кофе', 'Уютная атмосфера'], 'love_language': 'quality_time'},
    {'title': 'Кафе "Лофт"', 'category': 'cafe', 'price': 700, 'tags': ['Кофе', 'Современный дизайн'], 'love_language': 'quality_time'},
    {'title': 'Кондитерская "Сладость"', 'category': 'cafe', 'price': 600, 'tags': ['Десерты', 'Выпечка'], 'love_language': 'receiving_gifts'},
    {'title': 'Чайная "Восток"', 'category': 'cafe', 'price': 450, 'tags': ['Чай', 'Восточная атмосфера'], 'love_language': 'quality_time'},
    {'title': 'Кафе "Бук"', 'category': 'cafe', 'price': 550, 'tags': ['Кофе', 'Книги'], 'love_language': 'quality_time'},
    {'title': 'Смузи-бар "Фреш"', 'category': 'cafe', 'price': 400, 'tags': ['Смузи', 'Здоровое питание'], 'love_language': 'acts_of_service'},
    {'title': 'Кафе "Ретро"', 'category': 'cafe', 'price': 520, 'tags': ['Винтаж', 'Атмосфера'], 'love_language': 'quality_time'},
    {'title': 'Кофейня "Зерно"', 'category': 'cafe', 'price': 480, 'tags': ['Кофе', 'Качественный'], 'love_language': 'quality_time'},
    {'title': 'Пекарня "Хлеб"', 'category': 'cafe', 'price': 350, 'tags': ['Выпечка', 'Свежий хлеб'], 'love_language': 'acts_of_service'},
    {'title': 'Кафе "Крем"', 'category': 'cafe', 'price': 650, 'tags': ['Десерты', 'Мороженое'], 'love_language': 'receiving_gifts'},
    
    # Развлечения (25 позиций)
    {'title': 'Кинотеатр "Максимум"', 'category': 'entertainment', 'price': 800, 'tags': ['Фильмы', 'Попкорн'], 'love_language': 'quality_time'},
    {'title': 'Квест-комната "Загадка"', 'category': 'entertainment', 'price': 1200, 'tags': ['Квесты', 'Командная работа'], 'love_language': 'quality_time'},
    {'title': 'Боулинг "Страйк"', 'category': 'entertainment', 'price': 1000, 'tags': ['Боулинг', 'Соревнования'], 'love_language': 'quality_time'},
    {'title': 'Караоке "Голос"', 'category': 'entertainment', 'price': 1500, 'tags': ['Караоке', 'Музыка'], 'love_language': 'quality_time'},
    {'title': 'Бильярдный клуб "Кий"', 'category': 'entertainment', 'price': 900, 'tags': ['Бильярд', 'Спокойная игра'], 'love_language': 'quality_time'},
    {'title': 'Аркада "Геймзон"', 'category': 'entertainment', 'price': 700, 'tags': ['Видеоигры', 'Ретро'], 'love_language': 'quality_time'},
    {'title': 'Лазертаг "Космос"', 'category': 'entertainment', 'price': 1100, 'tags': ['Лазертаг', 'Активность'], 'love_language': 'physical_touch'},
    {'title': 'Планетарий', 'category': 'entertainment', 'price': 600, 'tags': ['Наука', 'Звезды'], 'love_language': 'quality_time'},
    {'title': 'Театр "Маска"', 'category': 'entertainment', 'price': 1800, 'tags': ['Театр', 'Культура'], 'love_language': 'quality_time'},
    {'title': 'Цирк "Чудеса"', 'category': 'entertainment', 'price': 1300, 'tags': ['Цирк', 'Шоу'], 'love_language': 'quality_time'},
    {'title': 'Антикафе "Время"', 'category': 'entertainment', 'price': 300, 'tags': ['Общение', 'Игры'], 'love_language': 'quality_time'},
    {'title': 'Кинотеатр IMAX', 'category': 'entertainment', 'price': 1200, 'tags': ['Фильмы', 'Технологии'], 'love_language': 'quality_time'},
    {'title': 'Комеди клаб', 'category': 'entertainment', 'price': 1000, 'tags': ['Стендап', 'Юмор'], 'love_language': 'quality_time'},
    {'title': 'Танцевальный клуб', 'category': 'entertainment', 'price': 800, 'tags': ['Танцы', 'Музыка'], 'love_language': 'physical_touch'},
    {'title': 'VR клуб', 'category': 'entertainment', 'price': 1400, 'tags': ['VR/AR', 'Технологии'], 'love_language': 'quality_time'},
    
    # Подарки (20 позиций)
    {'title': 'Букет роз', 'category': 'gift', 'price': 1500, 'tags': ['Цветы', 'Романтика'], 'love_language': 'receiving_gifts'},
    {'title': 'Персонализированная книга', 'category': 'gift', 'price': 2000, 'tags': ['Книги', 'Персональный'], 'love_language': 'receiving_gifts'},
    {'title': 'Сертификат на массаж', 'category': 'gift', 'price': 3000, 'tags': ['Спа', 'Релакс'], 'love_language': 'acts_of_service'},
    {'title': 'Ювелирное украшение', 'category': 'gift', 'price': 5000, 'tags': ['Украшения', 'Драгоценности'], 'love_language': 'receiving_gifts'},
    {'title': 'Духи премиум', 'category': 'gift', 'price': 3500, 'tags': ['Парфюм', 'Роскошь'], 'love_language': 'receiving_gifts'},
    {'title': 'Фотосессия', 'category': 'gift', 'price': 4000, 'tags': ['Фотография', 'Память'], 'love_language': 'quality_time'},
    {'title': 'Коробка шоколада', 'category': 'gift', 'price': 800, 'tags': ['Сладости', 'Шоколад'], 'love_language': 'receiving_gifts'},
    {'title': 'Мягкая игрушка', 'category': 'gift', 'price': 1200, 'tags': ['Игрушки', 'Милый'], 'love_language': 'receiving_gifts'},
    {'title': 'Сертификат в спа', 'category': 'gift', 'price': 2500, 'tags': ['Спа', 'Уход'], 'love_language': 'acts_of_service'},
    {'title': 'Кошелек кожаный', 'category': 'gift', 'price': 2200, 'tags': ['Кожа', 'Практичный'], 'love_language': 'receiving_gifts'},
    {'title': 'Часы наручные', 'category': 'gift', 'price': 4500, 'tags': ['Часы', 'Стиль'], 'love_language': 'receiving_gifts'},
    {'title': 'Сертификат в салон красоты', 'category': 'gift', 'price': 3000, 'tags': ['Красота', 'Уход'], 'love_language': 'acts_of_service'},
    {'title': 'Набор косметики', 'category': 'gift', 'price': 2800, 'tags': ['Косметика', 'Уход'], 'love_language': 'receiving_gifts'},
    {'title': 'Плед кашемировый', 'category': 'gift', 'price': 3200, 'tags': ['Уют', 'Качество'], 'love_language': 'physical_touch'},
    {'title': 'Корзина с фруктами', 'category': 'gift', 'price': 1800, 'tags': ['Фрукты', 'Здоровье'], 'love_language': 'acts_of_service'},
    
    # Активности (25 позиций)
    {'title': 'Мастер-класс по живописи', 'category': 'activity', 'price': 1800, 'tags': ['Творчество', 'Обучение'], 'love_language': 'quality_time'},
    {'title': 'Парк развлечений', 'category': 'activity', 'price': 2200, 'tags': ['Аттракционы', 'Адреналин'], 'love_language': 'quality_time'},
    {'title': 'Спортивный зал', 'category': 'activity', 'price': 1500, 'tags': ['Фитнес', 'Здоровье'], 'love_language': 'acts_of_service'},
    {'title': 'Йога-студия', 'category': 'activity', 'price': 1200, 'tags': ['Йога', 'Медитация'], 'love_language': 'quality_time'},
    {'title': 'Бассейн', 'category': 'activity', 'price': 800, 'tags': ['Плавание', 'Спорт'], 'love_language': 'physical_touch'},
    {'title': 'Скалодром', 'category': 'activity', 'price': 1100, 'tags': ['Скалолазание', 'Экстрим'], 'love_language': 'physical_touch'},
    {'title': 'Парк "Сокольники"', 'category': 'activity', 'price': 0, 'tags': ['Природа', 'Прогулки'], 'love_language': 'quality_time'},
    {'title': 'Ботанический сад', 'category': 'activity', 'price': 300, 'tags': ['Растения', 'Природа'], 'love_language': 'quality_time'},
    {'title': 'Зоопарк', 'category': 'activity', 'price': 700, 'tags': ['Животные', 'Семейный'], 'love_language': 'quality_time'},
    {'title': 'Музей искусств', 'category': 'activity', 'price': 600, 'tags': ['Искусство', 'Культура'], 'love_language': 'quality_time'},
    {'title': 'Мастер-класс по готовке', 'category': 'activity', 'price': 2000, 'tags': ['Кулинария', 'Обучение'], 'love_language': 'acts_of_service'},
    {'title': 'Винная дегустация', 'category': 'activity', 'price': 2500, 'tags': ['Вино', 'Дегустация'], 'love_language': 'acts_of_service'},
    {'title': 'Экскурсия по городу', 'category': 'activity', 'price': 1000, 'tags': ['Экскурсии', 'История'], 'love_language': 'quality_time'},
    {'title': 'Конная прогулка', 'category': 'activity', 'price': 2800, 'tags': ['Лошади', 'Природа'], 'love_language': 'quality_time'},
    {'title': 'Мастер-класс по танцам', 'category': 'activity', 'price': 1500, 'tags': ['Танцы', 'Обучение'], 'love_language': 'physical_touch'},
    {'title': 'Фотопрогулка', 'category': 'activity', 'price': 1200, 'tags': ['Фотография', 'Прогулки'], 'love_language': 'quality_time'},
    {'title': 'Роуп-джампинг', 'category': 'activity', 'price': 3000, 'tags': ['Экстрим', 'Адреналин'], 'love_language': 'physical_touch'},
    {'title': 'Мастер-класс гончарного дела', 'category': 'activity', 'price': 1600, 'tags': ['Творчество', 'Керамика'], 'love_language': 'quality_time'},
    {'title': 'Поход в баню', 'category': 'activity', 'price': 2000, 'tags': ['Баня', 'Релакс'], 'love_language': 'physical_touch'},
    {'title': 'Картинг', 'category': 'activity', 'price': 1800, 'tags': ['Гонки', 'Адреналин'], 'love_language': 'quality_time'},
]

# Города для генерации
CITIES = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара']

def generate_user(archetype: str, user_id: str = None) -> Dict:
    """Генерирует виртуального пользователя с заданным архетипом"""
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    archetype_data = ARCHETYPES[archetype]
    
    # Базовые данные
    age = random.randint(20, 45)
    gender = random.choice(['male', 'female'])
    city = random.choice(CITIES)
    
    # Интересы на основе архетипа + случайные
    archetype_interests = archetype_data['interests']
    additional_interests = random.sample(
        [i for i in ALL_INTERESTS if i not in archetype_interests], 
        random.randint(5, 10)
    )
    all_user_interests = archetype_interests + additional_interests
    
    # Интенсивности интересов с реалистичным шумом
    interests_with_intensity = {}
    for interest in all_user_interests:
        if interest in archetype_interests:
            # Основные интересы архетипа - высокая интенсивность
            base_intensity = random.uniform(7, 10)
        else:
            # Дополнительные интересы - средняя интенсивность
            base_intensity = random.uniform(4, 7)
        
        # Добавляем шум
        intensity = max(1, min(10, base_intensity + random.uniform(-1, 1)))
        interests_with_intensity[interest] = round(intensity, 1)
    
    # Языки любви с шумом
    love_languages = {}
    for lang, base_value in archetype_data['love_languages'].items():
        noise = random.uniform(-0.2, 0.2)
        love_languages[lang] = max(0, min(1, base_value + noise))
    
    # Нормализация языков любви
    total = sum(love_languages.values())
    love_languages = {k: v/total for k, v in love_languages.items()}
    
    return {
        'id': user_id,
        'age': age,
        'gender': gender,
        'city': city,
        'archetype': archetype,
        'interests': interests_with_intensity,
        'love_languages': love_languages,
        'budget_preference': archetype_data['budget_preference'],
        'time_preferences': archetype_data['time_preference'],
        'activity_probability': archetype_data['activity_probability']
    }

def generate_pair() -> Tuple[Dict, Dict, Dict]:
    """Генерирует пару пользователей с совместимостью"""
    # Выбираем архетипы (могут быть одинаковые или разные)
    if random.random() < 0.6:  # 60% шанс на одинаковые архетипы
        archetype1 = archetype2 = random.choice(list(ARCHETYPES.keys()))
    else:
        archetype1, archetype2 = random.sample(list(ARCHETYPES.keys()), 2)
    
    user1 = generate_user(archetype1)
    user2 = generate_user(archetype2)
    
    # Создаем пару
    pair_id = str(uuid.uuid4())
    pair = {
        'id': pair_id,
        'user1_id': user1['id'],
        'user2_id': user2['id'],
        'created_at': datetime.now() - timedelta(days=random.randint(30, 365)),
        'status': 'active',
        'harmony_index': calculate_harmony_index(user1, user2)
    }
    
    return user1, user2, pair

def calculate_harmony_index(user1: Dict, user2: Dict) -> int:
    """Вычисляет индекс гармонии пары (0-100)"""
    score = 0
    
    # Совпадение интересов
    common_interests = set(user1['interests'].keys()) & set(user2['interests'].keys())
    if common_interests:
        interest_score = len(common_interests) / max(len(user1['interests']), len(user2['interests']))
        score += interest_score * 40
    
    # Совместимость языков любви
    love_lang_score = 0
    for lang in user1['love_languages']:
        if lang in user2['love_languages']:
            love_lang_score += min(user1['love_languages'][lang], user2['love_languages'][lang])
    score += love_lang_score * 30
    
    # Совпадение бюджета
    if user1['budget_preference'] == user2['budget_preference']:
        score += 20
    
    # Совпадение города
    if user1['city'] == user2['city']:
        score += 10
    
    return min(100, int(score))

def calculate_realistic_rating(user: Dict, product: Dict) -> float:
    """
    Вычисляет реалистичный рейтинг на основе множественных факторов + шум
    
    Args:
        user: Профиль пользователя
        product: Информация о товаре/месте
    
    Returns:
        Рейтинг от 1 до 10 (float)
    """
    score = 5.0  # Базовый средний рейтинг
    
    # 1. Совпадение интересов (НЕ детерминированное!)
    user_interests = user['interests'] if isinstance(user['interests'], dict) else {}
    product_tags = eval(product['tags']) if isinstance(product['tags'], str) else product.get('tags', [])
    
    # Проверяем пересечение интересов и тегов
    common_elements = 0
    interest_match_strength = 0
    
    for tag in product_tags:
        for interest, strength in user_interests.items():
            if tag.lower() in interest.lower() or interest.lower() in tag.lower():
                common_elements += 1
                interest_match_strength += strength / 10.0  # Нормализуем
    
    # Добавляем баллы за совпадения (но не детерминированно!)
    if common_elements > 0:
        score += interest_match_strength * random.uniform(0.8, 1.2)  # ±20% вариация
    
    # 2. Соответствие языку любви
    user_love_langs = eval(user['love_languages']) if isinstance(user['love_languages'], str) else user.get('love_languages', {})
    if product['love_language'] in user_love_langs:
        love_lang_strength = user_love_langs[product['love_language']]
        score += love_lang_strength * random.uniform(1.5, 2.5)  # До +2.5 баллов
    
    # 3. Соответствие бюджету (важный реалистичный фактор!)
    user_budget = user.get('budget_preference', 'medium')
    product_price = product.get('price', 1000)
    
    budget_ranges = {'low': (0, 1000), 'medium': (800, 2500), 'high': (2000, 5000)}
    budget_min, budget_max = budget_ranges.get(user_budget, (800, 2500))
    
    if budget_min <= product_price <= budget_max:
        score += random.uniform(0.5, 1.5)  # Подходящая цена
    elif product_price > budget_max:
        score -= random.uniform(1.0, 3.0)  # Слишком дорого - штраф
    else:
        score += random.uniform(0.2, 0.8)  # Дешево - небольшой плюс
    
    # 4. Фактор архетипа (более мягкое влияние)
    user_archetype = user.get('archetype', 'Unknown')
    archetype_bonus = {
        'ArtLovers': ['Театр', 'Живопись', 'Музыка', 'Художественная'],
        'Gamers': ['Квесты', 'Видеоигры', 'Развлечения'],
        'Gourmets': ['Ресторан', 'Кухня', 'Кофе', 'Еда'],
        'Fitness': ['Спорт', 'Активность', 'Здоровье'],
        'Travelers': ['Путешествия', 'Туризм', 'Экскурсии']
    }
    
    archetype_tags = archetype_bonus.get(user_archetype, [])
    for tag in product_tags:
        if any(arch_tag.lower() in tag.lower() for arch_tag in archetype_tags):
            score += random.uniform(0.3, 1.0)
            break
    
    # 5. Фактор "настроения" (увеличенный случайный шум)
    mood_factor = random.uniform(-2.5, 2.5)  # Увеличили с ±1.8
    score += mood_factor
    
    # 6. Фактор "неожиданного открытия" (Serendipity effect!)
    if random.random() < 0.12:  # Увеличили с 8% до 12%
        # Пользователю может неожиданно понравиться что-то вне профиля
        serendipity_bonus = random.uniform(2.5, 5.0)  # Усилили эффект
        score += serendipity_bonus
    
    # 7. Фактор "плохого дня" (больше негативных сюрпризов)
    if random.random() < 0.10:  # Увеличили с 5% до 10%
        # Даже идеальное место может разочаровать
        bad_day_penalty = random.uniform(2.5, 5.0)  # Усилили penalty
        score -= bad_day_penalty
    
    # 8. Временной фактор (новизна vs проверенность)
    # Новые места могут быть как открытием, так и разочарованием
    newness_factor = random.uniform(-0.5, 1.0)
    score += newness_factor
    
    # Ограничиваем рейтинг в разумных пределах
    final_rating = max(1.0, min(10.0, score))
    
    return final_rating


def generate_interactions(pair: Dict, user1: Dict, user2: Dict, num_interactions: int = None) -> List[Dict]:
    """Генерирует историю взаимодействий пары"""
    if num_interactions is None:
        num_interactions = random.randint(30, 200)
    
    interactions = []
    start_date = pair['created_at']
    
    for i in range(num_interactions):
        # Случайная дата в пределах существования пары
        days_offset = random.randint(0, (datetime.now() - start_date).days)
        interaction_date = start_date + timedelta(days=days_offset)
        
        # Выбираем случайный продукт/место
        product = random.choice(PRODUCT_CATALOG)
        
        # Определяем пользователя (случайно)
        user = random.choice([user1, user2])
        
        # Генерируем тип взаимодействия
        interaction_type = random.choices(
            ['visit', 'rating', 'purchase', 'recommendation_shown', 'recommendation_clicked'],
            weights=[0.4, 0.3, 0.1, 0.15, 0.05]
        )[0]
        
        # Генерируем РЕАЛИСТИЧНЫЙ рейтинг (многофакторный + шум)
        base_rating = 5
        if interaction_type == 'rating':
            base_rating = calculate_realistic_rating(user, product)
            
            # Добавляем шум
            base_rating += random.uniform(-1, 1)
            base_rating = max(1, min(10, base_rating))
        
        interaction = {
            'id': str(uuid.uuid4()),
            'pair_id': pair['id'],
            'user_id': user['id'],
            'action': interaction_type,
            'product_id': product['title'],
            'product_category': product['category'],
            'rating': round(base_rating, 1) if interaction_type == 'rating' else None,
            'price': product['price'],
            'created_at': interaction_date,
            'metadata': {
                'archetype': user['archetype'],
                'love_language': product['love_language'],
                'budget_match': user['budget_preference'] == product['category']
            }
        }
        
        interactions.append(interaction)
    
    return interactions

def generate_synthetic_dataset(num_pairs: int = 2000) -> Dict:
    """Генерирует полный синтетический датасет"""
    print(f"🎯 Генерируем {num_pairs} виртуальных пар...")
    
    users = []
    pairs = []
    interactions = []
    
    for i in range(num_pairs):
        if (i + 1) % 100 == 0:
            print(f"📊 Обработано {i + 1}/{num_pairs} пар")
        
        user1, user2, pair = generate_pair()
        users.extend([user1, user2])
        pairs.append(pair)
        
        # Генерируем взаимодействия
        pair_interactions = generate_interactions(pair, user1, user2)
        interactions.extend(pair_interactions)
    
    # Создаем каталог продуктов
    product_catalog = []
    for i, product in enumerate(PRODUCT_CATALOG):
        # Генерируем координаты в пределах Москвы
        moscow_lat = 55.7558
        moscow_lon = 37.6176
        # Случайные координаты в радиусе ~20 км от центра Москвы
        lat_offset = random.uniform(-0.2, 0.2)  # ~20 км
        lon_offset = random.uniform(-0.3, 0.3)  # ~20 км
        
        product_catalog.append({
            'id': str(uuid.uuid4()),
            'title': product['title'],
            'category': product['category'],
            'price': product['price'],
            'tags': product['tags'],
            'love_language': product['love_language'],
            'latitude': round(moscow_lat + lat_offset, 6),
            'longitude': round(moscow_lon + lon_offset, 6),
            'created_at': datetime.now() - timedelta(days=random.randint(1, 365))
        })
    
    dataset = {
        'users': users,
        'pairs': pairs,
        'interactions': interactions,
        'product_catalog': product_catalog,
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'num_pairs': num_pairs,
            'num_users': len(users),
            'num_interactions': len(interactions),
            'num_products': len(product_catalog),
            'archetypes': list(ARCHETYPES.keys())
        }
    }
    
    return dataset

def save_dataset(dataset: Dict, output_dir: str = 'data/synthetic_v1'):
    """Сохраняет датасет в файлы"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Сохраняем в JSON
    with open(f'{output_dir}/dataset.json', 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2, default=str)
    
    # Сохраняем в CSV для анализа
    pd.DataFrame(dataset['users']).to_csv(f'{output_dir}/users.csv', index=False)
    pd.DataFrame(dataset['pairs']).to_csv(f'{output_dir}/pairs.csv', index=False)
    pd.DataFrame(dataset['interactions']).to_csv(f'{output_dir}/interactions.csv', index=False)
    pd.DataFrame(dataset['product_catalog']).to_csv(f'{output_dir}/product_catalog.csv', index=False)
    
    # Сохраняем метаданные
    with open(f'{output_dir}/metadata.json', 'w', encoding='utf-8') as f:
        json.dump(dataset['metadata'], f, ensure_ascii=False, indent=2)
    
    print(f"✅ Датасет сохранен в {output_dir}")
    print(f"📊 Статистика:")
    print(f"  - Пользователей: {dataset['metadata']['num_users']}")
    print(f"  - Пар: {dataset['metadata']['num_pairs']}")
    print(f"  - Взаимодействий: {dataset['metadata']['num_interactions']}")
    print(f"  - Товаров: {dataset['metadata']['num_products']}")

def main():
    """Основная функция генерации"""
    print("🚀 Запуск генератора синтетических данных LoveMemory AI")
    
    # Генерируем датасет
    dataset = generate_synthetic_dataset(2000)
    
    # Сохраняем
    save_dataset(dataset)
    
    print("🎉 Генерация завершена!")

if __name__ == "__main__":
    main()
