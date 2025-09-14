"""
🧪 Comprehensive Test Suite для LoveMemory AI Commercial Grade System
Тестирует все новые компоненты из фаз 1-3:

Фаза 1: Фундамент
- Personality Engine (OCEAN)
- Enhanced Synthetic Generator
- Dynamic Interests & Relationship Dynamics

Фаза 2: Интеллект  
- Multi-Objective Ranker
- Context Awareness Engine
- Sales-Driven XAI

Фаза 3: Продукт
- Shared Memory Bank
- Multi-Step Scenarios Engine
"""

import unittest
import tempfile
import os
import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
import shutil

# Импорты тестируемых модулей
from personality_engine import PersonalityEngine, PersonalityProfile
from enhanced_synthetic_generator import EnhancedSyntheticGenerator
from multi_objective_ranker import MultiObjectiveRanker, MultiObjectiveScore
from context_awareness_engine import ContextAwarenessEngine, CompleteContext, WeatherContext, TemporalContext
from sales_driven_xai import SalesDrivenXAI, SalesExplanation, PersonalizationInsight
from shared_memory_bank import SharedMemoryBank, SharedMemory
from multi_step_scenarios import MultiStepScenariosEngine, ScenarioType, MultiStepScenario

class TestPersonalityEngine(unittest.TestCase):
    """Тесты для OCEAN модели личности"""
    
    def setUp(self):
        self.engine = PersonalityEngine()
    
    def test_generate_personality_profile(self):
        """Тест генерации профиля личности"""
        # Без архетипа
        personality = self.engine.generate_personality_profile()
        
        self.assertIsInstance(personality, PersonalityProfile)
        self.assertGreaterEqual(personality.openness, 0)
        self.assertLessEqual(personality.openness, 1)
        self.assertGreaterEqual(personality.conscientiousness, 0)
        self.assertLessEqual(personality.conscientiousness, 1)
        
        # С архетипом
        art_personality = self.engine.generate_personality_profile('ArtLovers')
        self.assertGreater(art_personality.openness, 0.5)  # ArtLovers должны быть открытыми
    
    def test_calculate_activity_appeal(self):
        """Тест расчета привлекательности активности"""
        personality = PersonalityProfile(
            openness=0.9, conscientiousness=0.5, extraversion=0.8,
            agreeableness=0.7, neuroticism=0.2
        )
        
        # Активность для открытых людей
        art_tags = ['Живопись', 'Творчество', 'Новый опыт']
        appeal = self.engine.calculate_activity_appeal(personality, art_tags)
        self.assertGreater(appeal, 1.0)  # Должна быть привлекательной
        
        # Стрессовая активность для высокого невротизма
        stress_personality = PersonalityProfile(
            openness=0.5, conscientiousness=0.5, extraversion=0.5,
            agreeableness=0.5, neuroticism=0.9
        )
        stress_tags = ['Экстрим', 'Адреналин', 'Хоррор']
        stress_appeal = self.engine.calculate_activity_appeal(stress_personality, stress_tags)
        self.assertLess(stress_appeal, 1.0)  # Должна быть непривлекательной
    
    def test_calculate_compatibility_score(self):
        """Тест расчета совместимости личностей"""
        # Схожие личности
        person1 = PersonalityProfile(0.8, 0.7, 0.6, 0.9, 0.2)
        person2 = PersonalityProfile(0.7, 0.8, 0.5, 0.8, 0.3)
        
        compatibility = self.engine.calculate_compatibility_score(person1, person2)
        self.assertGreater(compatibility, 0.5)
        self.assertLessEqual(compatibility, 1.0)
        
        # Противоположные личности
        person3 = PersonalityProfile(0.1, 0.2, 0.1, 0.2, 0.9)
        low_compatibility = self.engine.calculate_compatibility_score(person1, person3)
        self.assertLess(low_compatibility, compatibility)
    
    def test_personality_description(self):
        """Тест генерации описания личности"""
        personality = PersonalityProfile(0.9, 0.2, 0.1, 0.8, 0.7)
        description = self.engine.get_personality_description(personality)
        
        self.assertIn('openness', description)
        self.assertIn('conscientiousness', description)
        self.assertIn('extraversion', description)
        self.assertIn('agreeableness', description)
        self.assertIn('neuroticism', description)
        
        # Проверяем, что описания соответствуют значениям
        self.assertIn('открыт', description['openness'].lower())  # Высокая открытость
        self.assertIn('интроверт', description['extraversion'].lower())  # Низкая экстраверсия

