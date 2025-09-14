"""
🧠 Personality Engine - Deep Personality Model для LoveMemory AI
Реализует научно обоснованную модель "Большая Пятёрка" (OCEAN)

Фаза 1.1: Глубокая Модель Личности Пользователя
- Openness: Открытость опыту (0-1)
- Conscientiousness: Добросовестность (0-1)  
- Extraversion: Экстраверсия (0-1)
- Agreeableness: Доброжелательность (0-1)
- Neuroticism: Невротизм (0-1)
"""

import random
import numpy as np
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class PersonalityProfile:
    """Профиль личности пользователя по модели OCEAN"""
    openness: float  # Открытость опыту (0-1)
    conscientiousness: float  # Добросовестность (0-1)
    extraversion: float  # Экстраверсия (0-1)
    agreeableness: float  # Доброжелательность (0-1)
    neuroticism: float  # Невротизм (0-1)
    
    def to_dict(self) -> Dict[str, float]:
        return {
            'openness': self.openness,
            'conscientiousness': self.conscientiousness,
            'extraversion': self.extraversion,
            'agreeableness': self.agreeableness,
            'neuroticism': self.neuroticism
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, float]) -> 'PersonalityProfile':
        return cls(**data)

class PersonalityEngine:
    """Движок для работы с моделью личности OCEAN"""
    
    def __init__(self):
        # Архетипы с предрасположенностями к определенным чертам OCEAN
        self.archetype_personality_biases = {
            'ArtLovers': {
                'openness': (0.7, 0.95),  # Высокая открытость
                'conscientiousness': (0.3, 0.7),
                'extraversion': (0.3, 0.8),
                'agreeableness': (0.5, 0.8),
                'neuroticism': (0.2, 0.6)
            },
            'Gamers': {
                'openness': (0.4, 0.8),
                'conscientiousness': (0.2, 0.6),
                'extraversion': (0.2, 0.7),  # Могут быть интровертами
                'agreeableness': (0.3, 0.7),
                'neuroticism': (0.3, 0.7)
            },
            'Gourmets': {
                'openness': (0.5, 0.8),
                'conscientiousness': (0.4, 0.8),
                'extraversion': (0.4, 0.9),  # Социальны
                'agreeableness': (0.5, 0.8),
                'neuroticism': (0.2, 0.5)
            },
            'Homebodies': {
                'openness': (0.2, 0.6),  # Низкая открытость
                'conscientiousness': (0.5, 0.9),  # Высокая добросовестность
                'extraversion': (0.1, 0.5),  # Интроверты
                'agreeableness': (0.6, 0.9),
                'neuroticism': (0.3, 0.7)
            },
            'Fitness': {
                'openness': (0.3, 0.7),
                'conscientiousness': (0.6, 0.95),  # Очень дисциплинированы
                'extraversion': (0.4, 0.8),
                'agreeableness': (0.4, 0.7),
                'neuroticism': (0.1, 0.4)  # Эмоционально стабильны
            },
            'Travelers': {
                'openness': (0.7, 0.95),  # Очень открыты к новому
                'conscientiousness': (0.3, 0.7),
                'extraversion': (0.5, 0.9),  # Социальны
                'agreeableness': (0.4, 0.8),
                'neuroticism': (0.2, 0.6)
            }
        }
        
        # Активности и их связь с чертами OCEAN
        self.activity_personality_bonuses = {
            # Открытость (Openness)
            'openness': {
                'high': [
                    'Театр', 'Музей искусств', 'Арт-хаус', 'Художественная литература',
                    'Мастер-класс по живописи', 'Винная дегустация', 'Экспериментальная кухня',
                    'Авангардное искусство', 'Философские беседы', 'Путешествия',
                    'Необычные места', 'Креативные хобби'
                ],
                'low': [
                    'Домашние свидания', 'Традиционная кухня', 'Классические фильмы',
                    'Знакомые места', 'Простые удовольствия', 'Уютные кафе'
                ]
            },
            # Добросовестность (Conscientiousness)
            'conscientiousness': {
                'high': [
                    'Планируемые мероприятия', 'Театр', 'Мастер-классы', 'Образовательные туры',
                    'Фитнес', 'Йога', 'Запланированные ужины', 'Бронирование заранее'
                ],
                'low': [
                    'Спонтанные прогулки', 'Стрит-фуд', 'Бары', 'Импровизация',
                    'Последние места', 'Случайные открытия'
                ]
            },
            # Экстраверсия (Extraversion)
            'extraversion': {
                'high': [
                    'Концерты', 'Клубы', 'Караоке', 'Вечеринки', 'Групповые активности',
                    'Общественные мероприятия', 'Тусовки', 'Социальные игры'
                ],
                'low': [
                    'Домашние свидания', 'Тихие кафе', 'Прогулки на природе',
                    'Камерные места', 'Интимная обстановка', 'Парк', 'Библиотека'
                ]
            },
            # Доброжелательность (Agreeableness) 
            'agreeableness': {
                'high': [
                    'Командные игры', 'Волонтерство', 'Семейные рестораны',
                    'Кооперативные активности', 'Помощь другим'
                ],
                'low': [
                    'Соревновательные игры', 'Боулинг', 'Картинг', 'Дебаты',
                    'Индивидуальные достижения'
                ]
            },
            # Невротизм (Neuroticism)
            'neuroticism': {
                'high': [
                    'Спа', 'Релакс', 'Йога', 'Медитация', 'Тихие места',
                    'Комфортная обстановка', 'Предсказуемые активности'
                ],
                'low': [
                    'Экстрим', 'Адреналин', 'Шумные места', 'Квесты-хорроры',
                    'Приключения', 'Риск'
                ]
            }
        }
    
    def generate_personality_profile(self, archetype: str = None) -> PersonalityProfile:
        """
        Генерирует профиль личности по модели OCEAN
        
        Args:
            archetype: Архетип пользователя (для предрасположенностей)
        
        Returns:
            PersonalityProfile с чертами OCEAN
        """
        if archetype and archetype in self.archetype_personality_biases:
            biases = self.archetype_personality_biases[archetype]
            
            # Генерируем черты с учетом предрасположенностей архетипа
            openness = random.uniform(*biases['openness'])
            conscientiousness = random.uniform(*biases['conscientiousness'])
            extraversion = random.uniform(*biases['extraversion'])
            agreeableness = random.uniform(*biases['agreeableness'])
            neuroticism = random.uniform(*biases['neuroticism'])
        else:
            # Случайная генерация (нормальное распределение)
            openness = np.clip(np.random.normal(0.5, 0.2), 0, 1)
            conscientiousness = np.clip(np.random.normal(0.5, 0.2), 0, 1)
            extraversion = np.clip(np.random.normal(0.5, 0.2), 0, 1)
            agreeableness = np.clip(np.random.normal(0.6, 0.2), 0, 1)  # Люди в среднем доброжелательны
            neuroticism = np.clip(np.random.normal(0.4, 0.2), 0, 1)
        
        return PersonalityProfile(
            openness=round(openness, 3),
            conscientiousness=round(conscientiousness, 3),
            extraversion=round(extraversion, 3),
            agreeableness=round(agreeableness, 3),
            neuroticism=round(neuroticism, 3)
        )
    
    def calculate_activity_appeal(self, personality: PersonalityProfile, 
                                activity_tags: List[str]) -> float:
        """
        Вычисляет привлекательность активности для данной личности
        
        Args:
            personality: Профиль личности OCEAN
            activity_tags: Теги активности/места
            
        Returns:
            Коэффициент привлекательности (0-2.0)
        """
        appeal_score = 1.0  # Базовый уровень
        
        # Проверяем каждую черту личности
        traits = {
            'openness': personality.openness,
            'conscientiousness': personality.conscientiousness,
            'extraversion': personality.extraversion,
            'agreeableness': personality.agreeableness,
            'neuroticism': personality.neuroticism
        }
        
        for trait_name, trait_value in traits.items():
            if trait_name in self.activity_personality_bonuses:
                trait_bonuses = self.activity_personality_bonuses[trait_name]
                
                # Высокая черта
                if trait_value > 0.6:
                    high_activities = trait_bonuses.get('high', [])
                    for activity in high_activities:
                        if any(activity.lower() in tag.lower() or tag.lower() in activity.lower() 
                              for tag in activity_tags):
                            bonus_strength = (trait_value - 0.6) / 0.4  # 0-1
                            appeal_score += bonus_strength * 0.3  # До +0.3
                
                # Низкая черта
                elif trait_value < 0.4:
                    low_activities = trait_bonuses.get('low', [])
                    for activity in low_activities:
                        if any(activity.lower() in tag.lower() or tag.lower() in activity.lower() 
                              for tag in activity_tags):
                            bonus_strength = (0.4 - trait_value) / 0.4  # 0-1
                            appeal_score += bonus_strength * 0.3  # До +0.3
        
        # Специальные случаи
        
        # Высокий невротизм - штраф за стрессовые активности
        if personality.neuroticism > 0.7:
            stress_keywords = ['экстрим', 'хоррор', 'адреналин', 'шумный', 'хаотичный']
            for keyword in stress_keywords:
                if any(keyword in tag.lower() for tag in activity_tags):
                    appeal_score -= 0.4
        
        # Высокая открытость - бонус за новизну и необычность
        if personality.openness > 0.7:
            novelty_keywords = ['новый', 'необычный', 'экспериментальный', 'авангард', 'арт']
            for keyword in novelty_keywords:
                if any(keyword in tag.lower() for tag in activity_tags):
                    appeal_score += 0.2
        
        # Низкая добросовестность - штраф за планирование
        if personality.conscientiousness < 0.3:
            planning_keywords = ['бронирование', 'заранее', 'планирование', 'расписание']
            for keyword in planning_keywords:
                if any(keyword in tag.lower() for tag in activity_tags):
                    appeal_score -= 0.2
        
        return max(0.1, min(2.0, appeal_score))
    
    def calculate_compatibility_score(self, personality1: PersonalityProfile, 
                                    personality2: PersonalityProfile) -> float:
        """
        Вычисляет совместимость двух личностей (0-1)
        
        Основано на психологических исследованиях совместимости:
        - Схожесть в некоторых чертах важна (ценности)
        - Дополнительность в других может быть полезна
        
        Args:
            personality1: Первая личность
            personality2: Вторая личность
            
        Returns:
            Совместимость от 0 до 1
        """
        score = 0.0
        
        # Схожесть в ценностях (Openness, Agreeableness) - плюс
        openness_similarity = 1 - abs(personality1.openness - personality2.openness)
        agreeableness_similarity = 1 - abs(personality1.agreeableness - personality2.agreeableness)
        
        score += openness_similarity * 0.25
        score += agreeableness_similarity * 0.25
        
        # Схожесть в эмоциональной стабильности (низкий невротизм) - плюс
        both_stable = (1 - personality1.neuroticism) * (1 - personality2.neuroticism)
        score += both_stable * 0.2
        
        # Баланс экстраверсии - не слишком похожи, но и не полные противоположности
        extraversion_diff = abs(personality1.extraversion - personality2.extraversion)
        extraversion_balance = 1 - abs(extraversion_diff - 0.3) / 0.7  # Оптимум при разнице 0.3
        score += max(0, extraversion_balance) * 0.15
        
        # Хотя бы один добросовестный (для планирования отношений)
        conscientiousness_coverage = max(personality1.conscientiousness, personality2.conscientiousness)
        score += conscientiousness_coverage * 0.15
        
        return max(0.0, min(1.0, score))
    
    def get_personality_description(self, personality: PersonalityProfile) -> Dict[str, str]:
        """
        Создает человекочитаемое описание личности
        
        Args:
            personality: Профиль личности
            
        Returns:
            Словарь с описаниями каждой черты
        """
        descriptions = {}
        
        # Openness
        if personality.openness > 0.7:
            descriptions['openness'] = "Очень открыт(а) к новому опыту, любит искусство и необычные идеи"
        elif personality.openness > 0.3:
            descriptions['openness'] = "Умеренно открыт(а) к новому, но предпочитает знакомое"
        else:
            descriptions['openness'] = "Предпочитает традиционное и проверенное, консервативен"
        
        # Conscientiousness
        if personality.conscientiousness > 0.7:
            descriptions['conscientiousness'] = "Очень организован(а) и дисциплинирован(а), любит планировать"
        elif personality.conscientiousness > 0.3:
            descriptions['conscientiousness'] = "Умеренно организован(а), баланс планирования и спонтанности"
        else:
            descriptions['conscientiousness'] = "Спонтанен(а) и гибок(а), не любит жесткие планы"
        
        # Extraversion
        if personality.extraversion > 0.7:
            descriptions['extraversion'] = "Экстраверт: энергичен(а) в компании, любит общение и вечеринки"
        elif personality.extraversion > 0.3:
            descriptions['extraversion'] = "Амбиверт: комфортно как в компании, так и в одиночестве"
        else:
            descriptions['extraversion'] = "Интроверт: предпочитает уединение и спокойную обстановку"
        
        # Agreeableness  
        if personality.agreeableness > 0.7:
            descriptions['agreeableness'] = "Очень доброжелательный, склонен к компромиссам и сотрудничеству"
        elif personality.agreeableness > 0.3:
            descriptions['agreeableness'] = "Умеренно доброжелательный, может отстаивать свои интересы"
        else:
            descriptions['agreeableness'] = "Соревновательный, прямолинейный, не склонен к компромиссам"
        
        # Neuroticism
        if personality.neuroticism > 0.7:
            descriptions['neuroticism'] = "Эмоционально чувствительный, склонен к стрессу и тревогам"
        elif personality.neuroticism > 0.3:
            descriptions['neuroticism'] = "Умеренно эмоционален, справляется со стрессом"
        else:
            descriptions['neuroticism'] = "Эмоционально стабилен, спокойно переносит стресс"
        
        return descriptions

