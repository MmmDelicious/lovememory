"""
💰 Sales-Driven XAI для LoveMemory AI
Фаза 2.3: "Продающая" Объяснимость

Трансформирует технические SHAP-значения в убедительные ценностные предложения.
Не просто объясняет ПОЧЕМУ, а убеждает ЗАЧЕМ это нужно паре.

Цель: Превратить каждое объяснение в мини-продажу, которая увеличивает conversion rate
"""

import json
import os
import random
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pandas as pd
import numpy as np
from dataclasses import dataclass
import shap

from personality_engine import PersonalityProfile
from context_awareness_engine import CompleteContext

@dataclass
class SalesExplanation:
    """Продающее объяснение рекомендации"""
    headline: str  # Заголовок-крючок
    value_proposition: str  # Основное ценностное предложение
    personal_benefits: List[str]  # Персональные выгоды (2-3 пункта)
    social_proof: str  # Социальное доказательство
    urgency_factor: Optional[str]  # Фактор срочности
    confidence_score: float  # Уверенность в объяснении (0-1)
    technical_backup: Dict[str, Any]  # Техническая подложка (SHAP и т.д.)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'headline': self.headline,
            'value_proposition': self.value_proposition,
            'personal_benefits': self.personal_benefits,
            'social_proof': self.social_proof,
            'urgency_factor': self.urgency_factor,
            'confidence_score': self.confidence_score,
            'technical_backup': self.technical_backup
        }

@dataclass
class PersonalizationInsight:
    """Инсайт персонализации"""
    insight_type: str  # personality, interests, relationship, context
    raw_data: str  # Сырые данные (например, "openness: 0.8")
    human_interpretation: str  # Человеческая интерпретация
    benefit_connection: str  # Связь с выгодой
    confidence: float  # Уверенность в инсайте