class TestEnhancedSyntheticGenerator(unittest.TestCase):
    """Тесты для улучшенного генератора данных"""
    
    def setUp(self):
        self.generator = EnhancedSyntheticGenerator()
    
    def test_generate_enhanced_user(self):
        """Тест генерации улучшенного пользователя"""
        user = self.generator.generate_enhanced_user('ArtLovers')
        
        # Базовые поля
        self.assertIn('id', user)
        self.assertIn('age', user)
        self.assertIn('archetype', user)
        
        # OCEAN личность
        self.assertIn('personality', user)
        self.assertIn('personality_description', user)
        
        # Динамические интересы
        self.assertIn('dynamic_interests', user)
        dynamic_interests = user['dynamic_interests']
        self.assertGreater(len(dynamic_interests), 0)
        
        # Проверяем структуру динамических интересов
        first_interest = list(dynamic_interests.values())[0]
        self.assertIn('intensity', first_interest)
        self.assertIn('passion_score', first_interest)
        self.assertIn('decay_rate', first_interest)
        
        # Версия
        self.assertEqual(user['version'], '2.0_enhanced')
    
    def test_generate_enhanced_pair(self):
        """Тест генерации улучшенной пары"""
        user1, user2, pair = self.generator.generate_enhanced_pair()
        
        # Проверяем пользователей
        self.assertIn('personality', user1)
        self.assertIn('personality', user2)
        
        # Проверяем пару
        self.assertIn('harmony_index', pair)
        self.assertIn('personality_compatibility', pair)
        self.assertIn('relationship_state', pair)
        
        # Гармония должна быть в пределах 0-1
        self.assertGreaterEqual(pair['harmony_index'], 0)
        self.assertLessEqual(pair['harmony_index'], 1)
    
    def test_calculate_ultra_realistic_rating(self):
        """Тест ультрареалистичного расчета рейтинга"""
        user = self.generator.generate_enhanced_user('Gourmets')
        
        # Продукт, соответствующий интересам
        product = {
            'title': 'Ресторан итальянской кухни',
            'category': 'restaurant',
            'price': 2000,
            'tags': ['Итальянская кухня', 'Романтический'],
            'love_language': 'quality_time',
            'novelty': 0.5
        }
        
        rating = self.generator.calculate_ultra_realistic_rating(user, product)
        
        self.assertGreaterEqual(rating, 1.0)
        self.assertLessEqual(rating, 10.0)
        self.assertIsInstance(rating, float)
    
    def test_enhanced_dataset_generation(self):
        """Тест генерации улучшенного датасета"""
        # Генерируем маленький датасет для теста
        dataset = self.generator.generate_enhanced_dataset(num_pairs=5)
        
        self.assertIn('users', dataset)
        self.assertIn('pairs', dataset)
        self.assertIn('interactions', dataset)
        self.assertIn('product_catalog', dataset)
        self.assertIn('metadata', dataset)
        
        # Проверяем количества
        self.assertEqual(len(dataset['users']), 10)  # 5 пар = 10 пользователей
        self.assertEqual(len(dataset['pairs']), 5)
        
        # Проверяем метаданные
        metadata = dataset['metadata']
        self.assertEqual(metadata['version'], '2.0_enhanced')
        self.assertIn('personality_model', metadata)
        self.assertEqual(metadata['personality_model'], 'OCEAN_Big_Five')

