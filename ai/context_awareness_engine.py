"""
🌡️ Context Awareness Engine для LoveMemory AI
Фаза 2.2: Контекстуальная Осведомленность

Система понимает МОМЕНТ и адаптирует рекомендации:
- Время дня, день недели, сезон
- Погода (через API) 
- Местные события и праздники
- Бюджетное настроение пользователя
- Детектор настроения по поведению

Цель: Отвечать на вопрос "Что порекомендовать этой паре именно СЕЙЧАС?"
"""

import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
import random
import calendar
import numpy as np
from dataclasses import dataclass, asdict
from enum import Enum

@dataclass
class WeatherContext:
    """Контекст погоды"""
    temperature: float  # Температура в Цельсиях
    condition: str  # Состояние: sunny, rainy, cloudy, snowy
    humidity: float  # Влажность (0-1)
    wind_speed: float  # Скорость ветра км/ч
    feels_like: float  # Ощущается как
    is_good_weather: bool  # Хорошая ли погода для прогулок
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class TemporalContext:
    """Временной контекст"""
    hour: int  # Час дня (0-23)
    day_of_week: int  # День недели (0-6)
    day_of_month: int  # День месяца
    month: int  # Месяц (1-12)
    season: str  # Сезон: spring, summer, autumn, winter
    is_weekend: bool
    is_holiday: bool
    time_of_day: str  # morning, afternoon, evening, night
    is_prime_time: bool  # Пиковое время для активностей
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class UserMoodContext:
    """Контекст настроения пользователя"""
    mood_type: str  # adventurous, comfortable, social, romantic, budget_conscious
    confidence: float  # Уверенность в определении настроения (0-1)
    mood_factors: List[str]  # Факторы, повлиявшие на определение
    budget_signal: str  # luxury, normal, budget
    activity_energy: str  # high, medium, low
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class LocalEventsContext:
    """Контекст местных событий"""
    nearby_events: List[Dict]  # Ближайшие события
    traffic_level: str  # low, medium, high
    popular_areas: List[str]  # Популярные районы сегодня
    special_offers: List[Dict]  # Специальные предложения
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class CompleteContext:
    """Полный контекст момента"""
    weather: WeatherContext
    temporal: TemporalContext
    user_mood: UserMoodContext
    local_events: LocalEventsContext
    context_score: float  # Общая оценка благоприятности момента (0-1)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'weather': self.weather.to_dict(),
            'temporal': self.temporal.to_dict(),
            'user_mood': self.user_mood.to_dict(),
            'local_events': self.local_events.to_dict(),
            'context_score': self.context_score
        }