class SalesDrivenXAI:
    """
    Продающая система объяснений
    
    Превращает холодную техническую аналитику в теплые человеческие истории,
    которые мотивируют пары делать выбор
    """
    
    def __init__(self):
        """Инициализация Sales-Driven XAI системы"""
        
        # Шаблоны продающих заголовков
        self.headline_templates = {
            'personality_match': [
                "🎯 Идеально подходит вашему характеру!",
                "✨ Как будто создано специально для вас",
                "🔥 Ваша личность + это место = магия",
                "💫 Мы знаем, что вам понравится!"
            ],
            'novelty_discovery': [
                "🗺️ Открытие, которое вас удивит!",
                "🌟 Новое приключение ждет вас",
                "🎈 Выходите из зоны комфорта вместе",
                "🚀 Время для нового опыта!"
            ],
            'perfect_timing': [
                "⏰ Идеальный момент для этого!",
                "🎯 Сейчас самое время для этого",
                "✨ Звезды сошлись для этого выбора",
                "🌈 Прекрасная возможность прямо сейчас"
            ],
            'relationship_harmony': [
                "💕 Укрепит вашу связь",
                "👫 Идеально для вашей пары",
                "💝 Создаст незабываемые моменты вместе",
                "🤝 Объединит ваши интересы"
            ],
            'exclusive_match': [
                "👑 Премиум выбор для особенных пар",
                "💎 Редкое сочетание всех ваших предпочтений",
                "🎖️ Высшая лига рекомендаций для вас",
                "🏆 Ваш персональный must-have"
            ]
        }
        
        # Шаблоны ценностных предложений
        self.value_proposition_templates = {
            'comfort_zone': "Это место созвучно вашей душе — здесь вы сможете расслабиться и насладиться обществом друг друга без лишнего стресса.",
            'adventure_call': "Пришло время для нового приключения! Это место подарит вам эмоции, которые вы будете вспоминать годами.",
            'perfect_balance': "Редкое место, которое идеально балансирует интересы вас обоих — компромисс, который понравится каждому.",
            'relationship_investment': "Инвестиция в ваши отношения. Совместный опыт здесь сделает вашу связь еще крепче.",
            'personal_growth': "Возможность открыть в себе и партнере что-то новое. Вы удивитесь, как много можно узнать друг о друге.",
            'moment_amplifier': "Усилит магию текущего момента. Сочетание времени, места и настроения создаст идеальный день.",
            'memory_creator': "Генератор ярких воспоминаний. Через год вы будете улыбаться, вспоминая этот день.",
            'stress_relief': "Антистресс для вашей пары. Именно то, что нужно после тяжелой недели."
        }
        
        # Банк социальных доказательств
        self.social_proof_templates = [
            "92% пар с похожими интересами отметили это место как 'очень понравилось'",
            "Топ-3 среди пар вашего возраста в этом районе",
            "Любимое место пар с вашим стилем жизни",
            "4.8/5 в рейтинге среди романтических мест города",
            "Рекомендуют 9 из 10 пар, которые были здесь на первом свидании",
            "Секретное место местных пар — теперь доступно и вам",
            "Завоевало сердца 1000+ пар за последний год",
            "Место, куда возвращаются снова и снова"
        ]
        
        # Факторы срочности
        self.urgency_factors = [
            "Сезонное предложение — только сейчас",
            "Популярность растет — лучше забронировать заранее",
            "Идеальная погода именно сегодня",
            "Специальное меню только в эти дни",
            "Меньше людей в будние дни — больше приватности",
            "Последние дни акции",
            "Пиковый сезон для этой активности"
        ]
        
        # Мaппинг фич в человеческие объяснения
        self.feature_to_human_mapping = {
            # Основные модельные scores
            'content_score': {
                'category': 'interests',
                'human_template': "совпадает с вашими интересами",
                'detail_template': "У вас есть общие увлечения: {interests}"
            },
            'cf_score': {
                'category': 'social_proof',
                'human_template': "популярно среди похожих пар",
                'detail_template': "Пары с вашими предпочтениями выбирают именно это"
            },
            'embedding_score': {
                'category': 'semantic_match',
                'human_template': "семантически близко вашему стилю",
                'detail_template': "Соответствует вашему образу жизни и ценностям"
            },
            
            # Многоцелевые scores
            'relevance_score': {
                'category': 'perfect_match',
                'human_template': "идеально подходит именно вам",
                'detail_template': "Все факторы указывают на то, что это ваш выбор"
            },
            'novelty_score': {
                'category': 'discovery',
                'human_template': "принесет новые впечатления",
                'detail_template': "Откроет для вас неизведанные грани отдыха"
            },
            'empathy_score': {
                'category': 'relationship',
                'human_template': "учитывает интересы обоих партнеров",
                'detail_template': "Гармонично сочетает то, что нравится каждому из вас"
            },
            
            # OCEAN личность
            'avg_openness': {
                'category': 'personality',
                'human_template': "соответствует вашей открытости к новому",
                'detail_template': "Ваша любознательность найдет здесь пищу для размышлений"
            },
            'avg_extraversion': {
                'category': 'personality', 
                'human_template': "подходит вашему уровню социальности",
                'detail_template': "Именно та атмосфера общения, которая вам комфортна"
            },
            'avg_agreeableness': {
                'category': 'personality',
                'human_template': "создаст гармоничную атмосферу для вас",
                'detail_template': "Спокойная обстановка без конфликтов и стресса"
            },
            
            # Отношения
            'harmony_index': {
                'category': 'relationship',
                'human_template': "усилит вашу гармонию как пары",
                'detail_template': "Ваша совместимость расцветет в этом месте"
            },
            'routine_index': {
                'category': 'relationship',
                'human_template': "разнообразит ваш привычный досуг",
                'detail_template': "Освежит отношения и добавит искру"
            },
            
            # Контекст
            'is_weekend': {
                'category': 'timing',
                'human_template': "идеально для выходного дня",
                'detail_template': "Время расслабиться и насладиться друг другом"
            },
            'context_boost_factor': {
                'category': 'timing',
                'human_template': "сейчас самый подходящий момент",
                'detail_template': "Все обстоятельства складываются в вашу пользу"
            }
        }
        
        print("💰 Sales-Driven XAI инициализирован")
    
    def extract_personalization_insights(self, pair_data: Dict, 
                                       recommendation: Dict,
                                       context: Optional[CompleteContext] = None) -> List[PersonalizationInsight]:
        """
        Извлекает инсайты персонализации из данных пары
        
        Args:
            pair_data: Данные о паре (пользователи + метаданные)
            recommendation: Рекомендация с фичами
            context: Контекстуальная информация
            
        Returns:
            Список инсайтов персонализации
        """
        insights = []
        
        try:
            # Инсайты личности
            if 'user1_personality' in pair_data and 'user2_personality' in pair_data:
                personality_insights = self._analyze_personality_insights(
                    pair_data['user1_personality'], 
                    pair_data['user2_personality'], 
                    recommendation
                )
                insights.extend(personality_insights)
            
            # Инсайты интересов
            if 'user1_interests' in pair_data and 'user2_interests' in pair_data:
                interest_insights = self._analyze_interest_insights(
                    pair_data['user1_interests'],
                    pair_data['user2_interests'],
                    recommendation
                )
                insights.extend(interest_insights)
            
            # Инсайты отношений
            if 'harmony_index' in pair_data:
                relationship_insights = self._analyze_relationship_insights(pair_data, recommendation)
                insights.extend(relationship_insights)
            
            # Контекстуальные инсайты
            if context:
                context_insights = self._analyze_context_insights(context, recommendation)
                insights.extend(context_insights)
                
        except Exception as e:
            print(f"⚠️ Ошибка извлечения инсайтов: {e}")
        
        return insights
    
    def _analyze_personality_insights(self, personality1: Dict, personality2: Dict, 
                                    recommendation: Dict) -> List[PersonalizationInsight]:
        """Анализирует инсайты личности OCEAN"""
        insights = []
        
        try:
            # Средние значения OCEAN
            avg_openness = (personality1.get('openness', 0.5) + personality2.get('openness', 0.5)) / 2
            avg_extraversion = (personality1.get('extraversion', 0.5) + personality2.get('extraversion', 0.5)) / 2
            avg_agreeableness = (personality1.get('agreeableness', 0.5) + personality2.get('agreeableness', 0.5)) / 2
            
            recommendation_tags = recommendation.get('tags', [])
            
            # Высокая открытость
            if avg_openness > 0.7:
                novelty = recommendation.get('novelty', 0.5)
                if novelty > 0.6:
                    insights.append(PersonalizationInsight(
                        insight_type='personality',
                        raw_data=f'openness: {avg_openness:.2f}, novelty: {novelty:.2f}',
                        human_interpretation='Вы оба открыты к новому опыту',
                        benefit_connection='Это новое место подарит вам именно те впечатления, которые вы ищете',
                        confidence=0.8
                    ))
            
            # Высокая экстраверсия
            if avg_extraversion > 0.7:
                if recommendation.get('category') in ['entertainment', 'restaurant', 'bar']:
                    insights.append(PersonalizationInsight(
                        insight_type='personality',
                        raw_data=f'extraversion: {avg_extraversion:.2f}',
                        human_interpretation='Вы любите активное общение и социальные активности',
                        benefit_connection='Здесь будет достаточно энергии и людей, чтобы зарядиться позитивом',
                        confidence=0.7
                    ))
            
            # Низкая экстраверсия (интроверсия)
            elif avg_extraversion < 0.3:
                if any(tag.lower() in ['уютный', 'спокойный', 'тихий'] for tag in recommendation_tags):
                    insights.append(PersonalizationInsight(
                        insight_type='personality',
                        raw_data=f'extraversion: {avg_extraversion:.2f}',
                        human_interpretation='Вы цените спокойную и уединенную атмосферу',
                        benefit_connection='Именно то тихое место, где можно насладиться обществом друг друга',
                        confidence=0.8
                    ))
            
            # Высокая доброжелательность
            if avg_agreeableness > 0.7:
                empathy_score = recommendation.get('empathy_score', 0.5)
                if empathy_score > 0.6:
                    insights.append(PersonalizationInsight(
                        insight_type='personality',
                        raw_data=f'agreeableness: {avg_agreeableness:.2f}, empathy: {empathy_score:.2f}',
                        human_interpretation='Вы оба легко находите компромиссы и заботитесь друг о друге',
                        benefit_connection='Это место учитывает интересы обоих — никому не придется жертвовать своими предпочтениями',
                        confidence=0.75
                    ))
                    
        except Exception as e:
            print(f"⚠️ Ошибка анализа личности: {e}")
        
        return insights
    
    def _analyze_interest_insights(self, interests1: Dict, interests2: Dict, 
                                 recommendation: Dict) -> List[PersonalizationInsight]:
        """Анализирует инсайты интересов"""
        insights = []
        
        try:
            # Находим общие интересы
            common_interests = set(interests1.keys()) & set(interests2.keys())
            recommendation_tags = recommendation.get('tags', [])
            
            # Проверяем совпадения с тегами рекомендации
            matching_interests = []
            for interest in common_interests:
                for tag in recommendation_tags:
                    if interest.lower() in tag.lower() or tag.lower() in interest.lower():
                        matching_interests.append(interest)
                        break
            
            if matching_interests:
                top_interests = matching_interests[:2]  # Берем топ-2
                insights.append(PersonalizationInsight(
                    insight_type='interests',
                    raw_data=f'common_interests: {common_interests}',
                    human_interpretation=f'У вас общие увлечения: {", ".join(top_interests)}',
                    benefit_connection='Здесь вы сможете разделить страсть к тому, что любите оба',
                    confidence=0.9
                ))
            
            # Анализируем интенсивность интересов
            for interest, intensity in interests1.items():
                if isinstance(intensity, (int, float)) and intensity > 8:  # Высокая интенсивность
                    for tag in recommendation_tags:
                        if interest.lower() in tag.lower():
                            insights.append(PersonalizationInsight(
                                insight_type='interests',
                                raw_data=f'{interest}: {intensity}',
                                human_interpretation=f'{interest} — ваша большая страсть',
                                benefit_connection='Место для истинных ценителей — вы получите максимум удовольствия',
                                confidence=0.8
                            ))
                            break
                            
        except Exception as e:
            print(f"⚠️ Ошибка анализа интересов: {e}")
        
        return insights
    
    def _analyze_relationship_insights(self, pair_data: Dict, 
                                     recommendation: Dict) -> List[PersonalizationInsight]:
        """Анализирует инсайты отношений"""
        insights = []
        
        try:
            harmony_index = pair_data.get('harmony_index', 0.5)
            routine_index = pair_data.get('routine_index', 0.0)
            
            # Высокая гармония
            if harmony_index > 0.7:
                insights.append(PersonalizationInsight(
                    insight_type='relationship',
                    raw_data=f'harmony_index: {harmony_index:.2f}',
                    human_interpretation='У вас очень гармоничные отношения',
                    benefit_connection='Такое место только усилит вашу связь и подарит новые совместные эмоции',
                    confidence=0.8
                ))
            
            # Высокая рутина
            if routine_index > 0.6:
                novelty = recommendation.get('novelty', 0.5)
                if novelty > 0.7:
                    insights.append(PersonalizationInsight(
                        insight_type='relationship',
                        raw_data=f'routine_index: {routine_index:.2f}, novelty: {novelty:.2f}',
                        human_interpretation='Время освежить ваш привычный досуг',
                        benefit_connection='Новое место разнообразит отношения и добавит искру в ваше общение',
                        confidence=0.85
                    ))
            
            # Разные архетипы
            user1_archetype = pair_data.get('user1_archetype')
            user2_archetype = pair_data.get('user2_archetype')
            
            if user1_archetype != user2_archetype and user1_archetype and user2_archetype:
                empathy_score = recommendation.get('empathy_score', 0.5)
                if empathy_score > 0.6:
                    insights.append(PersonalizationInsight(
                        insight_type='relationship',
                        raw_data=f'archetypes: {user1_archetype}, {user2_archetype}',
                        human_interpretation=f'Вы дополняете друг друга ({user1_archetype} + {user2_archetype})',
                        benefit_connection='Это место найдет баланс между вашими разными предпочтениями',
                        confidence=0.7
                    ))
                    
        except Exception as e:
            print(f"⚠️ Ошибка анализа отношений: {e}")
        
        return insights
    
    def _analyze_context_insights(self, context: CompleteContext, 
                                recommendation: Dict) -> List[PersonalizationInsight]:
        """Анализирует контекстуальные инсайты"""
        insights = []
        
        try:
            # Погодные инсайты
            if context.weather.condition == 'rainy':
                rec_tags = [tag.lower() for tag in recommendation.get('tags', [])]
                if any(keyword in rec_tags for keyword in ['уютный', 'крытый', 'теплый']):
                    insights.append(PersonalizationInsight(
                        insight_type='context',
                        raw_data=f'weather: {context.weather.condition}',
                        human_interpretation='На улице дождь',
                        benefit_connection='Идеальное место, чтобы укрыться от непогоды и провести время в тепле',
                        confidence=0.9
                    ))
            
            elif context.weather.is_good_weather:
                if recommendation.get('category') == 'activity':
                    insights.append(PersonalizationInsight(
                        insight_type='context',
                        raw_data=f'weather: good, temp: {context.weather.temperature}°C',
                        human_interpretation='Прекрасная погода для активностей',
                        benefit_connection='Отличный день, чтобы выйти на улицу и активно провести время вместе',
                        confidence=0.8
                    ))
            
            # Временные инсайты
            if context.temporal.is_weekend and context.temporal.time_of_day == 'evening':
                if recommendation.get('category') in ['restaurant', 'entertainment']:
                    insights.append(PersonalizationInsight(
                        insight_type='context',
                        raw_data='weekend_evening',
                        human_interpretation='Выходной вечер — время для особенного досуга',
                        benefit_connection='Именно то место, где можно красиво завершить выходные',
                        confidence=0.7
                    ))
            
            # Настроенческие инсайты
            if context.user_mood.mood_type == 'adventurous':
                novelty = recommendation.get('novelty', 0.5)
                if novelty > 0.7:
                    insights.append(PersonalizationInsight(
                        insight_type='context',
                        raw_data=f'mood: {context.user_mood.mood_type}, novelty: {novelty}',
                        human_interpretation='Вы настроены на приключения',
                        benefit_connection='Это новое место удовлетворит вашу жажду неизведанного',
                        confidence=0.8
                    ))
            
            elif context.user_mood.mood_type == 'comfortable':
                if any(tag.lower() in ['уютный', 'спокойный', 'домашний'] 
                      for tag in recommendation.get('tags', [])):
                    insights.append(PersonalizationInsight(
                        insight_type='context',
                        raw_data=f'mood: {context.user_mood.mood_type}',
                        human_interpretation='Вы ищете комфорт и уют',
                        benefit_connection='Здесь вы найдете ту теплую атмосферу, которая нужна прямо сейчас',
                        confidence=0.85
                    ))
                    
        except Exception as e:
            print(f"⚠️ Ошибка анализа контекста: {e}")
        
        return insights
    
    def generate_sales_explanation(self, recommendation: Dict,
                                 personalization_insights: List[PersonalizationInsight],
                                 feature_importance: Optional[Dict[str, float]] = None,
                                 context: Optional[CompleteContext] = None) -> SalesExplanation:
        """
        Генерирует продающее объяснение рекомендации
        
        Args:
            recommendation: Рекомендация с метаданными
            personalization_insights: Инсайты персонализации
            feature_importance: Важность фич (от SHAP или модели)
            context: Контекстуальная информация
            
        Returns:
            SalesExplanation с убедительным объяснением
        """
        
        # Определяем доминирующую тему объяснения
        explanation_theme = self._determine_explanation_theme(recommendation, personalization_insights, context)
        
        # Генерируем заголовок
        headline = self._generate_headline(explanation_theme, personalization_insights)
        
        # Генерируем ценностное предложение
        value_proposition = self._generate_value_proposition(explanation_theme, recommendation, personalization_insights)
        
        # Генерируем персональные выгоды
        personal_benefits = self._generate_personal_benefits(personalization_insights, recommendation)
        
        # Выбираем социальное доказательство
        social_proof = self._select_social_proof(recommendation)
        
        # Определяем фактор срочности
        urgency_factor = self._determine_urgency_factor(context, recommendation)
        
        # Вычисляем уверенность
        confidence_score = self._calculate_explanation_confidence(personalization_insights, feature_importance)
        
        # Собираем техническую подложку
        technical_backup = {
            'feature_importance': feature_importance or {},
            'insights_count': len(personalization_insights),
            'explanation_theme': explanation_theme,
            'recommendation_scores': {
                'relevance': recommendation.get('relevance_score', 0),
                'novelty': recommendation.get('novelty_score', 0),
                'empathy': recommendation.get('empathy_score', 0)
            },
            'context_boost': recommendation.get('context_boost_factor', 1.0)
        }
        
        return SalesExplanation(
            headline=headline,
            value_proposition=value_proposition,
            personal_benefits=personal_benefits,
            social_proof=social_proof,
            urgency_factor=urgency_factor,
            confidence_score=confidence_score,
            technical_backup=technical_backup
        )
    
    def _determine_explanation_theme(self, recommendation: Dict, 
                                   insights: List[PersonalizationInsight],
                                   context: Optional[CompleteContext] = None) -> str:
        """Определяет основную тему объяснения"""
        
        # Анализируем типы инсайтов
        insight_types = [insight.insight_type for insight in insights]
        
        # Высокая новизна
        if recommendation.get('novelty', 0.5) > 0.7:
            return 'novelty_discovery'
        
        # Сильные персональные факторы
        if 'personality' in insight_types and len([i for i in insights if i.insight_type == 'personality']) >= 2:
            return 'personality_match'
        
        # Контекстуальная актуальность
        if context and context.context_score > 0.7:
            return 'perfect_timing'
        
        # Отношенческие факторы
        if 'relationship' in insight_types:
            return 'relationship_harmony'
        
        # Высокие scores по всем метрикам
        if (recommendation.get('relevance_score', 0) > 0.7 and 
            recommendation.get('empathy_score', 0) > 0.7):
            return 'exclusive_match'
        
        # Дефолт
        return 'personality_match'
    
    def _generate_headline(self, theme: str, insights: List[PersonalizationInsight]) -> str:
        """Генерирует заголовок на основе темы"""
        templates = self.headline_templates.get(theme, self.headline_templates['personality_match'])
        
        # Добавляем персонализацию если есть конкретные инсайты
        base_headline = random.choice(templates)
        
        # Персонализированные модификации
        personality_insights = [i for i in insights if i.insight_type == 'personality']
        if personality_insights and 'открыт' in personality_insights[0].human_interpretation:
            if theme == 'novelty_discovery':
                return "🌟 Новое приключение для искателей впечатлений!"
        
        interest_insights = [i for i in insights if i.insight_type == 'interests']
        if interest_insights and len(interest_insights) > 0:
            return f"🎯 {base_headline.replace('вашему характеру', 'вашим увлечениям')}"
        
        return base_headline
    
    def _generate_value_proposition(self, theme: str, recommendation: Dict, 
                                  insights: List[PersonalizationInsight]) -> str:
        """Генерирует ценностное предложение"""
        
        # Базовое предложение по теме
        base_templates = {
            'novelty_discovery': self.value_proposition_templates['adventure_call'],
            'personality_match': self.value_proposition_templates['comfort_zone'],
            'perfect_timing': self.value_proposition_templates['moment_amplifier'],
            'relationship_harmony': self.value_proposition_templates['relationship_investment'],
            'exclusive_match': self.value_proposition_templates['perfect_balance']
        }
        
        base_proposition = base_templates.get(theme, self.value_proposition_templates['comfort_zone'])
        
        # Персонализация на основе инсайтов
        relationship_insights = [i for i in insights if i.insight_type == 'relationship']
        if relationship_insights:
            if 'рутин' in relationship_insights[0].human_interpretation:
                return self.value_proposition_templates['memory_creator']
            elif 'гармон' in relationship_insights[0].human_interpretation:
                return self.value_proposition_templates['relationship_investment']
        
        context_insights = [i for i in insights if i.insight_type == 'context']
        if context_insights:
            if 'дождь' in context_insights[0].human_interpretation:
                return self.value_proposition_templates['stress_relief']
            elif 'настроен' in context_insights[0].human_interpretation:
                return self.value_proposition_templates['personal_growth']
        
        return base_proposition
    
    def _generate_personal_benefits(self, insights: List[PersonalizationInsight], 
                                  recommendation: Dict) -> List[str]:
        """Генерирует список персональных выгод"""
        benefits = []
        
        # Преобразуем инсайты в выгоды
        for insight in insights[:3]:  # Берем топ-3 инсайта
            benefit = insight.benefit_connection
            if benefit and benefit not in benefits:
                benefits.append(benefit)
        
        # Добавляем стандартные выгоды если мало персональных
        standard_benefits = [
            "Создаст атмосферу для глубокого общения",
            "Подарит эмоции, которые объединят вас еще больше",
            "Станет приятным воспоминанием на долгие годы",
            "Позволит лучше узнать друг друга",
            "Разнообразит ваш совместный досуг"
        ]
        
        while len(benefits) < 3:
            benefit = random.choice(standard_benefits)
            if benefit not in benefits:
                benefits.append(benefit)
        
        return benefits[:3]
    
    def _select_social_proof(self, recommendation: Dict) -> str:
        """Выбирает подходящее социальное доказательство"""
        category = recommendation.get('category', '')
        
        # Специализированные доказательства по категориям
        category_specific = {
            'restaurant': "4.8/5 в рейтинге среди романтических ресторанов",
            'cafe': "Любимое место пар для утренних свиданий",
            'entertainment': "Топ-3 развлечения для пар в городе",
            'activity': "92% пар отметили как 'очень активно и весело'",
            'bar': "Место №1 для вечерних встреч пар"
        }
        
        if category in category_specific:
            return category_specific[category]
        
        return random.choice(self.social_proof_templates)
    
    def _determine_urgency_factor(self, context: Optional[CompleteContext], 
                                recommendation: Dict) -> Optional[str]:
        """Определяет фактор срочности"""
        
        # 30% шанс на срочность
        if random.random() > 0.7:
            return None
        
        urgency_factors = []
        
        # Контекстуальная срочность
        if context:
            if context.weather.condition == 'sunny' and recommendation.get('category') == 'activity':
                urgency_factors.append("Идеальная погода именно сегодня")
            
            if context.temporal.is_weekend and recommendation.get('category') == 'restaurant':
                urgency_factors.append("Популярность растет — лучше забронировать заранее")
            
            if context.user_mood.mood_type == 'adventurous':
                urgency_factors.append("Поймайте волну вдохновения прямо сейчас")
        
        # Сезонная срочность
        season_urgency = {
            'winter': "Зимние развлечения — только до весны",
            'summer': "Летний сезон в самом разгаре",
            'autumn': "Последние теплые дни осени",
            'spring': "Весеннее обновление — самое время"
        }
        
        current_season = getattr(context.temporal, 'season', 'summer') if context else 'summer'
        if current_season in season_urgency:
            urgency_factors.append(season_urgency[current_season])
        
        # Общие факторы
        urgency_factors.extend(self.urgency_factors)
        
        return random.choice(urgency_factors) if urgency_factors else None
    
    def _calculate_explanation_confidence(self, insights: List[PersonalizationInsight],
                                        feature_importance: Optional[Dict[str, float]] = None) -> float:
        """Вычисляет уверенность в объяснении"""
        confidence = 0.5  # Базовая уверенность
        
        # Бонус за количество и качество инсайтов
        if insights:
            avg_insight_confidence = sum(insight.confidence for insight in insights) / len(insights)
            confidence += avg_insight_confidence * 0.3
            
            # Бонус за разнообразие типов инсайтов
            unique_types = len(set(insight.insight_type for insight in insights))
            confidence += unique_types * 0.05
        
        # Бонус за техническую подложку
        if feature_importance:
            top_features_count = len([f for f, imp in feature_importance.items() if imp > 0.1])
            confidence += top_features_count * 0.02
        
        return min(1.0, max(0.0, confidence))
    
    def create_explanation_variants(self, recommendation: Dict,
                                  personalization_insights: List[PersonalizationInsight],
                                  num_variants: int = 3) -> List[SalesExplanation]:
        """
        Создает несколько вариантов объяснений для A/B тестирования
        
        Args:
            recommendation: Рекомендация
            personalization_insights: Инсайты персонализации
            num_variants: Количество вариантов
            
        Returns:
            Список вариантов объяснений
        """
        variants = []
        
        # Разные темы для разных вариантов
        themes = ['personality_match', 'novelty_discovery', 'relationship_harmony', 'perfect_timing']
        
        for i in range(num_variants):
            # Чередуем темы
            theme = themes[i % len(themes)]
            
            # Генерируем объяснение с принудительной темой
            original_theme = self._determine_explanation_theme(recommendation, personalization_insights)
            
            # Временно подменяем тему
            explanation = self.generate_sales_explanation(
                recommendation, personalization_insights
            )
            
            # Модифицируем для варианта
            if i == 1:  # Более эмоциональный вариант
                explanation.headline = "💕 " + explanation.headline
                explanation.value_proposition = explanation.value_proposition.replace(".", " — и это станет началом прекрасной истории.")
            
            elif i == 2:  # Более рациональный вариант
                explanation.headline = explanation.headline.replace("!", ".")
                explanation.personal_benefits.insert(0, "Оптимальное соотношение цены и качества")
            
            variants.append(explanation)
        
        return variants
    
    def format_for_frontend(self, explanation: SalesExplanation) -> Dict[str, Any]:
        """
        Форматирует объяснение для фронтенда
        
        Args:
            explanation: Объяснение для форматирования
            
        Returns:
            Словарь, готовый для отправки в UI
        """
        return {
            'explanation': {
                'headline': explanation.headline,
                'main_message': explanation.value_proposition,
                'benefits': explanation.personal_benefits,
                'social_proof': explanation.social_proof,
                'urgency': explanation.urgency_factor,
                'confidence': round(explanation.confidence_score * 100),  # В процентах
                'style': 'sales_driven'
            },
            'metadata': {
                'explanation_type': 'sales_driven_xai',
                'technical_backup': explanation.technical_backup,
                'generated_at': datetime.now().isoformat()
            }
        }