class TestMultiObjectiveRanker(unittest.TestCase):
    """Тесты для многоцелевого ранкера"""
    
    def setUp(self):
        # Создаем временную директорию для тестов
        self.test_dir = tempfile.mkdtemp()
        
        # Мокаем компоненты
        with patch('multi_objective_ranker.ContentBasedRecommender'), \
             patch('multi_objective_ranker.CollaborativeFilteringRecommender'), \
             patch('multi_objective_ranker.EmbeddingService'):
            self.ranker = MultiObjectiveRanker(self.test_dir)
    
    def tearDown(self):
        shutil.rmtree(self.test_dir)
    
    def test_calculate_relevance_score(self):
        """Тест расчета релевантности"""
        candidate_scores = {
            'content_score': 0.8,
            'cf_score': 0.7,
            'embedding_score': 0.6
        }
        
        relevance = self.ranker.calculate_relevance_score(
            'pair_123', {'price': 2000}, candidate_scores
        )
        
        self.assertGreaterEqual(relevance, 0)
        self.assertLessEqual(relevance, 1)
        self.assertIsInstance(relevance, float)
    
    def test_calculate_novelty_score(self):
        """Тест расчета новизны"""
        item_info = {
            'title': 'Новое место',
            'category': 'restaurant',
            'novelty': 0.8,
            'tags': ['Новый', 'Экспериментальный']
        }
        
        novelty = self.ranker.calculate_novelty_score('pair_123', item_info)
        
        self.assertGreaterEqual(novelty, 0)
        self.assertLessEqual(novelty, 1)
        # Новое место должно иметь высокую новизну
        self.assertGreater(novelty, 0.5)
    
    def test_calculate_empathy_score(self):
        """Тест расчета эмпатии"""
        item_info = {
            'title': 'Семейный ресторан',
            'category': 'restaurant',
            'tags': ['Семейный', 'Уютный'],
            'love_language': 'quality_time'
        }
        
        empathy = self.ranker.calculate_empathy_score('pair_123', item_info)
        
        self.assertGreaterEqual(empathy, 0)
        self.assertLessEqual(empathy, 1)
        self.assertIsInstance(empathy, float)
    
    def test_calculate_multi_objective_score(self):
        """Тест расчета многоцелевой оценки"""
        item_info = {
            'title': 'Тестовое место',
            'category': 'restaurant',
            'price': 2000,
            'tags': ['Романтический'],
            'love_language': 'quality_time',
            'novelty': 0.6
        }
        
        candidate_scores = {
            'content_score': 0.8,
            'cf_score': 0.7,
            'embedding_score': 0.6
        }
        
        multi_score = self.ranker.calculate_multi_objective_score(
            'pair_123', item_info, candidate_scores
        )
        
        self.assertIsInstance(multi_score, MultiObjectiveScore)
        self.assertGreaterEqual(multi_score.relevance, 0)
        self.assertLessEqual(multi_score.relevance, 1)
        self.assertGreaterEqual(multi_score.novelty, 0)
        self.assertLessEqual(multi_score.novelty, 1)
        self.assertGreaterEqual(multi_score.empathy, 0)
        self.assertLessEqual(multi_score.empathy, 1)
        self.assertGreaterEqual(multi_score.combined, 0)
        self.assertLessEqual(multi_score.combined, 1)

class TestContextAwarenessEngine(unittest.TestCase):
    """Тесты для движка контекстуальной осведомленности"""
    
    def setUp(self):
        self.engine = ContextAwarenessEngine()
    
    def test_get_temporal_context(self):
        """Тест получения временного контекста"""
        # Тест с конкретным временем
        test_time = datetime(2024, 7, 15, 14, 30)  # Понедельник, лето, день
        context = self.engine.get_temporal_context(test_time)
        
        self.assertEqual(context.hour, 14)
        self.assertEqual(context.season, 'summer')
        self.assertEqual(context.time_of_day, 'afternoon')
        self.assertFalse(context.is_weekend)
        
        # Тест с выходным днем
        weekend_time = datetime(2024, 7, 20, 19, 0)  # Суббота, вечер
        weekend_context = self.engine.get_temporal_context(weekend_time)
        
        self.assertTrue(weekend_context.is_weekend)
        self.assertEqual(weekend_context.time_of_day, 'evening')
    
    def test_detect_user_mood(self):
        """Тест детектора настроения"""
        # Активность указывающая на приключения
        adventurous_activity = [
            {'action': 'recommendation_shown', 'product_category': 'activity'},
            {'action': 'viewed', 'product_category': 'adventure', 'price': 2000}
        ]
        
        session_data = {
            'duration_minutes': 20,
            'items_viewed': 15,
            'categories_searched': ['adventure', 'activity']
        }
        
        mood = self.engine.detect_user_mood(adventurous_activity, session_data)
        
        self.assertIn(mood.mood_type, ['adventurous', 'comfortable', 'social', 'romantic', 'budget_conscious'])
        self.assertGreaterEqual(mood.confidence, 0)
        self.assertLessEqual(mood.confidence, 1)
        self.assertIsInstance(mood.mood_factors, list)
    
    def test_get_complete_context(self):
        """Тест получения полного контекста"""
        context = self.engine.get_complete_context()
        
        self.assertIsInstance(context, CompleteContext)
        self.assertIsInstance(context.weather, WeatherContext)
        self.assertIsInstance(context.temporal, TemporalContext)
        self.assertGreaterEqual(context.context_score, 0)
        self.assertLessEqual(context.context_score, 1)
    
    def test_apply_context_filters(self):
        """Тест применения контекстуальных фильтров"""
        recommendations = [
            {
                'title': 'Летняя терраса',
                'category': 'restaurant',
                'price': 2000,
                'tags': ['Открытый', 'Терраса'],
                'final_score': 0.8
            },
            {
                'title': 'Уютное кафе',
                'category': 'cafe',
                'price': 800,
                'tags': ['Уютный', 'Крытый'],
                'final_score': 0.7
            }
        ]
        
        # Создаем контекст с хорошей погодой
        good_weather_context = CompleteContext(
            weather=WeatherContext(25, 'sunny', 0.5, 5, 24, True),
            temporal=TemporalContext(14, 1, 15, 7, 'summer', False, False, 'afternoon', True),
            user_mood=self.engine.detect_user_mood([], {}),
            local_events=self.engine.get_local_events_context(),
            context_score=0.8
        )
        
        enhanced_recs = self.engine.apply_context_filters(recommendations, good_weather_context)
        
        self.assertEqual(len(enhanced_recs), 2)
        for rec in enhanced_recs:
            self.assertIn('context_boosted_score', rec)
            self.assertIn('context_boost_factor', rec)
            self.assertIn('context_reasons', rec)