class ContextAwarenessEngine:
    """
    Движок контекстуальной осведомленности
    
    Анализирует текущий момент и адаптирует рекомендации под ситуацию.
    Делает AI рекомендации живыми и актуальными.
    """
    
    def __init__(self, weather_api_key: Optional[str] = None):
        """
        Инициализация движка контекстуальной осведомленности
        
        Args:
            weather_api_key: API ключ для сервиса погоды (OpenWeatherMap)
        """
        self.weather_api_key = weather_api_key or os.getenv('OPENWEATHER_API_KEY')
        
        # Кэш для API запросов
        self.weather_cache = {}
        self.events_cache = {}
        self.cache_ttl = 3600  # 1 час
        
        # Московские праздники и события (симуляция)
        self.moscow_holidays = self._load_moscow_holidays()
        
        # Паттерны активности по времени
        self.time_activity_patterns = {
            'morning': {
                'suitable_categories': ['cafe', 'activity', 'fitness'],
                'energy_level': 'medium',
                'social_factor': 0.6,
                'boost_keywords': ['завтрак', 'кофе', 'утренний', 'свежий', 'энергия']
            },
            'afternoon': {
                'suitable_categories': ['restaurant', 'museum', 'shopping', 'entertainment'],
                'energy_level': 'high', 
                'social_factor': 0.8,
                'boost_keywords': ['обед', 'прогулка', 'культура', 'активность']
            },
            'evening': {
                'suitable_categories': ['restaurant', 'theater', 'entertainment', 'bar'],
                'energy_level': 'high',
                'social_factor': 0.9,
                'boost_keywords': ['ужин', 'романтика', 'развлечения', 'вечерний']
            },
            'night': {
                'suitable_categories': ['bar', 'club', 'late_cafe'],
                'energy_level': 'medium',
                'social_factor': 0.7,
                'boost_keywords': ['поздний', 'ночной', 'бар', 'клуб']
            }
        }
        
        # Погодные паттерны
        self.weather_activity_patterns = {
            'sunny': {
                'boost_categories': ['activity', 'outdoor', 'park'],
                'boost_keywords': ['терраса', 'открытый', 'прогулка', 'парк', 'природа'],
                'penalty_keywords': ['домашний', 'закрытый']
            },
            'rainy': {
                'boost_categories': ['restaurant', 'cafe', 'entertainment', 'museum'],
                'boost_keywords': ['уютный', 'крытый', 'теплый', 'домашний', 'комфорт'],
                'penalty_keywords': ['открытый', 'терраса', 'парк']
            },
            'snowy': {
                'boost_categories': ['cafe', 'restaurant', 'entertainment'],
                'boost_keywords': ['горячий', 'теплый', 'уютный', 'зимний'],
                'penalty_keywords': ['прохладный', 'открытый']
            },
            'cloudy': {
                'boost_categories': ['museum', 'cafe', 'entertainment'],
                'boost_keywords': ['крытый', 'культура', 'спокойный'],
                'neutral_penalty': 0.1
            }
        }
        
        print("🌡️ Context Awareness Engine инициализирован")
    
    def _load_moscow_holidays(self) -> Dict[str, List[str]]:
        """Загружает календарь московских праздников и событий"""
        return {
            '01': ['Новый год', 'Рождество', 'Каникулы'],
            '02': ['День защитника Отечества', 'Масленица'],
            '03': ['8 марта', 'Весенние каникулы'],
            '04': ['Пасха', 'День космонавтики'],
            '05': ['1 мая', '9 мая', 'Майские праздники'],
            '06': ['День России', 'Белые ночи'],
            '07': ['Лето', 'Фестивали'],
            '08': ['Лето', 'Отпускной сезон'],
            '09': ['День знаний', 'Начало учебного года'],
            '10': ['Осень', 'Культурная программа'],
            '11': ['День народного единства'],
            '12': ['Новый год приближается', 'Предновогодние покупки']
        }
    
    def get_weather_context(self, lat: float = 55.7558, lon: float = 37.6176) -> WeatherContext:
        """
        Получает контекст погоды
        
        Args:
            lat, lon: Координаты (по умолчанию Москва)
            
        Returns:
            WeatherContext с информацией о погоде
        """
        cache_key = f"weather_{lat}_{lon}"
        now = datetime.now()
        
        # Проверяем кэш
        if cache_key in self.weather_cache:
            cached_data, timestamp = self.weather_cache[cache_key]
            if (now - timestamp).seconds < self.cache_ttl:
                return cached_data
        
        if self.weather_api_key:
            try:
                # Реальный API запрос к OpenWeatherMap
                url = f"http://api.openweathermap.org/data/2.5/weather"
                params = {
                    'lat': lat,
                    'lon': lon,
                    'appid': self.weather_api_key,
                    'units': 'metric',
                    'lang': 'ru'
                }
                
                response = requests.get(url, params=params, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    
                    weather_context = WeatherContext(
                        temperature=data['main']['temp'],
                        condition=self._normalize_weather_condition(data['weather'][0]['main']),
                        humidity=data['main']['humidity'] / 100.0,
                        wind_speed=data.get('wind', {}).get('speed', 0) * 3.6,  # м/с в км/ч
                        feels_like=data['main']['feels_like'],
                        is_good_weather=self._is_good_weather(data)
                    )
                    
                    # Кэшируем результат
                    self.weather_cache[cache_key] = (weather_context, now)
                    return weather_context
                    
            except Exception as e:
                print(f"⚠️ Ошибка получения погоды от API: {e}")
        
        # Фолбэк: симуляция погоды
        return self._simulate_weather_context()
    
    def _normalize_weather_condition(self, condition: str) -> str:
        """Нормализует условия погоды к стандартным категориям"""
        condition_mapping = {
            'Clear': 'sunny',
            'Clouds': 'cloudy',
            'Rain': 'rainy',
            'Drizzle': 'rainy',
            'Thunderstorm': 'rainy',
            'Snow': 'snowy',
            'Mist': 'cloudy',
            'Fog': 'cloudy'
        }
        return condition_mapping.get(condition, 'cloudy')
    
    def _is_good_weather(self, weather_data: Dict) -> bool:
        """Определяет, хорошая ли погода для прогулок"""
        temp = weather_data['main']['temp']
        condition = weather_data['weather'][0]['main']
        
        # Комфортная температура и хорошие условия
        temp_ok = -5 <= temp <= 30
        condition_ok = condition in ['Clear', 'Clouds']
        
        return temp_ok and condition_ok
    
    def _simulate_weather_context(self) -> WeatherContext:
        """Симулирует контекст погоды (фолбэк)"""
        # Простая симуляция на основе сезона
        month = datetime.now().month
        
        if month in [12, 1, 2]:  # Зима
            temp = random.uniform(-15, 5)
            conditions = ['snowy', 'cloudy', 'cloudy', 'sunny']
        elif month in [3, 4, 5]:  # Весна
            temp = random.uniform(5, 20)
            conditions = ['rainy', 'cloudy', 'sunny', 'sunny']
        elif month in [6, 7, 8]:  # Лето
            temp = random.uniform(15, 30)
            conditions = ['sunny', 'sunny', 'cloudy', 'rainy']
        else:  # Осень
            temp = random.uniform(0, 15)
            conditions = ['rainy', 'cloudy', 'cloudy', 'sunny']
        
        condition = random.choice(conditions)
        
        return WeatherContext(
            temperature=round(temp, 1),
            condition=condition,
            humidity=random.uniform(0.4, 0.8),
            wind_speed=random.uniform(0, 15),
            feels_like=temp + random.uniform(-3, 3),
            is_good_weather=(condition == 'sunny' and 5 <= temp <= 25)
        )
    
    def get_temporal_context(self, target_datetime: Optional[datetime] = None) -> TemporalContext:
        """
        Получает временной контекст
        
        Args:
            target_datetime: Целевое время (по умолчанию текущее)
            
        Returns:
            TemporalContext с временной информацией
        """
        dt = target_datetime or datetime.now()
        
        # Определяем сезон
        month = dt.month
        if month in [12, 1, 2]:
            season = 'winter'
        elif month in [3, 4, 5]:
            season = 'spring'
        elif month in [6, 7, 8]:
            season = 'summer'
        else:
            season = 'autumn'
        
        # Определяем время дня
        hour = dt.hour
        if 6 <= hour < 12:
            time_of_day = 'morning'
        elif 12 <= hour < 17:
            time_of_day = 'afternoon'
        elif 17 <= hour < 22:
            time_of_day = 'evening'
        else:
            time_of_day = 'night'
        
        # Определяем праздники
        month_str = f"{month:02d}"
        is_holiday = any(holiday in self.moscow_holidays.get(month_str, []) 
                        for holiday in self.moscow_holidays.get(month_str, []))
        
        # Пиковое время для активностей
        is_prime_time = (
            (dt.weekday() < 5 and 18 <= hour <= 21) or  # Будние вечера
            (dt.weekday() >= 5 and 12 <= hour <= 22)    # Выходные дни
        )
        
        return TemporalContext(
            hour=hour,
            day_of_week=dt.weekday(),
            day_of_month=dt.day,
            month=month,
            season=season,
            is_weekend=dt.weekday() >= 5,
            is_holiday=is_holiday,
            time_of_day=time_of_day,
            is_prime_time=is_prime_time
        )
    
    def detect_user_mood(self, recent_activity: List[Dict], 
                        session_data: Optional[Dict] = None) -> UserMoodContext:
        """
        Детектор настроения пользователя на основе поведения
        
        Args:
            recent_activity: Недавняя активность пользователя
            session_data: Данные текущей сессии
            
        Returns:
            UserMoodContext с определенным настроением
        """
        mood_factors = []
        mood_scores = {
            'adventurous': 0.2,
            'comfortable': 0.3,
            'social': 0.2,
            'romantic': 0.2,
            'budget_conscious': 0.1
        }
        
        # Анализируем недавнюю активность
        if recent_activity:
            for activity in recent_activity[-5:]:  # Последние 5 действий
                
                # Поиск дорогих мест → budget_conscious
                if 'price' in activity and activity['price'] > 3000:
                    if activity.get('action') == 'viewed':
                        mood_scores['budget_conscious'] -= 0.1
                        mood_factors.append('viewing_expensive_items')
                
                # Просмотр много мест → adventurous
                if activity.get('action') == 'recommendation_shown':
                    mood_scores['adventurous'] += 0.05
                
                # Быстрые клики → не нравится предложенное
                if activity.get('action') == 'recommendation_clicked':
                    mood_scores['comfortable'] += 0.1
                    
                # Категории активностей
                category = activity.get('product_category', '')
                if category in ['restaurant', 'romantic']:
                    mood_scores['romantic'] += 0.1
                elif category in ['entertainment', 'activity']:
                    mood_scores['social'] += 0.1
                elif category in ['cafe', 'home']:
                    mood_scores['comfortable'] += 0.1
        
        # Анализируем данные сессии
        if session_data:
            # Время сессии
            session_duration = session_data.get('duration_minutes', 5)
            if session_duration > 15:  # Долгая сессия
                mood_scores['adventurous'] += 0.1
                mood_factors.append('long_session')
            
            # Количество просмотренных мест
            items_viewed = session_data.get('items_viewed', 0)
            if items_viewed > 10:
                mood_scores['adventurous'] += 0.15
                mood_factors.append('many_items_viewed')
            elif items_viewed < 3:
                mood_scores['comfortable'] += 0.1
                mood_factors.append('few_items_viewed')
            
            # Бюджетные фильтры
            budget_filters = session_data.get('budget_filters_used', False)
            if budget_filters:
                mood_scores['budget_conscious'] += 0.2
                mood_factors.append('budget_filters_used')
            
            # Поиск по категориям
            categories_searched = session_data.get('categories_searched', [])
            if 'luxury' in categories_searched:
                mood_scores['budget_conscious'] -= 0.1
            if 'adventure' in categories_searched:
                mood_scores['adventurous'] += 0.2
        
        # Определяем бюджетное настроение
        budget_signal = 'normal'
        if mood_scores['budget_conscious'] > 0.3:
            budget_signal = 'budget'
        elif mood_scores['budget_conscious'] < 0.1:
            budget_signal = 'luxury'
        
        # Определяем уровень энергии
        activity_energy = 'medium'
        adventure_social_score = mood_scores['adventurous'] + mood_scores['social']
        if adventure_social_score > 0.5:
            activity_energy = 'high'
        elif adventure_social_score < 0.2:
            activity_energy = 'low'
        
        # Выбираем доминирующее настроение
        dominant_mood = max(mood_scores.items(), key=lambda x: x[1])[0]
        confidence = mood_scores[dominant_mood]
        
        # Добавляем случайность для реализма
        if random.random() < 0.1:  # 10% шанс на случайное настроение
            dominant_mood = random.choice(list(mood_scores.keys()))
            confidence *= 0.6
            mood_factors.append('random_variation')
        
        return UserMoodContext(
            mood_type=dominant_mood,
            confidence=min(1.0, confidence),
            mood_factors=mood_factors,
            budget_signal=budget_signal,
            activity_energy=activity_energy
        )
    
    def get_local_events_context(self, lat: float = 55.7558, lon: float = 37.6176) -> LocalEventsContext:
        """
        Получает контекст местных событий
        
        Args:
            lat, lon: Координаты
            
        Returns:
            LocalEventsContext с информацией о событиях
        """
        # Симуляция местных событий (в реальности - API к событийным сервисам)
        current_time = datetime.now()
        
        # Генерируем случайные события
        event_types = [
            'Концерт', 'Выставка', 'Фестиваль', 'Спортивное событие',
            'Театральная премьера', 'Кулинарный фестиваль', 'Ярмарка'
        ]
        
        nearby_events = []
        for i in range(random.randint(2, 5)):
            event = {
                'title': f"{random.choice(event_types)} в центре города",
                'distance_km': random.uniform(1, 10),
                'start_time': (current_time + timedelta(hours=random.randint(1, 48))).isoformat(),
                'category': random.choice(['culture', 'entertainment', 'food', 'sports']),
                'impact_on_traffic': random.choice(['low', 'medium', 'high'])
            }
            nearby_events.append(event)
        
        # Определяем уровень трафика
        hour = current_time.hour
        is_weekend = current_time.weekday() >= 5
        
        if is_weekend:
            if 12 <= hour <= 20:
                traffic_level = 'high'
            else:
                traffic_level = 'medium'
        else:
            if hour in [8, 9, 18, 19, 20]:
                traffic_level = 'high'
            elif 10 <= hour <= 17:
                traffic_level = 'medium'
            else:
                traffic_level = 'low'
        
        # Популярные районы
        popular_areas = ['Центр', 'Арбат', 'Сокольники', 'Парк Горького']
        if is_weekend:
            popular_areas.extend(['ВДНХ', 'Красная площадь'])
        
        # Спецпредложения (симуляция)
        special_offers = [
            {
                'type': 'discount',
                'description': 'Скидка 20% на рестораны',
                'category': 'restaurant',
                'valid_until': (current_time + timedelta(hours=12)).isoformat()
            },
            {
                'type': 'happy_hour',
                'description': 'Happy hour в барах 17:00-19:00',
                'category': 'bar',
                'valid_until': (current_time + timedelta(hours=4)).isoformat()
            }
        ]
        
        return LocalEventsContext(
            nearby_events=nearby_events,
            traffic_level=traffic_level,
            popular_areas=popular_areas,
            special_offers=special_offers
        )
    
    def get_complete_context(self, lat: float = 55.7558, lon: float = 37.6176,
                           recent_activity: List[Dict] = None,
                           session_data: Dict = None,
                           target_datetime: datetime = None) -> CompleteContext:
        """
        Получает полный контекст текущего момента
        
        Args:
            lat, lon: Координаты
            recent_activity: Недавняя активность пользователя
            session_data: Данные сессии
            target_datetime: Целевое время
            
        Returns:
            CompleteContext со всей контекстуальной информацией
        """
        print("🌡️ Собираем полный контекст момента...")
        
        # Собираем все компоненты контекста
        weather = self.get_weather_context(lat, lon)
        temporal = self.get_temporal_context(target_datetime)
        user_mood = self.detect_user_mood(recent_activity or [], session_data)
        local_events = self.get_local_events_context(lat, lon)
        
        # Вычисляем общую оценку благоприятности момента
        context_score = self._calculate_context_score(weather, temporal, user_mood, local_events)
        
        complete_context = CompleteContext(
            weather=weather,
            temporal=temporal,
            user_mood=user_mood,
            local_events=local_events,
            context_score=context_score
        )
        
        print(f"✅ Контекст собран: {weather.condition}, {temporal.time_of_day}, настроение: {user_mood.mood_type}")
        return complete_context
    
    def _calculate_context_score(self, weather: WeatherContext, temporal: TemporalContext,
                                user_mood: UserMoodContext, local_events: LocalEventsContext) -> float:
        """Вычисляет общую оценку благоприятности момента"""
        score = 0.5  # Базовая оценка
        
        # Погодный фактор
        if weather.is_good_weather:
            score += 0.2
        elif weather.condition == 'rainy':
            score -= 0.1
        
        # Временной фактор
        if temporal.is_prime_time:
            score += 0.15
        if temporal.is_weekend:
            score += 0.1
        if temporal.is_holiday:
            score += 0.05
        
        # Настроение пользователя
        if user_mood.confidence > 0.7:
            score += 0.1
        
        # Местные события
        high_impact_events = len([e for e in local_events.nearby_events 
                                if e.get('impact_on_traffic') == 'high'])
        if high_impact_events > 2:
            score -= 0.1  # Много событий может создать толпы
        elif high_impact_events == 1:
            score += 0.05  # Одно событие добавляет атмосферу
        
        return max(0.0, min(1.0, score))
    
    def apply_context_filters(self, recommendations: List[Dict], 
                            context: CompleteContext) -> List[Dict]:
        """
        Применяет контекстуальные фильтры к рекомендациям
        
        Args:
            recommendations: Список рекомендаций
            context: Полный контекст
            
        Returns:
            Отфильтрованный и взвешенный список рекомендаций
        """
        print(f"🎯 Применяем контекстуальные фильтры...")
        
        enhanced_recommendations = []
        
        for rec in recommendations:
            enhanced_rec = rec.copy()
            context_boost = 1.0
            context_reasons = []
            
            # Временные фильтры
            time_boost = self._apply_temporal_filters(rec, context.temporal)
            context_boost *= time_boost['multiplier']
            if time_boost['reasons']:
                context_reasons.extend(time_boost['reasons'])
            
            # Погодные фильтры
            weather_boost = self._apply_weather_filters(rec, context.weather)
            context_boost *= weather_boost['multiplier']
            if weather_boost['reasons']:
                context_reasons.extend(weather_boost['reasons'])
            
            # Фильтры настроения
            mood_boost = self._apply_mood_filters(rec, context.user_mood)
            context_boost *= mood_boost['multiplier']
            if mood_boost['reasons']:
                context_reasons.extend(mood_boost['reasons'])
            
            # Фильтры событий
            events_boost = self._apply_events_filters(rec, context.local_events)
            context_boost *= events_boost['multiplier']
            if events_boost['reasons']:
                context_reasons.extend(events_boost['reasons'])
            
            # Применяем контекстуальный boost
            original_score = enhanced_rec.get('final_score', enhanced_rec.get('multi_objective_score', 0))
            enhanced_rec['context_boosted_score'] = original_score * context_boost
            enhanced_rec['context_boost_factor'] = context_boost
            enhanced_rec['context_reasons'] = context_reasons
            enhanced_rec['context_applied'] = True
            
            enhanced_recommendations.append(enhanced_rec)
        
        # Сортируем по контекстуально улучшенному score
        enhanced_recommendations.sort(key=lambda x: x['context_boosted_score'], reverse=True)
        
        print(f"✅ Контекстуальные фильтры применены к {len(enhanced_recommendations)} рекомендациям")
        return enhanced_recommendations
    
    def _apply_temporal_filters(self, recommendation: Dict, temporal: TemporalContext) -> Dict:
        """Применяет временные фильтры"""
        multiplier = 1.0
        reasons = []
        
        category = recommendation.get('category', '')
        tags = recommendation.get('tags', [])
        title = recommendation.get('title', '').lower()
        
        # Паттерны времени дня
        time_pattern = self.time_activity_patterns.get(temporal.time_of_day, {})
        
        # Подходящие категории для времени дня
        suitable_categories = time_pattern.get('suitable_categories', [])
        if category in suitable_categories:
            multiplier *= 1.3
            reasons.append(f"Подходит для {temporal.time_of_day}")
        
        # Boost keywords для времени
        boost_keywords = time_pattern.get('boost_keywords', [])
        for keyword in boost_keywords:
            if any(keyword in tag.lower() for tag in tags) or keyword in title:
                multiplier *= 1.15
                reasons.append(f"Актуально сейчас ({keyword})")
                break
        
        # Выходные vs будни
        if temporal.is_weekend:
            if category in ['entertainment', 'activity', 'bar']:
                multiplier *= 1.2
                reasons.append("Отлично для выходных")
        else:
            if category in ['cafe', 'restaurant'] and temporal.time_of_day in ['morning', 'afternoon']:
                multiplier *= 1.1
                reasons.append("Идеально для рабочего дня")
        
        # Праздники
        if temporal.is_holiday:
            if category in ['restaurant', 'entertainment', 'gift']:
                multiplier *= 1.25
                reasons.append("Праздничное настроение")
        
        # Поздние часы
        if temporal.hour > 22:
            if category not in ['bar', 'club', 'late_cafe']:
                multiplier *= 0.7  # Штраф за неподходящее время
            else:
                multiplier *= 1.2
                reasons.append("Работает допоздна")
        
        return {'multiplier': multiplier, 'reasons': reasons}
    
    def _apply_weather_filters(self, recommendation: Dict, weather: WeatherContext) -> Dict:
        """Применяет погодные фильтры"""
        multiplier = 1.0
        reasons = []
        
        category = recommendation.get('category', '')
        tags = recommendation.get('tags', [])
        title = recommendation.get('title', '').lower()
        
        weather_pattern = self.weather_activity_patterns.get(weather.condition, {})
        
        # Подходящие категории для погоды
        boost_categories = weather_pattern.get('boost_categories', [])
        if category in boost_categories:
            multiplier *= 1.3
            reasons.append(f"Отлично в {weather.condition} погоду")
        
        # Boost keywords
        boost_keywords = weather_pattern.get('boost_keywords', [])
        for keyword in boost_keywords:
            if any(keyword in tag.lower() for tag in tags) or keyword in title:
                multiplier *= 1.2
                reasons.append(f"Подходит для погоды ({keyword})")
                break
        
        # Penalty keywords
        penalty_keywords = weather_pattern.get('penalty_keywords', [])
        for keyword in penalty_keywords:
            if any(keyword in tag.lower() for tag in tags) or keyword in title:
                multiplier *= 0.8
                reasons.append(f"Не очень подходит для погоды")
                break
        
        # Температурные условия
        if weather.temperature < 0:  # Очень холодно
            if any(keyword in title for keyword in ['открытый', 'терраса', 'парк']):
                multiplier *= 0.6
            elif any(keyword in title for keyword in ['теплый', 'уютный', 'горячий']):
                multiplier *= 1.3
                reasons.append("Согреет в холод")
        
        elif weather.temperature > 25:  # Жарко
            if any(keyword in title for keyword in ['прохладный', 'кондиционер', 'холодный']):
                multiplier *= 1.25
                reasons.append("Прохлада в жару")
        
        # Хорошая погода для прогулок
        if weather.is_good_weather and category in ['activity', 'park']:
            multiplier *= 1.4
            reasons.append("Отличная погода для прогулок")
        
        return {'multiplier': multiplier, 'reasons': reasons}
    
    def _apply_mood_filters(self, recommendation: Dict, user_mood: UserMoodContext) -> Dict:
        """Применяет фильтры настроения"""
        multiplier = 1.0
        reasons = []
        
        category = recommendation.get('category', '')
        price = recommendation.get('price', 1000)
        tags = recommendation.get('tags', [])
        
        # Бюджетное настроение
        if user_mood.budget_signal == 'budget':
            if price < 1000:
                multiplier *= 1.3
                reasons.append("Доступная цена")
            elif price > 2500:
                multiplier *= 0.7
        elif user_mood.budget_signal == 'luxury':
            if price > 3000:
                multiplier *= 1.2
                reasons.append("Премиум уровень")
        
        # Настроение активности
        mood_type = user_mood.mood_type
        
        if mood_type == 'adventurous':
            novelty = recommendation.get('novelty', 0.5)
            if novelty > 0.7:
                multiplier *= 1.4
                reasons.append("Новое приключение")
            if category in ['activity', 'entertainment']:
                multiplier *= 1.2
        
        elif mood_type == 'comfortable':
            if any(keyword in tag.lower() for tag in tags for keyword in ['уютный', 'домашний', 'спокойный']):
                multiplier *= 1.3
                reasons.append("Комфортная атмосфера")
            if category in ['cafe', 'restaurant']:
                multiplier *= 1.15
        
        elif mood_type == 'social':
            if category in ['entertainment', 'bar', 'restaurant']:
                multiplier *= 1.25
                reasons.append("Для общения")
        
        elif mood_type == 'romantic':
            if any(keyword in tag.lower() for tag in tags for keyword in ['романтический', 'интимный']):
                multiplier *= 1.4
                reasons.append("Романтическая атмосфера")
            if category == 'restaurant':
                multiplier *= 1.2
        
        # Уровень энергии
        if user_mood.activity_energy == 'high':
            if category in ['activity', 'entertainment']:
                multiplier *= 1.2
        elif user_mood.activity_energy == 'low':
            if category in ['cafe', 'spa']:
                multiplier *= 1.15
                reasons.append("Спокойный отдых")
        
        return {'multiplier': multiplier, 'reasons': reasons}
    
    def _apply_events_filters(self, recommendation: Dict, local_events: LocalEventsContext) -> Dict:
        """Применяет фильтры местных событий"""
        multiplier = 1.0
        reasons = []
        
        category = recommendation.get('category', '')
        
        # Высокий трафик - штраф для далеких мест
        if local_events.traffic_level == 'high':
            # Симуляция: штрафуем места, которые могут быть в пробках
            if category in ['activity', 'entertainment']:
                multiplier *= 0.9
            
            # Бонус для близких мест
            if category in ['cafe', 'restaurant']:
                multiplier *= 1.1
                reasons.append("Близко, избежите пробок")
        
        # Спецпредложения
        for offer in local_events.special_offers:
            if offer['category'] == category:
                multiplier *= 1.3
                reasons.append(f"Спецпредложение: {offer['description']}")
                break
        
        # События рядом
        relevant_events = [e for e in local_events.nearby_events 
                          if e['category'] == category or e['distance_km'] < 2]
        
        if relevant_events:
            multiplier *= 1.15
            reasons.append("Рядом интересные события")
        
        return {'multiplier': multiplier, 'reasons': reasons}

def main():
    """Демонстрация Context Awareness Engine"""
    print("🌡️ Демонстрация Context Awareness Engine - Фаза 2.2")
    print("🎯 Контекстуальная осведомленность: время + погода + настроение")
    
    # Инициализируем движок
    engine = ContextAwarenessEngine()
    
    # Симулируем данные пользователя
    recent_activity = [
        {'action': 'recommendation_shown', 'product_category': 'restaurant', 'price': 2000},
        {'action': 'recommendation_clicked', 'product_category': 'entertainment', 'price': 1500},
        {'action': 'viewed', 'product_category': 'cafe', 'price': 800},
    ]
    
    session_data = {
        'duration_minutes': 12,
        'items_viewed': 8,
        'budget_filters_used': True,
        'categories_searched': ['restaurant', 'cafe']
    }
    
    # Получаем полный контекст
    print("\n🌡️ Собираем полный контекст...")
    context = engine.get_complete_context(
        recent_activity=recent_activity,
        session_data=session_data
    )
    
    # Выводим результаты
    print(f"\n📊 Полный контекст момента:")
    print(f"  🌤️  Погода: {context.weather.condition}, {context.weather.temperature}°C")
    print(f"  🕐 Время: {context.temporal.time_of_day}, {'выходной' if context.temporal.is_weekend else 'будний день'}")
    print(f"  😊 Настроение: {context.user_mood.mood_type} (уверенность: {context.user_mood.confidence:.2f})")
    print(f"  💰 Бюджет: {context.user_mood.budget_signal}")
    print(f"  ⚡ Энергия: {context.user_mood.activity_energy}")
    print(f"  🎉 События рядом: {len(context.local_events.nearby_events)}")
    print(f"  📈 Общий контекст-score: {context.context_score:.3f}")
    
    # Демонстрируем применение фильтров
    print(f"\n🎯 Демонстрируем контекстуальные фильтры...")
    
    # Тестовые рекомендации
    test_recommendations = [
        {
            'title': 'Ресторан "Итальянец"',
            'category': 'restaurant',
            'price': 2500,
            'tags': ['Итальянская кухня', 'Романтический'],
            'final_score': 0.8,
            'novelty': 0.3
        },
        {
            'title': 'Парк "Сокольники"',
            'category': 'activity',
            'price': 0,
            'tags': ['Природа', 'Прогулки', 'Открытый'],
            'final_score': 0.7,
            'novelty': 0.2
        },
        {
            'title': 'Кофейня "Уютная"',
            'category': 'cafe',
            'price': 500,
            'tags': ['Кофе', 'Уютная атмосфера', 'Теплый'],
            'final_score': 0.6,
            'novelty': 0.1
        }
    ]
    
    # Применяем контекстуальные фильтры
    enhanced_recs = engine.apply_context_filters(test_recommendations, context)
    
    print(f"\n📋 Рекомендации с контекстуальными фильтрами:")
    for i, rec in enumerate(enhanced_recs, 1):
        boost_factor = rec['context_boost_factor']
        reasons = rec['context_reasons']
        
        print(f"{i}. {rec['title']}")
        print(f"   Оригинальный score: {rec['final_score']:.3f}")
        print(f"   Контекстуальный boost: x{boost_factor:.2f}")
        print(f"   Итоговый score: {rec['context_boosted_score']:.3f}")
        if reasons:
            print(f"   Причины: {', '.join(reasons[:2])}")
        print()
    
    print(f"🎉 Context Awareness Engine готов!")
    print(f"✅ Фаза 2.2 (Контекстуальная осведомленность) завершена!")

if __name__ == "__main__":
    main()
