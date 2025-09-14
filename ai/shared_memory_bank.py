"""
📸 Shared Memory Bank для LoveMemory AI
Фаза 3.1: "Копилка Воспоминаний"

Ключевая retention фича - превращает разовые рекомендации в ценную историю отношений.
Чем больше пара пользуется приложением, тем больше ценности накапливается.

Создает "цифровой ров" - уйти к конкуренту = потерять всю историю отношений.
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import uuid
import numpy as np
from pathlib import Path

@dataclass
class SharedMemory:
    """Совместное воспоминание пары"""
    memory_id: str
    pair_id: str
    recommendation_id: str
    place_title: str
    place_category: str
    visit_date: datetime
    
    # Пользовательский контент
    joint_rating: float  # Совместная оценка (1-10)
    photos: List[str]  # Пути к фото (до 5 штук)
    notes: str  # Заметки пары
    tags: List[str]  # Теги воспоминания
    
    # Эмоциональные метрики
    happiness_level: int  # Уровень счастья (1-5)
    relationship_impact: str  # positive, neutral, transformative
    would_repeat: bool  # Хотели бы повторить
    
    # Контекстные данные
    weather_at_visit: Optional[str]
    companions: List[str]  # Кто еще был с парой
    special_occasion: Optional[str]  # Особый повод
    
    # Метаданные
    created_at: datetime
    updated_at: datetime
    ai_generated_summary: str  # AI краткое описание
    memory_strength: float  # Сила воспоминания (0-1)
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SharedMemory':
        # Преобразуем строки в datetime
        if isinstance(data['visit_date'], str):
            data['visit_date'] = datetime.fromisoformat(data['visit_date'])
        if isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        
        return cls(**data)

@dataclass
class MemoryAnalytics:
    """Аналитика воспоминаний пары"""
    total_memories: int
    avg_rating: float
    favorite_categories: List[str]
    memory_timeline: List[Tuple[datetime, str]]  # (дата, название места)
    relationship_progression: Dict[str, Any]
    ai_insights: List[str]

@dataclass
class MemoryRecommendation:
    """Рекомендация на основе воспоминаний"""
    recommended_place: str
    similarity_to_memory: str  # ID похожего воспоминания
    reason: str  # Причина рекомендации
    confidence: float  # Уверенность (0-1)

class SharedMemoryBank:
    """
    Банк совместных воспоминаний пары
    
    Основные функции:
    1. Сохранение воспоминаний с фотографиями и оценками
    2. Анализ паттернов предпочтений
    3. Генерация рекомендаций на основе истории
    4. Создание timeline отношений
    5. Выявление "золотых моментов"
    """
    
    def __init__(self, db_path: str = 'data/shared_memories.db'):
        """
        Инициализация банка воспоминаний
        
        Args:
            db_path: Путь к базе данных SQLite
        """
        self.db_path = db_path
        self.photos_dir = Path('data/memory_photos')
        
        # Создаем директории
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.photos_dir.mkdir(parents=True, exist_ok=True)
        
        # Инициализируем базу данных
        self._init_database()
        
        # Шаблоны для AI генерации описаний
        self.summary_templates = {
            'restaurant': "Романтический ужин в {place} — {emotion_description}",
            'cafe': "Уютные посиделки в {place} — {emotion_description}",
            'entertainment': "Веселый вечер в {place} — {emotion_description}", 
            'activity': "Активный день в {place} — {emotion_description}",
            'default': "Время в {place} — {emotion_description}"
        }
        
        self.emotion_descriptions = {
            5: "момент, который запомнится навсегда",
            4: "прекрасное время вместе",
            3: "приятные впечатления",
            2: "время, проведенное вместе",
            1: "опыт, который нас многому научил"
        }
        
        print("📸 Shared Memory Bank инициализирован")
    
    def _init_database(self):
        """Инициализирует базу данных SQLite"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Таблица воспоминаний
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    memory_id TEXT PRIMARY KEY,
                    pair_id TEXT NOT NULL,
                    recommendation_id TEXT,
                    place_title TEXT NOT NULL,
                    place_category TEXT NOT NULL,
                    visit_date TEXT NOT NULL,
                    joint_rating REAL NOT NULL,
                    photos TEXT,  -- JSON список путей к фото
                    notes TEXT,
                    tags TEXT,  -- JSON список тегов
                    happiness_level INTEGER NOT NULL,
                    relationship_impact TEXT NOT NULL,
                    would_repeat BOOLEAN NOT NULL,
                    weather_at_visit TEXT,
                    companions TEXT,  -- JSON список
                    special_occasion TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    ai_generated_summary TEXT,
                    memory_strength REAL NOT NULL
                )
            """)
            
            # Индексы для быстрого поиска
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_pair_id ON memories (pair_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_visit_date ON memories (visit_date)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_rating ON memories (joint_rating)")
            
            # Таблица для аналитики (предвычисленные метрики)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memory_analytics (
                    pair_id TEXT PRIMARY KEY,
                    total_memories INTEGER,
                    avg_rating REAL,
                    favorite_categories TEXT,  -- JSON
                    last_updated TEXT,
                    ai_insights TEXT  -- JSON
                )
            """)
            
            conn.commit()
    
    def save_memory(self, pair_id: str, recommendation_id: Optional[str],
                   place_title: str, place_category: str,
                   visit_date: datetime, joint_rating: float,
                   photos: List[str] = None, notes: str = "",
                   tags: List[str] = None, happiness_level: int = 3,
                   relationship_impact: str = "positive",
                   would_repeat: bool = True,
                   weather_at_visit: str = None,
                   companions: List[str] = None,
                   special_occasion: str = None) -> SharedMemory:
        """
        Сохраняет новое воспоминание пары
        
        Args:
            pair_id: ID пары
            recommendation_id: ID рекомендации (если применимо)
            place_title: Название места
            place_category: Категория места
            visit_date: Дата посещения
            joint_rating: Совместная оценка (1-10)
            photos: Список путей к фотографиям
            notes: Заметки пары
            tags: Теги воспоминания
            happiness_level: Уровень счастья (1-5)
            relationship_impact: Влияние на отношения
            would_repeat: Хотели бы повторить
            weather_at_visit: Погода во время визита
            companions: Спутники
            special_occasion: Особый повод
            
        Returns:
            SharedMemory объект
        """
        memory_id = str(uuid.uuid4())
        now = datetime.now()
        
        # Генерируем AI описание
        ai_summary = self._generate_ai_summary(
            place_title, place_category, happiness_level, notes
        )
        
        # Вычисляем силу воспоминания
        memory_strength = self._calculate_memory_strength(
            joint_rating, happiness_level, len(photos or []), 
            len(notes), relationship_impact
        )
        
        memory = SharedMemory(
            memory_id=memory_id,
            pair_id=pair_id,
            recommendation_id=recommendation_id,
            place_title=place_title,
            place_category=place_category,
            visit_date=visit_date,
            joint_rating=joint_rating,
            photos=photos or [],
            notes=notes,
            tags=tags or [],
            happiness_level=happiness_level,
            relationship_impact=relationship_impact,
            would_repeat=would_repeat,
            weather_at_visit=weather_at_visit,
            companions=companions or [],
            special_occasion=special_occasion,
            created_at=now,
            updated_at=now,
            ai_generated_summary=ai_summary,
            memory_strength=memory_strength
        )
        
        # Сохраняем в базу
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO memories VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                memory.memory_id, memory.pair_id, memory.recommendation_id,
                memory.place_title, memory.place_category, memory.visit_date.isoformat(),
                memory.joint_rating, json.dumps(memory.photos), memory.notes,
                json.dumps(memory.tags), memory.happiness_level, memory.relationship_impact,
                memory.would_repeat, memory.weather_at_visit, json.dumps(memory.companions),
                memory.special_occasion, memory.created_at.isoformat(), 
                memory.updated_at.isoformat(), memory.ai_generated_summary, memory.memory_strength
            ))
            conn.commit()
        
        # Обновляем аналитику
        self._update_analytics(pair_id)
        
        print(f"📸 Воспоминание сохранено: {place_title} (рейтинг: {joint_rating}/10)")
        return memory
    
    def _generate_ai_summary(self, place_title: str, place_category: str, 
                           happiness_level: int, notes: str) -> str:
        """Генерирует AI описание воспоминания"""
        
        template = self.summary_templates.get(place_category, self.summary_templates['default'])
        emotion_desc = self.emotion_descriptions.get(happiness_level, "особенное время вместе")
        
        # Базовое описание
        summary = template.format(place=place_title, emotion_description=emotion_desc)
        
        # Добавляем контекст из заметок
        if notes and len(notes) > 10:
            # Простой анализ тональности заметок
            positive_words = ['отлично', 'замечательно', 'прекрасно', 'восхитительно', 'незабываемо']
            if any(word in notes.lower() for word in positive_words):
                summary += " Особенно запомнились яркие моменты и теплая атмосфера."
            elif 'первый раз' in notes.lower():
                summary += " Первый опыт такого рода — особенно значимый."
        
        return summary
    
    def _calculate_memory_strength(self, rating: float, happiness: int, 
                                 photos_count: int, notes_length: int,
                                 impact: str) -> float:
        """Вычисляет силу воспоминания"""
        strength = 0.0
        
        # Базовая сила от рейтинга
        strength += rating / 10.0 * 0.4
        
        # Эмоциональная составляющая
        strength += happiness / 5.0 * 0.3
        
        # Богатство контента
        content_richness = min(1.0, (photos_count * 0.2 + min(notes_length, 100) / 100 * 0.3))
        strength += content_richness * 0.2
        
        # Влияние на отношения
        impact_bonuses = {'transformative': 0.1, 'positive': 0.05, 'neutral': 0.0}
        strength += impact_bonuses.get(impact, 0.0)
        
        return min(1.0, strength)
    
    def get_memories(self, pair_id: str, limit: int = None, 
                    sort_by: str = 'visit_date') -> List[SharedMemory]:
        """
        Получает воспоминания пары
        
        Args:
            pair_id: ID пары
            limit: Ограничение количества
            sort_by: Сортировка (visit_date, joint_rating, memory_strength)
            
        Returns:
            Список воспоминаний
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = "SELECT * FROM memories WHERE pair_id = ?"
            params = [pair_id]
            
            # Сортировка
            valid_sorts = ['visit_date', 'joint_rating', 'memory_strength', 'created_at']
            if sort_by in valid_sorts:
                query += f" ORDER BY {sort_by} DESC"
            
            # Лимит
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
        
        memories = []
        for row in rows:
            memory_dict = {
                'memory_id': row[0],
                'pair_id': row[1],
                'recommendation_id': row[2],
                'place_title': row[3],
                'place_category': row[4],
                'visit_date': row[5],
                'joint_rating': row[6],
                'photos': json.loads(row[7] or '[]'),
                'notes': row[8] or '',
                'tags': json.loads(row[9] or '[]'),
                'happiness_level': row[10],
                'relationship_impact': row[11],
                'would_repeat': bool(row[12]),
                'weather_at_visit': row[13],
                'companions': json.loads(row[14] or '[]'),
                'special_occasion': row[15],
                'created_at': row[16],
                'updated_at': row[17],
                'ai_generated_summary': row[18],
                'memory_strength': row[19]
            }
            memories.append(SharedMemory.from_dict(memory_dict))
        
        return memories
    
    def get_memory_analytics(self, pair_id: str) -> MemoryAnalytics:
        """
        Получает аналитику воспоминаний пары
        
        Args:
            pair_id: ID пары
            
        Returns:
            MemoryAnalytics с статистикой
        """
        memories = self.get_memories(pair_id)
        
        if not memories:
            return MemoryAnalytics(
                total_memories=0,
                avg_rating=0.0,
                favorite_categories=[],
                memory_timeline=[],
                relationship_progression={},
                ai_insights=[]
            )
        
        # Базовая статистика
        total_memories = len(memories)
        avg_rating = sum(m.joint_rating for m in memories) / total_memories
        
        # Любимые категории
        category_counts = {}
        category_ratings = {}
        
        for memory in memories:
            cat = memory.place_category
            category_counts[cat] = category_counts.get(cat, 0) + 1
            if cat not in category_ratings:
                category_ratings[cat] = []
            category_ratings[cat].append(memory.joint_rating)
        
        # Сортируем категории по популярности и рейтингу
        favorite_categories = sorted(
            category_counts.keys(),
            key=lambda cat: (category_counts[cat], np.mean(category_ratings[cat])),
            reverse=True
        )[:5]
        
        # Timeline воспоминаний
        memory_timeline = [
            (memory.visit_date, memory.place_title) 
            for memory in sorted(memories, key=lambda m: m.visit_date)
        ]
        
        # Прогрессия отношений
        relationship_progression = self._analyze_relationship_progression(memories)
        
        # AI инсайты
        ai_insights = self._generate_ai_insights(memories)
        
        analytics = MemoryAnalytics(
            total_memories=total_memories,
            avg_rating=round(avg_rating, 2),
            favorite_categories=favorite_categories,
            memory_timeline=memory_timeline,
            relationship_progression=relationship_progression,
            ai_insights=ai_insights
        )
        
        return analytics
    
    def _analyze_relationship_progression(self, memories: List[SharedMemory]) -> Dict[str, Any]:
        """Анализирует прогрессию отношений по воспоминаниям"""
        if len(memories) < 2:
            return {}
        
        # Сортируем по дате
        sorted_memories = sorted(memories, key=lambda m: m.visit_date)
        
        # Тренд рейтингов
        ratings = [m.joint_rating for m in sorted_memories]
        rating_trend = "growing" if ratings[-1] > ratings[0] else "stable" if abs(ratings[-1] - ratings[0]) < 1 else "declining"
        
        # Тренд уровня счастья
        happiness_levels = [m.happiness_level for m in sorted_memories]
        happiness_trend = "growing" if happiness_levels[-1] > happiness_levels[0] else "stable" if happiness_levels[-1] == happiness_levels[0] else "declining"
        
        # Разнообразие активностей
        unique_categories = len(set(m.place_category for m in memories))
        diversity_score = min(1.0, unique_categories / 5)  # Нормализуем к 5 категориям
        
        # Частота свиданий
        if len(memories) >= 3:
            time_span = (sorted_memories[-1].visit_date - sorted_memories[0].visit_date).days
            if time_span > 0:
                frequency = len(memories) / (time_span / 30)  # Воспоминаний в месяц
            else:
                frequency = len(memories)
        else:
            frequency = 0
        
        # Золотые моменты (рейтинг 9+)
        golden_moments = [m for m in memories if m.joint_rating >= 9.0]
        
        return {
            'rating_trend': rating_trend,
            'happiness_trend': happiness_trend,
            'diversity_score': round(diversity_score, 2),
            'frequency_per_month': round(frequency, 1),
            'golden_moments_count': len(golden_moments),
            'total_timeline_days': (sorted_memories[-1].visit_date - sorted_memories[0].visit_date).days
        }
    
    def _generate_ai_insights(self, memories: List[SharedMemory]) -> List[str]:
        """Генерирует AI инсайты на основе воспоминаний"""
        insights = []
        
        if not memories:
            return insights
        
        # Анализ по рейтингам
        avg_rating = sum(m.joint_rating for m in memories) / len(memories)
        if avg_rating >= 8.0:
            insights.append("🌟 У вас отличный вкус в выборе мест — большинство воспоминаний яркие и позитивные")
        elif avg_rating >= 6.0:
            insights.append("👍 Вы находите удовольствие в разных активностях, что говорит о гибкости в отношениях")
        
        # Анализ разнообразия
        categories = set(m.place_category for m in memories)
        if len(categories) >= 4:
            insights.append("🌈 Вы любите разнообразие — это помогает отношениям оставаться свежими")
        elif len(categories) <= 2:
            insights.append("🎯 У вас есть четкие предпочтения — знание того, что нравится, это сила")
        
        # Анализ частоты
        if len(memories) >= 10:
            insights.append("💖 Вы активно создаете совместные воспоминания — это инвестиция в будущее отношений")
        
        # Анализ трансформативных моментов
        transformative_memories = [m for m in memories if m.relationship_impact == 'transformative']
        if transformative_memories:
            insights.append(f"✨ {len(transformative_memories)} воспоминаний стали переломными моментами в ваших отношениях")
        
        # Анализ повторяемости
        repeat_wishes = [m for m in memories if m.would_repeat]
        if len(repeat_wishes) / len(memories) > 0.8:
            insights.append("🔄 Вы хотели бы повторить большинство ваших свиданий — знак того, что вы хорошо выбираете")
        
        # Сезонный анализ
        month_counts = {}
        for memory in memories:
            month = memory.visit_date.month
            month_counts[month] = month_counts.get(month, 0) + 1
        
        if month_counts:
            peak_month = max(month_counts.items(), key=lambda x: x[1])[0]
            month_names = ['', 'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                          'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
            insights.append(f"📅 Больше всего ярких воспоминаний создается в {month_names[peak_month]}")
        
        return insights[:5]  # Возвращаем максимум 5 инсайтов
    
    def get_memory_based_recommendations(self, pair_id: str, 
                                       top_k: int = 5) -> List[MemoryRecommendation]:
        """
        Генерирует рекомендации на основе воспоминаний
        
        Args:
            pair_id: ID пары
            top_k: Количество рекомендаций
            
        Returns:
            Список рекомендаций на основе памяти
        """
        memories = self.get_memories(pair_id)
        
        if not memories:
            return []
        
        recommendations = []
        
        # 1. Рекомендация на основе лучших воспоминаний
        best_memories = [m for m in memories if m.joint_rating >= 8.0]
        if best_memories:
            best_memory = max(best_memories, key=lambda m: m.joint_rating)
            recommendations.append(MemoryRecommendation(
                recommended_place=f"Похожее место на {best_memory.place_title}",
                similarity_to_memory=best_memory.memory_id,
                reason=f"Вы поставили {best_memory.joint_rating}/10 за {best_memory.place_title} — найдем что-то похожее!",
                confidence=0.9
            ))
        
        # 2. Рекомендация на основе любимой категории
        analytics = self.get_memory_analytics(pair_id)
        if analytics.favorite_categories:
            fav_category = analytics.favorite_categories[0]
            category_memories = [m for m in memories if m.place_category == fav_category]
            if category_memories:
                avg_rating = sum(m.joint_rating for m in category_memories) / len(category_memories)
                recommendations.append(MemoryRecommendation(
                    recommended_place=f"Новое место в категории '{fav_category}'",
                    similarity_to_memory="category_pattern",
                    reason=f"Вы любите {fav_category} (средний рейтинг {avg_rating:.1f}/10) — время открыть новое место!",
                    confidence=0.8
                ))
        
        # 3. Рекомендация для разнообразия
        tried_categories = set(m.place_category for m in memories)
        all_categories = ['restaurant', 'cafe', 'entertainment', 'activity', 'bar', 'gift']
        untried_categories = [cat for cat in all_categories if cat not in tried_categories]
        
        if untried_categories:
            new_category = untried_categories[0]
            recommendations.append(MemoryRecommendation(
                recommended_place=f"Первый опыт в категории '{new_category}'",
                similarity_to_memory="diversity_boost",
                reason=f"Вы еще не пробовали {new_category} — время для новых открытий!",
                confidence=0.6
            ))
        
        # 4. Повторение трансформативного опыта
        transformative_memories = [m for m in memories if m.relationship_impact == 'transformative']
        if transformative_memories:
            transformative = transformative_memories[0]
            recommendations.append(MemoryRecommendation(
                recommended_place=f"Возвращение к особенному: место как {transformative.place_title}",
                similarity_to_memory=transformative.memory_id,
                reason=f"{transformative.place_title} стал особенным моментом ваших отношений — найдем похожую магию",
                confidence=0.85
            ))
        
        # 5. Сезонная рекомендация
        current_month = datetime.now().month
        seasonal_memories = [m for m in memories if m.visit_date.month == current_month]
        if seasonal_memories:
            seasonal_avg = sum(m.joint_rating for m in seasonal_memories) / len(seasonal_memories)
            if seasonal_avg >= 7.0:
                recommendations.append(MemoryRecommendation(
                    recommended_place=f"Сезонная традиция (как в прошлом году)",
                    similarity_to_memory="seasonal_pattern",
                    reason=f"В этом месяце у вас отличные воспоминания (рейтинг {seasonal_avg:.1f}/10) — создаем новую традицию!",
                    confidence=0.7
                ))
        
        return recommendations[:top_k]
    
    def _update_analytics(self, pair_id: str):
        """Обновляет предвычисленную аналитику для пары"""
        analytics = self.get_memory_analytics(pair_id)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO memory_analytics 
                (pair_id, total_memories, avg_rating, favorite_categories, last_updated, ai_insights)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                pair_id,
                analytics.total_memories,
                analytics.avg_rating,
                json.dumps(analytics.favorite_categories),
                datetime.now().isoformat(),
                json.dumps(analytics.ai_insights)
            ))
            conn.commit()
    
    def create_memory_timeline_visualization(self, pair_id: str) -> Dict[str, Any]:
        """
        Создает данные для визуализации timeline воспоминаний
        
        Args:
            pair_id: ID пары
            
        Returns:
            Данные для фронтенда визуализации
        """
        memories = self.get_memories(pair_id, sort_by='visit_date')
        
        if not memories:
            return {'timeline': [], 'stats': {}}
        
        timeline_data = []
        
        for memory in memories:
            timeline_data.append({
                'date': memory.visit_date.isoformat(),
                'title': memory.place_title,
                'category': memory.place_category,
                'rating': memory.joint_rating,
                'happiness': memory.happiness_level,
                'photos_count': len(memory.photos),
                'has_notes': len(memory.notes) > 0,
                'memory_strength': memory.memory_strength,
                'ai_summary': memory.ai_generated_summary,
                'special_occasion': memory.special_occasion
            })
        
        # Статистика для визуализации
        stats = {
            'total_memories': len(memories),
            'avg_rating': round(sum(m.joint_rating for m in memories) / len(memories), 1),
            'best_memory': max(memories, key=lambda m: m.joint_rating).place_title,
            'memory_span_days': (memories[-1].visit_date - memories[0].visit_date).days,
            'categories_tried': len(set(m.place_category for m in memories))
        }
        
        return {
            'timeline': timeline_data,
            'stats': stats,
            'generated_at': datetime.now().isoformat()
        }
    
    def export_memories(self, pair_id: str, format: str = 'json') -> str:
        """
        Экспортирует воспоминания пары
        
        Args:
            pair_id: ID пары
            format: Формат экспорта (json, csv)
            
        Returns:
            Путь к экспортированному файлу
        """
        memories = self.get_memories(pair_id)
        export_dir = Path('data/exports')
        export_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if format == 'json':
            filename = f"memories_{pair_id}_{timestamp}.json"
            filepath = export_dir / filename
            
            export_data = {
                'pair_id': pair_id,
                'exported_at': datetime.now().isoformat(),
                'total_memories': len(memories),
                'memories': [memory.to_dict() for memory in memories],
                'analytics': asdict(self.get_memory_analytics(pair_id))
            }
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2, default=str)
        
        elif format == 'csv':
            import pandas as pd
            
            filename = f"memories_{pair_id}_{timestamp}.csv"
            filepath = export_dir / filename
            
            # Преобразуем в DataFrame
            df_data = []
            for memory in memories:
                row = {
                    'Дата': memory.visit_date.strftime('%Y-%m-%d'),
                    'Место': memory.place_title,
                    'Категория': memory.place_category,
                    'Рейтинг': memory.joint_rating,
                    'Уровень_счастья': memory.happiness_level,
                    'Заметки': memory.notes,
                    'Повторили_бы': memory.would_repeat,
                    'AI_описание': memory.ai_generated_summary
                }
                df_data.append(row)
            
            df = pd.DataFrame(df_data)
            df.to_csv(filepath, index=False, encoding='utf-8-sig')
        
        print(f"📸 Воспоминания экспортированы: {filepath}")
        return str(filepath)

def main():
    """Демонстрация Shared Memory Bank"""
    print("📸 Демонстрация Shared Memory Bank - Фаза 3.1")
    print("💝 Копилка воспоминаний: retention через эмоциональную ценность")
    
    # Инициализируем банк памяти
    memory_bank = SharedMemoryBank()
    
    # Тестовая пара
    test_pair_id = "pair_123"
    
    # Симулируем несколько воспоминаний
    print(f"\n📝 Создаем воспоминания для пары {test_pair_id}...")
    
    # Воспоминание 1: Романтический ужин
    memory1 = memory_bank.save_memory(
        pair_id=test_pair_id,
        recommendation_id="rec_001",
        place_title="Ресторан 'Итальянец'",
        place_category="restaurant",
        visit_date=datetime.now() - timedelta(days=30),
        joint_rating=9.2,
        photos=["photo1.jpg", "photo2.jpg"],
        notes="Невероятный вечер! Паста была божественной, а атмосфера очень романтичной.",
        tags=["романтика", "первое_свидание", "итальянская_кухня"],
        happiness_level=5,
        relationship_impact="transformative",
        special_occasion="первое свидание"
    )
    
    # Воспоминание 2: Кофе
    memory2 = memory_bank.save_memory(
        pair_id=test_pair_id,
        recommendation_id="rec_002",
        place_title="Кофейня 'Аромат'",
        place_category="cafe",
        visit_date=datetime.now() - timedelta(days=15),
        joint_rating=7.8,
        photos=["photo3.jpg"],
        notes="Уютное место, вкусный кофе. Долго разговаривали.",
        tags=["кофе", "уют", "разговоры"],
        happiness_level=4,
        relationship_impact="positive"
    )
    
    # Воспоминание 3: Развлечения
    memory3 = memory_bank.save_memory(
        pair_id=test_pair_id,
        recommendation_id="rec_003",
        place_title="Квест-комната 'Загадка'",
        place_category="entertainment",
        visit_date=datetime.now() - timedelta(days=7),
        joint_rating=8.5,
        photos=["photo4.jpg", "photo5.jpg", "photo6.jpg"],
        notes="Было сложно, но мы отлично работали в команде!",
        tags=["квест", "команда", "адреналин"],
        happiness_level=5,
        relationship_impact="positive",
        would_repeat=True
    )
    
    # Получаем воспоминания
    print(f"\n💭 Воспоминания пары:")
    memories = memory_bank.get_memories(test_pair_id)
    for memory in memories:
        print(f"  📅 {memory.visit_date.strftime('%d.%m.%Y')}: {memory.place_title}")
        print(f"     ⭐ Рейтинг: {memory.joint_rating}/10 | 😊 Счастье: {memory.happiness_level}/5")
        print(f"     📝 {memory.ai_generated_summary}")
        print()
    
    # Аналитика воспоминаний
    print(f"📊 Аналитика воспоминаний:")
    analytics = memory_bank.get_memory_analytics(test_pair_id)
    print(f"  Всего воспоминаний: {analytics.total_memories}")
    print(f"  Средний рейтинг: {analytics.avg_rating}/10")
    print(f"  Любимые категории: {', '.join(analytics.favorite_categories)}")
    print(f"  AI инсайты:")
    for insight in analytics.ai_insights:
        print(f"    • {insight}")
    
    # Рекомендации на основе памяти
    print(f"\n🎯 Рекомендации на основе воспоминаний:")
    memory_recommendations = memory_bank.get_memory_based_recommendations(test_pair_id, top_k=3)
    for i, rec in enumerate(memory_recommendations, 1):
        print(f"  {i}. {rec.recommended_place}")
        print(f"     💡 {rec.reason}")
        print(f"     🎯 Уверенность: {rec.confidence:.0%}")
        print()
    
    # Timeline визуализация
    print(f"📈 Timeline данные:")
    timeline_data = memory_bank.create_memory_timeline_visualization(test_pair_id)
    print(f"  Период воспоминаний: {timeline_data['stats']['memory_span_days']} дней")
    print(f"  Лучшее воспоминание: {timeline_data['stats']['best_memory']}")
    print(f"  Категорий попробовано: {timeline_data['stats']['categories_tried']}")
    
    # Экспорт воспоминаний
    print(f"\n💾 Экспортируем воспоминания...")
    export_path = memory_bank.export_memories(test_pair_id, format='json')
    
    print(f"\n📸 Shared Memory Bank готов!")
    print(f"✅ Фаза 3.1 (Копилка воспоминаний) завершена!")
    print(f"💡 Retention механизм: чем больше воспоминаний, тем ценнее аккаунт")

if __name__ == "__main__":
    main()