class TestSalesDrivenXAI(unittest.TestCase):
    """Тесты для продающих объяснений"""
    
    def setUp(self):
        self.xai = SalesDrivenXAI()
    
    def test_extract_personalization_insights(self):
        """Тест извлечения инсайтов персонализации"""
        pair_data = {
            'user1_personality': {
                'openness': 0.9,
                'extraversion': 0.7,
                'agreeableness': 0.8,
                'conscientiousness': 0.5,
                'neuroticism': 0.3
            },
            'user2_personality': {
                'openness': 0.8,
                'extraversion': 0.6,
                'agreeableness': 0.9,
                'conscientiousness': 0.6,
                'neuroticism': 0.2
            },
            'user1_interests': {'Искусство': 9.0, 'Театр': 8.5},
            'user2_interests': {'Искусство': 8.5, 'Музыка': 9.0},
            'harmony_index': 0.85
        }
        
        recommendation = {
            'title': 'Театр современного искусства',
            'category': 'entertainment',
            'price': 1800,
            'tags': ['Искусство', 'Театр', 'Культура'],
            'novelty': 0.7
        }
        
        insights = self.xai.extract_personalization_insights(pair_data, recommendation)
        
        self.assertIsInstance(insights, list)
        self.assertGreater(len(insights), 0)
        
        # Проверяем структуру инсайтов
        first_insight = insights[0]
        self.assertIsInstance(first_insight, PersonalizationInsight)
        self.assertIn(first_insight.insight_type, ['personality', 'interests', 'relationship', 'context'])
    
    def test_generate_sales_explanation(self):
        """Тест генерации продающего объяснения"""
        recommendation = {
            'title': 'Романтический ресторан',
            'category': 'restaurant',
            'price': 2500,
            'tags': ['Романтический', 'Изысканный'],
            'relevance_score': 0.9,
            'novelty_score': 0.4,
            'empathy_score': 0.8
        }
        
        insights = [
            PersonalizationInsight(
                insight_type='personality',
                raw_data='openness: 0.8',
                human_interpretation='Вы открыты к новому',
                benefit_connection='Это место подарит новые впечатления',
                confidence=0.8
            )
        ]
        
        explanation = self.xai.generate_sales_explanation(recommendation, insights)
        
        self.assertIsInstance(explanation, SalesExplanation)
        self.assertIsInstance(explanation.headline, str)
        self.assertGreater(len(explanation.headline), 10)
        self.assertIsInstance(explanation.personal_benefits, list)
        self.assertGreaterEqual(len(explanation.personal_benefits), 1)
        self.assertGreaterEqual(explanation.confidence_score, 0)
        self.assertLessEqual(explanation.confidence_score, 1)
    
    def test_create_explanation_variants(self):
        """Тест создания вариантов объяснений"""
        recommendation = {
            'title': 'Кафе',
            'category': 'cafe',
            'price': 800,
            'tags': ['Уютный'],
            'relevance_score': 0.7
        }
        
        insights = []
        variants = self.xai.create_explanation_variants(recommendation, insights, 3)
        
        self.assertEqual(len(variants), 3)
        for variant in variants:
            self.assertIsInstance(variant, SalesExplanation)
    
    def test_format_for_frontend(self):
        """Тест форматирования для фронтенда"""
        explanation = SalesExplanation(
            headline="Тестовый заголовок",
            value_proposition="Тестовое предложение",
            personal_benefits=["Выгода 1", "Выгода 2"],
            social_proof="Социальное доказательство",
            urgency_factor="Срочность",
            confidence_score=0.85,
            technical_backup={}
        )
        
        formatted = self.xai.format_for_frontend(explanation)
        
        self.assertIn('explanation', formatted)
        self.assertIn('metadata', formatted)
        self.assertEqual(formatted['explanation']['confidence'], 85)