# Глобальный экземпляр движка личности
personality_engine = PersonalityEngine()

def main():
    """Демонстрация работы Personality Engine"""
    print("🧠 Демонстрация Personality Engine - OCEAN Model")
    
    # Тестируем генерацию личностей для разных архетипов
    archetypes = ['ArtLovers', 'Gamers', 'Gourmets', 'Homebodies', 'Fitness', 'Travelers']
    
    for archetype in archetypes:
        print(f"\n🎭 Архетип: {archetype}")
        personality = personality_engine.generate_personality_profile(archetype)
        
        print(f"  OCEAN: O={personality.openness:.2f} C={personality.conscientiousness:.2f} "
              f"E={personality.extraversion:.2f} A={personality.agreeableness:.2f} N={personality.neuroticism:.2f}")
        
        descriptions = personality_engine.get_personality_description(personality)
        for trait, desc in descriptions.items():
            print(f"  {trait.title()}: {desc}")
    
    # Тестируем совместимость
    print(f"\n💕 Тестируем совместимость личностей:")
    p1 = personality_engine.generate_personality_profile('ArtLovers')
    p2 = personality_engine.generate_personality_profile('ArtLovers')
    
    compatibility = personality_engine.calculate_compatibility_score(p1, p2)
    print(f"  ArtLovers + ArtLovers: {compatibility:.3f}")
    
    p3 = personality_engine.generate_personality_profile('Homebodies')
    compatibility2 = personality_engine.calculate_compatibility_score(p1, p3)
    print(f"  ArtLovers + Homebodies: {compatibility2:.3f}")
    
    # Тестируем привлекательность активностей
    print(f"\n🎯 Тестируем привлекательность активностей:")
    test_activities = [
        (['Театр', 'Культура', 'Искусство'], "театр"),
        (['Экстрим', 'Адреналин', 'Хоррор'], "экстрим"),
        (['Домашний', 'Уютный', 'Спокойный'], "домашнее"),
        (['Фитнес', 'Спорт', 'Здоровье'], "фитнес")
    ]
    
    test_personality = personality_engine.generate_personality_profile('ArtLovers')
    
    for tags, activity_name in test_activities:
        appeal = personality_engine.calculate_activity_appeal(test_personality, tags)
        print(f"  {activity_name}: {appeal:.2f}")
    
    print(f"\n✅ Personality Engine готов к использованию!")

if __name__ == "__main__":
    main()