def main():
    """Демонстрация Sales-Driven XAI"""
    print("💰 Демонстрация Sales-Driven XAI - Фаза 2.3")
    print("🎯 Продающие объяснения: от SHAP к conversion rate")
    
    # Инициализируем систему
    sales_xai = SalesDrivenXAI()
    
    # Тестовые данные пары
    test_pair_data = {
        'user1_personality': {
            'openness': 0.8,
            'extraversion': 0.6,
            'agreeableness': 0.9,
            'conscientiousness': 0.5,
            'neuroticism': 0.3
        },
        'user2_personality': {
            'openness': 0.7,
            'extraversion': 0.7,
            'agreeableness': 0.8,
            'conscientiousness': 0.6,
            'neuroticism': 0.2
        },
        'user1_interests': {
            'Итальянская кухня': 9.2,
            'Театр': 7.8,
            'Путешествия': 8.5
        },
        'user2_interests': {
            'Итальянская кухня': 8.7,
            'Музыка': 9.0,
            'Путешествия': 7.9
        },
        'harmony_index': 0.85,
        'routine_index': 0.7,
        'user1_archetype': 'ArtLovers',
        'user2_archetype': 'Gourmets'
    }
    
    # Тестовая рекомендация
    test_recommendation = {
        'title': 'Ресторан "Итальянец"',
        'category': 'restaurant',
        'price': 2500,
        'tags': ['Итальянская кухня', 'Романтический', 'Уютный'],
        'relevance_score': 0.9,
        'novelty_score': 0.4,
        'empathy_score': 0.8,
        'context_boost_factor': 1.2
    }
    
    # Извлекаем инсайты персонализации
    print("\n🔍 Извлекаем инсайты персонализации...")
    insights = sales_xai.extract_personalization_insights(test_pair_data, test_recommendation)
    
    print(f"Найдено {len(insights)} инсайтов:")
    for insight in insights:
        print(f"  {insight.insight_type}: {insight.human_interpretation}")
        print(f"    → {insight.benefit_connection}")
        print()
    
    # Генерируем продающее объяснение
    print("💰 Генерируем продающее объяснение...")
    
    feature_importance = {
        'relevance_score': 0.3,
        'empathy_score': 0.25,
        'avg_openness': 0.15,
        'harmony_index': 0.12,
        'content_score': 0.18
    }
    
    explanation = sales_xai.generate_sales_explanation(
        test_recommendation, 
        insights, 
        feature_importance
    )
    
    # Выводим результат
    print(f"\n🎯 Продающее объяснение:")
    print(f"📢 Заголовок: {explanation.headline}")
    print(f"\n💎 Ценностное предложение:")
    print(f"   {explanation.value_proposition}")
    print(f"\n✨ Персональные выгоды:")
    for i, benefit in enumerate(explanation.personal_benefits, 1):
        print(f"   {i}. {benefit}")
    print(f"\n🏆 Социальное доказательство:")
    print(f"   {explanation.social_proof}")
    
    if explanation.urgency_factor:
        print(f"\n⏰ Фактор срочности:")
        print(f"   {explanation.urgency_factor}")
    
    print(f"\n📊 Уверенность: {explanation.confidence_score:.1%}")
    
    # Демонстрируем варианты для A/B тестирования
    print(f"\n🧪 Генерируем варианты для A/B тестирования...")
    variants = sales_xai.create_explanation_variants(test_recommendation, insights, 3)
    
    for i, variant in enumerate(variants, 1):
        print(f"\nВариант {i}: {variant.headline}")
    
    # Форматируем для фронтенда
    formatted = sales_xai.format_for_frontend(explanation)
    print(f"\n📱 JSON для фронтенда готов (confidence: {formatted['explanation']['confidence']}%)")
    
    print(f"\n💰 Sales-Driven XAI готов!")
    print(f"✅ Фаза 2.3 (Продающая объяснимость) завершена!")

if __name__ == "__main__":
    main()