class TestSharedMemoryBank(unittest.TestCase):
    """Тесты для банка воспоминаний"""
    
    def setUp(self):
        # Создаем временную БД для тестов
        self.test_db = tempfile.mktemp(suffix='.db')
        self.memory_bank = SharedMemoryBank(self.test_db)
    
    def tearDown(self):
        if os.path.exists(self.test_db):
            os.remove(self.test_db)
    
    def test_save_memory(self):
        """Тест сохранения воспоминания"""
        memory = self.memory_bank.save_memory(
            pair_id='test_pair',
            recommendation_id='rec_001',
            place_title='Тестовый ресторан',
            place_category='restaurant',
            visit_date=datetime.now(),
            joint_rating=8.5,
            photos=['photo1.jpg'],
            notes='Отличное место!',
            happiness_level=5
        )
        
        self.assertIsInstance(memory, SharedMemory)
        self.assertEqual(memory.pair_id, 'test_pair')
        self.assertEqual(memory.place_title, 'Тестовый ресторан')
        self.assertEqual(memory.joint_rating, 8.5)
        self.assertGreater(memory.memory_strength, 0)
    
    def test_get_memories(self):
        """Тест получения воспоминаний"""
        # Сохраняем несколько воспоминаний
        for i in range(3):
            self.memory_bank.save_memory(
                pair_id='test_pair',
                recommendation_id=f'rec_{i}',
                place_title=f'Место {i}',
                place_category='restaurant',
                visit_date=datetime.now() - timedelta(days=i),
                joint_rating=7.0 + i,
                happiness_level=3 + i
            )
        
        memories = self.memory_bank.get_memories('test_pair')
        
        self.assertEqual(len(memories), 3)
        self.assertIsInstance(memories[0], SharedMemory)
        
        # Тест с лимитом
        limited_memories = self.memory_bank.get_memories('test_pair', limit=2)
        self.assertEqual(len(limited_memories), 2)
    
    def test_get_memory_analytics(self):
        """Тест аналитики воспоминаний"""
        # Сохраняем воспоминания разных категорий
        categories = ['restaurant', 'cafe', 'entertainment']
        for i, category in enumerate(categories):
            self.memory_bank.save_memory(
                pair_id='test_pair',
                recommendation_id=f'rec_{i}',
                place_title=f'Место {category}',
                place_category=category,
                visit_date=datetime.now() - timedelta(days=i),
                joint_rating=7.0 + i,
                happiness_level=4
            )
        
        analytics = self.memory_bank.get_memory_analytics('test_pair')
        
        self.assertEqual(analytics.total_memories, 3)
        self.assertGreater(analytics.avg_rating, 0)
        self.assertIsInstance(analytics.favorite_categories, list)
        self.assertIsInstance(analytics.ai_insights, list)
    
    def test_get_memory_based_recommendations(self):
        """Тест рекомендаций на основе памяти"""
        # Сохраняем хорошее воспоминание
        self.memory_bank.save_memory(
            pair_id='test_pair',
            recommendation_id='rec_001',
            place_title='Отличный ресторан',
            place_category='restaurant',
            visit_date=datetime.now(),
            joint_rating=9.5,
            happiness_level=5,
            relationship_impact='transformative'
        )
        
        recommendations = self.memory_bank.get_memory_based_recommendations('test_pair')
        
        self.assertIsInstance(recommendations, list)
        if recommendations:  # Если есть рекомендации
            self.assertGreater(len(recommendations), 0)
            first_rec = recommendations[0]
            self.assertIn('recommended_place', first_rec.__dict__)
            self.assertIn('reason', first_rec.__dict__)

