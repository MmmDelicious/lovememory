"""
🗺️ Multi-Step Scenarios Engine для LoveMemory AI
Фаза 3.2: Многошаговые Сценарии ("Миссии")

Превращает простые рекомендации мест в полноценные сценарии свиданий.
Не просто "идите в ресторан", а детальный план на весь день/вечер.

Это трансформирует продукт из рекомендателя в персонального планировщика свиданий.
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from multi_objective_ranker import MultiObjectiveRanker
from context_awareness_engine import CompleteContext, ContextAwarenessEngine

class ScenarioType(Enum):
    """Типы сценариев"""
    ROMANTIC_EVENING = "romantic_evening"
    ADVENTURE_DAY = "adventure_day"
    CULTURAL_IMMERSION = "cultural_immersion"
    COMFORT_ZONE = "comfort_zone"
    DISCOVERY_JOURNEY = "discovery_journey"
    CELEBRATION = "celebration"

class StepType(Enum):
    """Типы шагов в сценарии"""
    START = "start"  # Начальная точка
    MAIN = "main"    # Основная активность
    TRANSITION = "transition"  # Переход между активностями
    FINALE = "finale"  # Завершающая активность
    OPTIONAL = "optional"  # Опциональная активность

@dataclass
class ScenarioStep:
    """Один шаг в многошаговом сценарии"""
    step_id: str
    step_type: StepType
    place_title: str
    place_category: str
    estimated_duration: int  # В минутах
    estimated_cost: int  # В рублях
    description: str
    timing_suggestion: str  # "12:00", "после обеда", "когда проголодаетесь"
    
    # Навигация
    transportation: str  # "пешком", "на такси", "на метро"
    walking_time: int  # В минутах до следующего места
    
    # Практические советы
    booking_required: bool
    dress_code: Optional[str]
    weather_dependent: bool
    tips: List[str]  # Практические советы
    
    # Персонализация
    why_this_step: str  # Объяснение выбора
    alternative_options: List[str]  # Альтернативы на случай проблем
    
    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['step_type'] = self.step_type.value
        return result

@dataclass 
class MultiStepScenario:
    """Полный многошаговый сценарий"""
    scenario_id: str
    scenario_type: ScenarioType
    title: str
    subtitle: str
    total_duration: int  # В минутах
    total_cost_estimate: Tuple[int, int]  # (min, max)
    
    steps: List[ScenarioStep]
    
    # Метаданные
    best_time_of_day: str
    best_weather: List[str]
    difficulty_level: int  # 1-5 (сложность планирования)
    romance_level: int  # 1-5
    adventure_level: int  # 1-5
    
    # Персонализация
    created_for_pair: str  # ID пары
    personality_match_score: float  # Насколько подходит паре
    context_match_score: float  # Насколько подходит моменту
    
    # Подсказки
    preparation_tips: List[str]
    contingency_plans: List[str]  # Планы Б
    memory_triggers: List[str]  # Что может сделать момент особенным
    
    created_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        result = asdict(self)
        result['scenario_type'] = self.scenario_type.value
        result['steps'] = [step.to_dict() for step in self.steps]
        result['created_at'] = self.created_at.isoformat()
        return result

class MultiStepScenariosEngine:
    """
    Движок многошаговых сценариев
    
    Создает персонализированные планы свиданий из 3-5 логически связанных активностей.
    Каждый сценарий - это готовая история с тайминг, навигацией и советами.
    """
    
    def __init__(self, data_path: str = 'data/synthetic_v2_enhanced'):
        """
        Инициализация движка сценариев
        
        Args:
            data_path: Путь к данным
        """
        self.data_path = data_path
        
        # Интегрируем существующие компоненты
        self.ranker = MultiObjectiveRanker(data_path)
        self.context_engine = ContextAwarenessEngine()
        
        # Шаблоны сценариев
        self.scenario_templates = self._init_scenario_templates()
        
        # Правила композиции сценариев
        self.composition_rules = self._init_composition_rules()
        
        # Банк переходных фраз
        self.transition_phrases = self._init_transition_phrases()
        
        print("🗺️ Multi-Step Scenarios Engine инициализирован")
    
    def _init_scenario_templates(self) -> Dict[ScenarioType, Dict]:
        """Инициализирует шаблоны сценариев"""
        return {
            ScenarioType.ROMANTIC_EVENING: {
                'titles': [
                    "Идеальный романтический вечер",
                    "Вечер, который запомнится навсегда",
                    "Романтическая одиссея по городу",
                    "Свидание мечты"
                ],
                'subtitles': [
                    "От заката до звезд — каждая минута будет особенной",
                    "Создайте историю любви, которую расскажете внукам",
                    "Романтика в каждой детали вашего вечера"
                ],
                'preferred_categories': ['restaurant', 'cafe', 'bar', 'activity'],
                'required_steps': [StepType.START, StepType.MAIN, StepType.FINALE],
                'optimal_duration': (180, 300),  # 3-5 часов
                'best_times': ['evening'],
                'romance_level': 5
            },
            
            ScenarioType.ADVENTURE_DAY: {
                'titles': [
                    "День приключений для двоих",
                    "Исследователи выходного дня",
                    "Активное путешествие по городу",
                    "Адреналин и эмоции"
                ],
                'subtitles': [
                    "Откройте город с новой стороны вместе",
                    "Приключения, которые сблизят вас еще больше",
                    "Активный день полный открытий"
                ],
                'preferred_categories': ['activity', 'entertainment', 'cafe'],
                'required_steps': [StepType.START, StepType.MAIN, StepType.MAIN, StepType.FINALE],
                'optimal_duration': (240, 480),  # 4-8 часов
                'best_times': ['morning', 'afternoon'],
                'adventure_level': 5
            },
            
            ScenarioType.CULTURAL_IMMERSION: {
                'titles': [
                    "Культурное погружение",
                    "Искусство и эстетика",
                    "Интеллектуальное свидание",
                    "В поисках прекрасного"
                ],
                'subtitles': [
                    "Насладитесь искусством и культурой вместе",
                    "Откройте новые грани творчества",
                    "Эстетическое наслаждение для души"
                ],
                'preferred_categories': ['entertainment', 'cafe', 'restaurant'],
                'required_steps': [StepType.START, StepType.MAIN, StepType.TRANSITION, StepType.FINALE],
                'optimal_duration': (180, 360),  # 3-6 часов
                'best_times': ['afternoon', 'evening'],
                'romance_level': 4
            },
            
            ScenarioType.COMFORT_ZONE: {
                'titles': [
                    "Уютный день вместе",
                    "Комфорт и тепло для двоих",
                    "Спокойное наслаждение",
                    "Расслабление и близость"
                ],
                'subtitles': [
                    "Иногда лучший день — это простые радости",
                    "Найдите счастье в обычных моментах",
                    "Уют и покой в компании любимого человека"
                ],
                'preferred_categories': ['cafe', 'restaurant', 'activity'],
                'required_steps': [StepType.START, StepType.MAIN, StepType.FINALE],
                'optimal_duration': (120, 240),  # 2-4 часа
                'best_times': ['morning', 'afternoon'],
                'romance_level': 3
            },
            
            ScenarioType.DISCOVERY_JOURNEY: {
                'titles': [
                    "Путешествие открытий",
                    "Новые горизонты для пары",
                    "Исследователи неизведанного",
                    "Открывая город заново"
                ],
                'subtitles': [
                    "Каждый шаг — новое открытие",
                    "Познавайте мир и друг друга одновременно",
                    "Маршрут для любознательных сердец"
                ],
                'preferred_categories': ['activity', 'entertainment', 'cafe', 'restaurant'],
                'required_steps': [StepType.START, StepType.MAIN, StepType.OPTIONAL, StepType.FINALE],
                'optimal_duration': (300, 420),  # 5-7 часов
                'best_times': ['morning', 'afternoon'],
                'adventure_level': 4
            },
            
            ScenarioType.CELEBRATION: {
                'titles': [
                    "Особенный день для особенного повода",
                    "Праздник для двоих",
                    "Торжественный вечер",
                    "Отмечаем важное событие"
                ],
                'subtitles': [
                    "Сделайте этот день незабываемым",
                    "Праздник, достойный ваших отношений",
                    "Каждая деталь — для вашего торжества"
                ],
                'preferred_categories': ['restaurant', 'entertainment', 'gift', 'bar'],
                'required_steps': [StepType.START, StepType.MAIN, StepType.FINALE],
                'optimal_duration': (180, 360),  # 3-6 часов
                'best_times': ['evening'],
                'romance_level': 5
            }
        }
    
    def _init_composition_rules(self) -> Dict[str, Any]:
        """Инициализирует правила композиции сценариев"""
        return {
            # Логичные переходы между категориями
            'category_flows': {
                'cafe': ['restaurant', 'entertainment', 'activity', 'bar'],
                'restaurant': ['bar', 'entertainment', 'activity'],
                'entertainment': ['cafe', 'bar', 'restaurant'],
                'activity': ['cafe', 'restaurant', 'bar'],
                'bar': ['restaurant'],  # Обычно финал
            },
            
            # Временные ограничения
            'timing_rules': {
                'morning': ['cafe', 'activity'],
                'afternoon': ['restaurant', 'entertainment', 'activity', 'cafe'],
                'evening': ['restaurant', 'bar', 'entertainment'],
                'night': ['bar']
            },
            
            # Максимальные расстояния между локациями (в км)
            'max_distances': {
                'walking': 1.5,
                'short_ride': 5.0,
                'long_ride': 15.0
            },
            
            # Бюджетные правила
            'budget_distribution': {
                'start': 0.2,     # 20% бюджета на начало
                'main': 0.5,      # 50% на основную активность
                'finale': 0.3     # 30% на финал
            }
        }
    
    def _init_transition_phrases(self) -> Dict[str, List[str]]:
        """Инициализирует банк переходных фраз"""
        return {
            'time_based': [
                "После приятного начала",
                "Когда аппетит разыграется",
                "После активной части дня",
                "Когда солнце начнет садиться",
                "В завершение дня"
            ],
            'mood_based': [
                "Чтобы сменить обстановку",
                "Для создания особого настроения",
                "Добавив нотку романтики",
                "Чтобы усилить впечатления",
                "Продолжая атмосферу"
            ],
            'practical': [
                "В 10 минутах ходьбы",
                "Недалеко отсюда",
                "По пути вас ждет",
                "Следующая остановка",
                "Завершающий аккорд"
            ],
            'emotional': [
                "Чтобы запечатлеть этот момент",
                "Создавая воспоминания",
                "Добавляя магии в день",
                "Для идеального завершения",
                "Чтобы день стал незабываемым"
            ]
        }
    
    def generate_scenario(self, pair_id: str, 
                         scenario_type: Optional[ScenarioType] = None,
                         context: Optional[CompleteContext] = None,
                         budget_range: Tuple[int, int] = (1000, 5000),
                         duration_hours: int = 4) -> MultiStepScenario:
        """
        Генерирует многошаговый сценарий для пары
        
        Args:
            pair_id: ID пары
            scenario_type: Тип сценария (если None, выбирается автоматически)
            context: Контекстуальная информация
            budget_range: Диапазон бюджета
            duration_hours: Желаемая продолжительность в часах
            
        Returns:
            Полный многошаговый сценарий
        """
        print(f"🗺️ Генерируем многошаговый сценарий для пары {pair_id}...")
        
        # Автоматический выбор типа сценария если не указан
        if scenario_type is None:
            scenario_type = self._determine_optimal_scenario_type(pair_id, context)
        
        # Получаем шаблон сценария
        template = self.scenario_templates[scenario_type]
        
        # Генерируем кандидатов для каждого шага
        candidates = self._get_scenario_candidates(pair_id, scenario_type, budget_range)
        
        # Компонуем оптимальный маршрут
        selected_places = self._compose_optimal_route(candidates, template, duration_hours * 60)
        
        # Создаем детальные шаги
        steps = self._create_detailed_steps(selected_places, scenario_type, context)
        
        # Генерируем метаданные сценария
        scenario_metadata = self._generate_scenario_metadata(
            pair_id, scenario_type, steps, template, context
        )
        
        # Собираем полный сценарий
        scenario = MultiStepScenario(
            scenario_id=str(uuid.uuid4()),
            scenario_type=scenario_type,
            title=random.choice(template['titles']),
            subtitle=random.choice(template['subtitles']),
            total_duration=sum(step.estimated_duration for step in steps),
            total_cost_estimate=(
                sum(step.estimated_cost for step in steps) - 500,
                sum(step.estimated_cost for step in steps) + 500
            ),
            steps=steps,
            **scenario_metadata,
            created_for_pair=pair_id,
            created_at=datetime.now()
        )
        
        print(f"✅ Сценарий создан: {scenario.title} ({len(scenario.steps)} шагов)")
        return scenario
    
    def _determine_optimal_scenario_type(self, pair_id: str, 
                                       context: Optional[CompleteContext]) -> ScenarioType:
        """Определяет оптимальный тип сценария для пары"""
        
        # Анализируем контекст
        if context:
            # Погодные предпочтения
            if context.weather.condition == 'rainy':
                return ScenarioType.COMFORT_ZONE
            elif context.weather.is_good_weather:
                return ScenarioType.ADVENTURE_DAY
            
            # Настроение пользователя
            if context.user_mood.mood_type == 'adventurous':
                return ScenarioType.DISCOVERY_JOURNEY
            elif context.user_mood.mood_type == 'romantic':
                return ScenarioType.ROMANTIC_EVENING
            elif context.user_mood.mood_type == 'comfortable':
                return ScenarioType.COMFORT_ZONE
            
            # Временной контекст
            if context.temporal.is_weekend and context.temporal.time_of_day == 'evening':
                return ScenarioType.ROMANTIC_EVENING
            elif context.temporal.is_weekend and context.temporal.time_of_day in ['morning', 'afternoon']:
                return ScenarioType.ADVENTURE_DAY
        
        # Дефолтный выбор на основе вероятностей
        scenario_weights = {
            ScenarioType.ROMANTIC_EVENING: 0.3,
            ScenarioType.ADVENTURE_DAY: 0.25,
            ScenarioType.DISCOVERY_JOURNEY: 0.2,
            ScenarioType.COMFORT_ZONE: 0.15,
            ScenarioType.CULTURAL_IMMERSION: 0.1
        }
        
        return random.choices(
            list(scenario_weights.keys()),
            weights=list(scenario_weights.values())
        )[0]
    
    def _get_scenario_candidates(self, pair_id: str, scenario_type: ScenarioType, 
                               budget_range: Tuple[int, int]) -> List[Dict]:
        """Получает кандидатов для сценария"""
        template = self.scenario_templates[scenario_type]
        preferred_categories = template['preferred_categories']
        
        all_candidates = []
        
        # Получаем кандидатов от multi-objective ranker
        if hasattr(self.ranker, '_get_candidates_for_pair'):
            base_candidates = self.ranker._get_candidates_for_pair(pair_id, max_candidates=50)
            
            # Фильтруем по предпочтительным категориям
            filtered_candidates = [
                c for c in base_candidates 
                if c.get('category') in preferred_categories
            ]
            
            # Фильтруем по бюджету
            budget_filtered = [
                c for c in filtered_candidates
                if budget_range[0] <= c.get('price', 1000) <= budget_range[1]
            ]
            
            all_candidates.extend(budget_filtered)
        
        # Если недостаточно кандидатов, добавляем из базового каталога
        if len(all_candidates) < 10:
            additional_candidates = self._get_fallback_candidates(
                preferred_categories, budget_range
            )
            all_candidates.extend(additional_candidates)
        
        return all_candidates[:30]  # Ограничиваем количество
    
    def _get_fallback_candidates(self, categories: List[str], 
                               budget_range: Tuple[int, int]) -> List[Dict]:
        """Получает резервных кандидатов из каталога"""
        from enhanced_synthetic_generator import EnhancedSyntheticGenerator
        
        generator = EnhancedSyntheticGenerator()
        catalog = generator.enhanced_product_catalog
        
        filtered_catalog = [
            item for item in catalog
            if item['category'] in categories and 
               budget_range[0] <= item['price'] <= budget_range[1]
        ]
        
        # Преобразуем в формат кандидатов
        candidates = []
        for item in filtered_catalog:
            candidate = {
                'item_id': item['title'],
                'title': item['title'],
                'category': item['category'],
                'price': item['price'],
                'tags': item['tags'],
                'love_language': item['love_language'],
                'novelty': item.get('novelty', 0.5),
                'content_score': 0.6,
                'cf_score': 0.5,
                'embedding_score': 0.5
            }
            candidates.append(candidate)
        
        return candidates
    
    def _compose_optimal_route(self, candidates: List[Dict], template: Dict, 
                             target_duration: int) -> List[Dict]:
        """Компонует оптимальный маршрут из кандидатов"""
        required_steps = template['required_steps']
        preferred_categories = template['preferred_categories']
        
        selected_places = []
        used_categories = set()
        remaining_duration = target_duration
        
        # Распределяем кандидатов по типам шагов
        step_candidates = {
            StepType.START: [c for c in candidates if c['category'] in ['cafe', 'activity']],
            StepType.MAIN: [c for c in candidates if c['category'] in ['restaurant', 'entertainment']],
            StepType.FINALE: [c for c in candidates if c['category'] in ['restaurant', 'bar', 'entertainment']],
            StepType.TRANSITION: [c for c in candidates if c['category'] in ['cafe']],
            StepType.OPTIONAL: candidates
        }
        
        # Выбираем места для каждого требуемого шага
        for step_type in required_steps:
            suitable_candidates = step_candidates.get(step_type, candidates)
            
            # Фильтруем уже использованные категории для разнообразия
            if len(selected_places) > 0:
                diverse_candidates = [
                    c for c in suitable_candidates 
                    if c['category'] not in used_categories
                ]
                if diverse_candidates:
                    suitable_candidates = diverse_candidates
            
            # Выбираем лучшего кандидата
            if suitable_candidates:
                # Сортируем по релевантности
                sorted_candidates = sorted(
                    suitable_candidates,
                    key=lambda x: (
                        x.get('relevance_score', 0) * 0.4 +
                        x.get('novelty_score', 0) * 0.3 +
                        x.get('content_score', 0) * 0.3
                    ),
                    reverse=True
                )
                
                selected = sorted_candidates[0]
                selected['step_type'] = step_type
                selected_places.append(selected)
                used_categories.add(selected['category'])
                
                # Обновляем оставшуюся продолжительность
                estimated_duration = self._estimate_activity_duration(selected['category'])
                remaining_duration -= estimated_duration
        
        # Добавляем опциональные шаги если есть время
        if remaining_duration > 60:  # Больше часа
            optional_candidates = [
                c for c in candidates 
                if c['category'] not in used_categories and
                c not in selected_places
            ]
            
            if optional_candidates:
                optional = random.choice(optional_candidates)
                optional['step_type'] = StepType.OPTIONAL
                # Вставляем перед финалом
                selected_places.insert(-1, optional)
        
        return selected_places
    
    def _estimate_activity_duration(self, category: str) -> int:
        """Оценивает продолжительность активности по категории"""
        duration_estimates = {
            'cafe': 60,           # 1 час
            'restaurant': 90,     # 1.5 часа
            'entertainment': 120, # 2 часа
            'activity': 150,      # 2.5 часа
            'bar': 90,           # 1.5 часа
            'gift': 30           # 30 минут
        }
        return duration_estimates.get(category, 90)
    
    def _create_detailed_steps(self, selected_places: List[Dict], 
                             scenario_type: ScenarioType,
                             context: Optional[CompleteContext]) -> List[ScenarioStep]:
        """Создает детальные шаги сценария"""
        steps = []
        current_time = datetime.now().replace(hour=12, minute=0)  # Начинаем с полудня
        
        for i, place in enumerate(selected_places):
            step_type = StepType(place.get('step_type', StepType.MAIN))
            
            # Оцениваем продолжительность
            duration = self._estimate_activity_duration(place['category'])
            
            # Определяем время начала этого шага
            timing_suggestion = current_time.strftime("%H:%M")
            current_time += timedelta(minutes=duration + 30)  # +30 мин на переход
            
            # Генерируем описание шага
            description = self._generate_step_description(place, step_type, i == 0, i == len(selected_places) - 1)
            
            # Транспорт до следующего места
            transportation, walking_time = self._determine_transportation(i, len(selected_places))
            
            # Генерируем практические советы
            tips = self._generate_practical_tips(place, step_type, context)
            
            # Объяснение выбора
            why_this_step = self._generate_step_reasoning(place, step_type, scenario_type)
            
            # Альтернативы
            alternatives = self._generate_alternatives(place)
            
            step = ScenarioStep(
                step_id=str(uuid.uuid4()),
                step_type=step_type,
                place_title=place['title'],
                place_category=place['category'],
                estimated_duration=duration,
                estimated_cost=place['price'],
                description=description,
                timing_suggestion=timing_suggestion,
                transportation=transportation,
                walking_time=walking_time,
                booking_required=place['category'] in ['restaurant', 'entertainment'],
                dress_code=self._determine_dress_code(place['category'], scenario_type),
                weather_dependent=place['category'] in ['activity'] and 'outdoor' in place.get('tags', []),
                tips=tips,
                why_this_step=why_this_step,
                alternative_options=alternatives
            )
            
            steps.append(step)
        
        return steps
    
    def _generate_step_description(self, place: Dict, step_type: StepType, 
                                 is_first: bool, is_last: bool) -> str:
        """Генерирует описание шага"""
        base_descriptions = {
            StepType.START: [
                f"Начните ваш день в {place['title']} — идеальное место для настройки на особенную атмосферу.",
                f"Отправная точка вашего путешествия — {place['title']}, где начинается магия.",
                f"Первый шаг к незабываемому дню: {place['title']} встретит вас теплой атмосферой."
            ],
            StepType.MAIN: [
                f"Главное событие дня — {place['title']}. Здесь вас ждут самые яркие впечатления.",
                f"Сердце вашего маршрута — {place['title']}, место где создаются воспоминания.",
                f"Центральная часть программы: {place['title']} подарит вам особенные моменты."
            ],
            StepType.FINALE: [
                f"Завершите день в {place['title']} — идеальный финал для вашего свидания.",
                f"Последний аккорд дня в {place['title']}, чтобы закрепить все впечатления.",
                f"Красивое завершение в {place['title']} — пусть день закончится на высокой ноте."
            ],
            StepType.TRANSITION: [
                f"Перезарядитесь в {place['title']} перед следующим этапом вашего путешествия.",
                f"Приятная пауза в {place['title']} — время обсудить впечатления и подготовиться к продолжению.",
                f"Переходный момент в {place['title']}, чтобы насладиться обществом друг друга."
            ],
            StepType.OPTIONAL: [
                f"Если время позволит, загляните в {place['title']} — приятное дополнение к основной программе.",
                f"Опциональная остановка в {place['title']} для тех, кто любит неожиданные открытия.",
                f"По желанию посетите {place['title']} — это может стать сюрпризом дня."
            ]
        }
        
        descriptions = base_descriptions.get(step_type, base_descriptions[StepType.MAIN])
        base_description = random.choice(descriptions)
        
        # Добавляем контекстную информацию
        tags = place.get('tags', [])
        if 'Романтический' in tags and step_type == StepType.FINALE:
            base_description += " Романтическая атмосфера создаст идеальное настроение для завершения дня."
        elif 'Уютный' in tags:
            base_description += " Уютная обстановка поможет расслабиться и насладиться обществом друг друга."
        elif place['novelty'] > 0.7:
            base_description += " Новое место, которое подарит вам неожиданные впечатления."
        
        return base_description
    
    def _determine_transportation(self, step_index: int, total_steps: int) -> Tuple[str, int]:
        """Определяет способ транспорта и время в пути"""
        if step_index == total_steps - 1:  # Последний шаг
            return "завершение", 0
        
        # Симулируем расстояние
        distance_km = random.uniform(0.5, 3.0)
        
        if distance_km <= 1.0:
            return "пешком", int(distance_km * 12)  # 12 мин на км
        elif distance_km <= 2.0:
            return "на такси", int(distance_km * 5 + 5)  # 5 мин на км + ожидание
        else:
            return "на метро", int(distance_km * 4 + 10)  # 4 мин на км + переходы
    
    def _generate_practical_tips(self, place: Dict, step_type: StepType, 
                               context: Optional[CompleteContext]) -> List[str]:
        """Генерирует практические советы для шага"""
        tips = []
        
        # Общие советы по категориям
        category_tips = {
            'restaurant': [
                "Забронируйте столик заранее, особенно на выходные",
                "Уточните наличие вегетарианских блюд если необходимо"
            ],
            'entertainment': [
                "Приходите за 15-20 минут до начала",
                "Проверьте возрастные ограничения"
            ],
            'activity': [
                "Одевайтесь удобно для активных действий",
                "Возьмите с собой воду"
            ],
            'cafe': [
                "Лучшее время — когда меньше народу",
                "Попробуйте фирменные напитки заведения"
            ]
        }
        
        category = place['category']
        if category in category_tips:
            tips.extend(random.sample(category_tips[category], 1))
        
        # Контекстуальные советы
        if context:
            if context.weather.condition == 'rainy':
                tips.append("Возьмите зонт — на улице дождь")
            elif context.weather.temperature < 5:
                tips.append("Одевайтесь тепло — на улице холодно")
            
            if context.temporal.is_weekend:
                tips.append("Выходной день — может быть многолюдно")
        
        # Советы по ценам
        if place['price'] > 2500:
            tips.append("Премиум уровень — рекомендуем соответствующий дресс-код")
        
        return tips[:3]  # Максимум 3 совета
    
    def _generate_step_reasoning(self, place: Dict, step_type: StepType, 
                               scenario_type: ScenarioType) -> str:
        """Генерирует объяснение выбора этого шага"""
        reasoning_templates = {
            StepType.START: [
                "Идеальное начало — создает правильное настроение с первых минут",
                "Мягкий старт, который поможет расслабиться и настроиться на день",
                "Начинаем с места, которое создаст комфортную атмосферу"
            ],
            StepType.MAIN: [
                "Центральное событие дня — именно здесь создаются главные воспоминания",
                "Основная активность, которая максимально соответствует вашим интересам",
                "Кульминация дня — место, где вы проведете самое качественное время"
            ],
            StepType.FINALE: [
                "Логичное завершение — создает приятное послевкусие от дня",
                "Финальный аккорд, который закрепит все положительные эмоции",
                "Идеальное место для подведения итогов дня"
            ]
        }
        
        base_reasons = reasoning_templates.get(step_type, reasoning_templates[StepType.MAIN])
        base_reason = random.choice(base_reasons)
        
        # Добавляем персонализацию
        if place.get('relevance_score', 0) > 0.8:
            base_reason += " Высокое соответствие вашим предпочтениям."
        elif place.get('novelty_score', 0) > 0.7:
            base_reason += " Новое место для расширения горизонтов."
        elif place.get('empathy_score', 0) > 0.7:
            base_reason += " Учитывает интересы обоих партнеров."
        
        return base_reason
    
    def _generate_alternatives(self, place: Dict) -> List[str]:
        """Генерирует альтернативы на случай проблем"""
        alternatives = []
        
        category = place['category']
        
        if category == 'restaurant':
            alternatives = [
                "Если нет мест — попробуйте соседнее кафе",
                "В случае долгого ожидания — закажите блюда на вынос",
                "Альтернатива — food court в ближайшем торговом центре"
            ]
        elif category == 'entertainment':
            alternatives = [
                "Если билетов нет — посмотрите что показывают в соседних залах",
                "План Б — прогулка по торговому центру с развлечениями",
                "Запасной вариант — кафе с настольными играми"
            ]
        elif category == 'activity':
            alternatives = [
                "При плохой погоде — крытые активности поблизости",
                "Если очередь — запишитесь и погуляйте в ожидании",
                "Альтернатива — спонтанная прогулка по району"
            ]
        
        return alternatives[:2]  # Максимум 2 альтернативы
    
    def _determine_dress_code(self, category: str, scenario_type: ScenarioType) -> Optional[str]:
        """Определяет дресс-код для активности"""
        dress_codes = {
            'restaurant': {
                ScenarioType.ROMANTIC_EVENING: "Элегантный стиль",
                ScenarioType.CELEBRATION: "Торжественный наряд",
                'default': "Умный кэжуал"
            },
            'entertainment': {
                ScenarioType.CULTURAL_IMMERSION: "Опрятный внешний вид",
                'default': "Комфортная одежда"
            },
            'activity': "Спортивная одежда",
            'bar': "Стильный casual"
        }
        
        if category in dress_codes:
            if isinstance(dress_codes[category], dict):
                return dress_codes[category].get(scenario_type, dress_codes[category]['default'])
            else:
                return dress_codes[category]
        
        return None
    
    def _generate_scenario_metadata(self, pair_id: str, scenario_type: ScenarioType, 
                                  steps: List[ScenarioStep], template: Dict,
                                  context: Optional[CompleteContext]) -> Dict[str, Any]:
        """Генерирует метаданные сценария"""
        
        # Определяем лучшее время дня
        step_categories = [step.place_category for step in steps]
        if 'bar' in step_categories or any('Романтический' in str(step.tips) for step in steps):
            best_time = "evening"
        elif 'activity' in step_categories:
            best_time = "afternoon"
        else:
            best_time = "flexible"
        
        # Определяем лучшую погоду
        best_weather = ["sunny", "cloudy"]
        if any(step.weather_dependent for step in steps):
            best_weather = ["sunny"]
        
        # Сложность планирования
        booking_required_count = sum(1 for step in steps if step.booking_required)
        difficulty = min(5, 1 + booking_required_count)
        
        # Уровни романтики и приключений
        romance_level = template.get('romance_level', 3)
        adventure_level = template.get('adventure_level', 3)
        
        # Соответствие личности (симуляция)
        personality_match = random.uniform(0.7, 0.95)
        
        # Соответствие контексту
        context_match = 0.8
        if context:
            if context.context_score > 0.7:
                context_match = 0.9
            elif context.context_score < 0.4:
                context_match = 0.6
        
        # Советы по подготовке
        preparation_tips = [
            "Зарядите телефон для фотографий и навигации",
            "Возьмите с собой немного наличных на случай",
            "Проверьте погоду накануне"
        ]
        
        if any(step.booking_required for step in steps):
            preparation_tips.insert(0, "Забронируйте столики/билеты заранее")
        
        # Планы Б
        contingency_plans = [
            "При плохой погоде — замените активности на крытые",
            "Если место закрыто — используйте альтернативы из каждого шага",
            "При нехватке времени — пропустите опциональные шаги"
        ]
        
        # Триггеры воспоминаний
        memory_triggers = [
            "Сделайте фото на каждом этапе для создания истории дня",
            "Сохраните чеки как напоминание о местах",
            "Записывайте забавные моменты в заметки телефона",
            "Соберите небольшие сувениры (билеты, салфетки с логотипами)"
        ]
        
        return {
            'best_time_of_day': best_time,
            'best_weather': best_weather,
            'difficulty_level': difficulty,
            'romance_level': romance_level,
            'adventure_level': adventure_level,
            'personality_match_score': personality_match,
            'context_match_score': context_match,
            'preparation_tips': preparation_tips[:3],
            'contingency_plans': contingency_plans,
            'memory_triggers': memory_triggers[:3]
        }
    
    def create_scenario_variants(self, pair_id: str, base_scenario_type: ScenarioType,
                               context: Optional[CompleteContext] = None) -> List[MultiStepScenario]:
        """
        Создает несколько вариантов сценариев для выбора
        
        Args:
            pair_id: ID пары
            base_scenario_type: Базовый тип сценария
            context: Контекстуальная информация
            
        Returns:
            Список из 3 вариантов сценариев
        """
        variants = []
        
        # Вариант 1: Базовый сценарий
        scenario1 = self.generate_scenario(pair_id, base_scenario_type, context)
        variants.append(scenario1)
        
        # Вариант 2: Более бюджетный
        scenario2 = self.generate_scenario(
            pair_id, base_scenario_type, context, 
            budget_range=(500, 2000), duration_hours=3
        )
        scenario2.title = "💰 " + scenario2.title + " (Эконом версия)"
        variants.append(scenario2)
        
        # Вариант 3: Более премиальный
        scenario3 = self.generate_scenario(
            pair_id, base_scenario_type, context,
            budget_range=(2000, 6000), duration_hours=5
        )
        scenario3.title = "👑 " + scenario3.title + " (Премиум версия)"
        variants.append(scenario3)
        
        return variants
    
    def export_scenario_for_mobile(self, scenario: MultiStepScenario) -> Dict[str, Any]:
        """
        Экспортирует сценарий в формате для мобильного приложения
        
        Args:
            scenario: Сценарий для экспорта
            
        Returns:
            Данные в формате для мобильного приложения
        """
        return {
            'scenario_id': scenario.scenario_id,
            'title': scenario.title,
            'subtitle': scenario.subtitle,
            'total_time': f"{scenario.total_duration // 60}ч {scenario.total_duration % 60}мин",
            'budget_range': f"{scenario.total_cost_estimate[0]} - {scenario.total_cost_estimate[1]} ₽",
            'difficulty': scenario.difficulty_level,
            'romance_level': scenario.romance_level,
            'adventure_level': scenario.adventure_level,
            
            'steps': [
                {
                    'step_number': i + 1,
                    'title': step.place_title,
                    'category': step.place_category,
                    'time': step.timing_suggestion,
                    'duration': f"{step.estimated_duration}мин",
                    'cost': f"{step.estimated_cost}₽",
                    'description': step.description,
                    'transport': step.transportation,
                    'walk_time': step.walking_time,
                    'tips': step.tips,
                    'booking_required': step.booking_required,
                    'dress_code': step.dress_code,
                    'alternatives': step.alternative_options
                }
                for i, step in enumerate(scenario.steps)
            ],
            
            'preparation': {
                'tips': scenario.preparation_tips,
                'contingency_plans': scenario.contingency_plans,
                'memory_tips': scenario.memory_triggers
            },
            
            'metadata': {
                'best_time': scenario.best_time_of_day,
                'best_weather': scenario.best_weather,
                'personality_match': round(scenario.personality_match_score * 100),
                'context_match': round(scenario.context_match_score * 100),
                'created_at': scenario.created_at.isoformat()
            }
        }

def main():
    """Демонстрация Multi-Step Scenarios Engine"""
    print("🗺️ Демонстрация Multi-Step Scenarios Engine - Фаза 3.2")
    print("📋 Многошаговые сценарии: от простых рекомендаций к планам свиданий")
    
    # Инициализируем движок
    scenarios_engine = MultiStepScenariosEngine()
    
    # Тестовая пара
    test_pair_id = "pair_123"
    
    print(f"\n🎯 Генерируем сценарий для пары {test_pair_id}...")
    
    # Создаем контекст
    context_engine = ContextAwarenessEngine()
    context = context_engine.get_complete_context()
    
    # Генерируем романтический сценарий
    scenario = scenarios_engine.generate_scenario(
        pair_id=test_pair_id,
        scenario_type=ScenarioType.ROMANTIC_EVENING,
        context=context,
        duration_hours=4
    )
    
    # Выводим результат
    print(f"\n📋 Сценарий: {scenario.title}")
    print(f"   {scenario.subtitle}")
    print(f"   Продолжительность: {scenario.total_duration // 60}ч {scenario.total_duration % 60}мин")
    print(f"   Бюджет: {scenario.total_cost_estimate[0]} - {scenario.total_cost_estimate[1]} ₽")
    print(f"   Романтика: {'❤️' * scenario.romance_level}")
    print(f"   Сложность: {'⭐' * scenario.difficulty_level}")
    
    print(f"\n📍 Маршрут ({len(scenario.steps)} шагов):")
    for i, step in enumerate(scenario.steps, 1):
        print(f"  {i}. {step.timing_suggestion} - {step.place_title} ({step.estimated_duration}мин)")
        print(f"     💡 {step.description}")
        print(f"     🎯 {step.why_this_step}")
        if step.tips:
            print(f"     📝 Совет: {step.tips[0]}")
        if i < len(scenario.steps):
            print(f"     🚶 {step.transportation} ({step.walking_time}мин)")
        print()
    
    # Подготовка
    print(f"📋 Подготовка к сценарию:")
    for tip in scenario.preparation_tips:
        print(f"  • {tip}")
    
    # Планы Б
    print(f"\n🛡️ Планы на случай проблем:")
    for plan in scenario.contingency_plans:
        print(f"  • {plan}")
    
    # Создаем варианты сценариев
    print(f"\n🎲 Генерируем варианты сценариев...")
    variants = scenarios_engine.create_scenario_variants(
        test_pair_id, ScenarioType.ADVENTURE_DAY, context
    )
    
    print(f"Создано {len(variants)} вариантов:")
    for i, variant in enumerate(variants, 1):
        print(f"  {i}. {variant.title}")
        print(f"     {variant.total_duration // 60}ч, {variant.total_cost_estimate[0]}-{variant.total_cost_estimate[1]}₽")
    
    # Экспорт для мобильного
    mobile_export = scenarios_engine.export_scenario_for_mobile(scenario)
    print(f"\n📱 Данные для мобильного приложения готовы")
    print(f"   Шагов: {len(mobile_export['steps'])}")
    print(f"   Соответствие личности: {mobile_export['metadata']['personality_match']}%")
    
    print(f"\n🗺️ Multi-Step Scenarios Engine готов!")
    print(f"✅ Фаза 3.2 (Многошаговые сценарии) завершена!")
    print(f"🎯 Продукт трансформирован: рекомендатель → планировщик свиданий")

if __name__ == "__main__":
    main()