class TestMultiStepScenariosEngine(unittest.TestCase):
    """Тесты для движка многошаговых сценариев"""
    
    def setUp(self):
        # Мокаем компоненты
        with patch('multi_step_scenarios.MultiObjectiveRanker'), \
             patch('multi_step_scenarios.ContextAwarenessEngine'):
            self.scenarios_engine = MultiStepScenariosEngine()
    
    def test_determine_optimal_scenario_type(self):
        """Тест определения оптимального типа сценария"""
        # Мокаем контекст
        mock_context = MagicMock()
        mock_context.weather.condition = 'sunny'
        mock_context.weather.is_good_weather = True
        mock_context.user_mood.mood_type = 'adventurous'
        
        scenario_type = self.scenarios_engine._determine_optimal_scenario_type(
            'pair_123', mock_context
        )
        
        self.assertIsInstance(scenario_type, ScenarioType)
    
    @patch('multi_step_scenarios.MultiStepScenariosEngine._get_candidates_for_pair')
    def test_generate_scenario(self, mock_get_candidates):
        """Тест генерации сценария"""
        # Мокаем кандидатов
        mock_candidates = [
            {
                'item_id': 'place1',
                'title': 'Кафе',
                'category': 'cafe',
                'price': 800,
                'tags': ['Уютный'],
                'love_language': 'quality_time',
                'novelty': 0.3,
                'content_score': 0.7,
                'cf_score': 0.6,
                'embedding_score': 0.5
            },
            {
                'item_id': 'place2',
                'title': 'Ресторан',
                'category': 'restaurant',
                'price': 2000,
                'tags': ['Романтический'],
                'love_language': 'quality_time',
                'novelty': 0.5,
                'content_score': 0.8,
                'cf_score': 0.7,
                'embedding_score': 0.6
            }
        ]
        mock_get_candidates.return_value = mock_candidates
        
        scenario = self.scenarios_engine.generate_scenario(
            pair_id='test_pair',
            scenario_type=ScenarioType.ROMANTIC_EVENING
        )
        
        self.assertIsInstance(scenario, MultiStepScenario)
        self.assertEqual(scenario.scenario_type, ScenarioType.ROMANTIC_EVENING)
        self.assertGreater(len(scenario.steps), 0)
        self.assertGreater(scenario.total_duration, 0)
        self.assertIsInstance(scenario.preparation_tips, list)
    
    def test_create_scenario_variants(self):
        """Тест создания вариантов сценариев"""
        with patch.object(self.scenarios_engine, 'generate_scenario') as mock_generate:
            # Мокаем возвращаемые сценарии
            mock_scenario = MagicMock()
            mock_scenario.title = "Тестовый сценарий"
            mock_generate.return_value = mock_scenario
            
            variants = self.scenarios_engine.create_scenario_variants(
                'test_pair', ScenarioType.ADVENTURE_DAY
            )
            
            self.assertEqual(len(variants), 3)
            self.assertEqual(mock_generate.call_count, 3)
    
    def test_export_scenario_for_mobile(self):
        """Тест экспорта сценария для мобильного"""
        # Создаем mock сценарий
        from multi_step_scenarios import ScenarioStep, StepType
        
        mock_step = ScenarioStep(
            step_id='step1',
            step_type=StepType.START,
            place_title='Кафе',
            place_category='cafe',
            estimated_duration=60,
            estimated_cost=800,
            description='Начало дня',
            timing_suggestion='12:00',
            transportation='пешком',
            walking_time=10,
            booking_required=False,
            dress_code=None,
            weather_dependent=False,
            tips=['Совет 1'],
            why_this_step='Потому что',
            alternative_options=['Альтернатива']
        )
        
        mock_scenario = MultiStepScenario(
            scenario_id='scenario1',
            scenario_type=ScenarioType.ROMANTIC_EVENING,
            title='Тест',
            subtitle='Подтест',
            total_duration=180,
            total_cost_estimate=(1000, 2000),
            steps=[mock_step],
            best_time_of_day='evening',
            best_weather=['sunny'],
            difficulty_level=2,
            romance_level=5,
            adventure_level=2,
            created_for_pair='pair123',
            personality_match_score=0.8,
            context_match_score=0.7,
            preparation_tips=['Совет'],
            contingency_plans=['План Б'],
            memory_triggers=['Триггер'],
            created_at=datetime.now()
        )
        
        mobile_export = self.scenarios_engine.export_scenario_for_mobile(mock_scenario)
        
        self.assertIn('scenario_id', mobile_export)
        self.assertIn('steps', mobile_export)
        self.assertIn('preparation', mobile_export)
        self.assertIn('metadata', mobile_export)
        self.assertEqual(len(mobile_export['steps']), 1)

class TestIntegration(unittest.TestCase):
    """Интеграционные тесты системы"""
    
    def test_full_pipeline_integration(self):
        """Тест полного пайплайна от генерации данных до сценариев"""
        # 1. Генерируем enhanced данных
        generator = EnhancedSyntheticGenerator()
        test_user = generator.generate_enhanced_user('ArtLovers')
        
        # 2. Тестируем personality engine
        personality_engine = PersonalityEngine()
        personality = PersonalityProfile.from_dict(test_user['personality'])
        
        # 3. Тестируем context awareness
        context_engine = ContextAwarenessEngine()
        context = context_engine.get_complete_context()
        
        # 4. Тестируем sales XAI
        xai = SalesDrivenXAI()
        test_recommendation = {
            'title': 'Тестовое место',
            'category': 'restaurant',
            'price': 2000,
            'tags': ['Романтический']
        }
        
        insights = xai.extract_personalization_insights(
            {'user1_personality': personality.to_dict()}, 
            test_recommendation
        )
        
        # Проверяем, что все компоненты работают вместе
        self.assertIsInstance(test_user, dict)
        self.assertIsInstance(personality, PersonalityProfile)
        self.assertIsInstance(context, CompleteContext)
        self.assertIsInstance(insights, list)
        
        print("✅ Полный пайплайн интеграции работает корректно")

def run_comprehensive_tests():
    """Запускает все тесты с подробным отчетом"""
    print("🧪 Запуск Comprehensive Test Suite для LoveMemory AI")
    print("=" * 60)
    
    # Создаем test suite
    test_classes = [
        TestPersonalityEngine,
        TestEnhancedSyntheticGenerator,
        TestMultiObjectiveRanker,
        TestContextAwarenessEngine,
        TestSalesDrivenXAI,
        TestSharedMemoryBank,
        TestMultiStepScenariosEngine,
        TestIntegration
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for test_class in test_classes:
        print(f"\n🔍 Тестируем {test_class.__name__}...")
        
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        runner = unittest.TextTestRunner(verbosity=0, stream=open(os.devnull, 'w'))
        result = runner.run(suite)
        
        class_total = result.testsRun
        class_failed = len(result.failures) + len(result.errors)
        class_passed = class_total - class_failed
        
        total_tests += class_total
        passed_tests += class_passed
        failed_tests += class_failed
        
        print(f"  ✅ Пройдено: {class_passed}/{class_total}")
        if class_failed > 0:
            print(f"  ❌ Провалено: {class_failed}")
            for failure in result.failures:
                print(f"    FAIL: {failure[0]}")
            for error in result.errors:
                print(f"    ERROR: {error[0]}")
    
    # Итоговый отчет
    print(f"\n" + "=" * 60)
    print(f"📊 ИТОГОВЫЙ ОТЧЕТ ТЕСТИРОВАНИЯ")
    print(f"=" * 60)
    print(f"Всего тестов: {total_tests}")
    print(f"✅ Пройдено: {passed_tests}")
    print(f"❌ Провалено: {failed_tests}")
    print(f"📈 Успешность: {(passed_tests/total_tests)*100:.1f}%")
    
    if failed_tests == 0:
        print(f"\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
        print(f"✅ Commercial Grade система готова к production")
    else:
        print(f"\n⚠️ Есть проваленные тесты - требуется доработка")
    
    # Покрытие компонентов
    print(f"\n📋 ПОКРЫТИЕ КОМПОНЕНТОВ:")
    components = [
        "✅ Personality Engine (OCEAN)",
        "✅ Enhanced Synthetic Generator",
        "✅ Multi-Objective Ranker",
        "✅ Context Awareness Engine", 
        "✅ Sales-Driven XAI",
        "✅ Shared Memory Bank",
        "✅ Multi-Step Scenarios Engine",
        "✅ Integration Pipeline"
    ]
    
    for component in components:
        print(f"  {component}")
    
    print(f"\n🚀 LoveMemory AI Commercial Grade система протестирована!")
    
    return failed_tests == 0

if __name__ == "__main__":
    success = run_comprehensive_tests()
    if not success:
        exit(1)
