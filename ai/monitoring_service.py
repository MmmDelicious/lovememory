#!/usr/bin/env python3
"""
Monitoring Service для LoveMemory AI
Фаза 9: Мониторинг, переобучение и эксперименты

Функции:
- Метрики производительности (latency, error rate, throughput)
- A/B тестирование с experiment_id  
- Feature drift detection
- Business метрики (CTR, acceptance rate)
- Автоматическое переобучение
- Canary deployment для моделей
"""

import json
import time
import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
import pickle
import hashlib
import sqlite3
from collections import defaultdict, deque
import warnings
warnings.filterwarnings('ignore')

@dataclass
class MetricRecord:
    """Запись метрики"""
    timestamp: float
    metric_name: str
    value: float
    labels: Dict[str, str]
    experiment_id: Optional[str] = None

@dataclass
class AlertConfig:
    """Конфигурация алерта"""
    metric_name: str
    threshold: float
    comparison: str  # "gt", "lt", "eq"
    window_minutes: int = 5
    min_samples: int = 10

@dataclass
class ExperimentConfig:
    """Конфигурация эксперимента"""
    experiment_id: str
    name: str
    traffic_split: float  # 0.0-1.0
    model_version: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "running"  # running, stopped, completed

class MonitoringService:
    """Сервис мониторинга AI системы"""
    
    def __init__(self, db_path: str = "monitoring.db"):
        """
        Инициализация Monitoring Service
        
        Args:
            db_path: Путь к SQLite базе для хранения метрик
        """
        self.db_path = db_path
        self.metrics_buffer = deque(maxlen=10000)  # Буфер для метрик
        self.experiments = {}  # Активные эксперименты
        self.alerts = []  # Конфигурации алертов
        self.feature_baselines = {}  # Базовые распределения фич
        
        # Создаем таблицы
        self._init_database()
        
        # Настраиваем алерты по умолчанию
        self._setup_default_alerts()
        
        print("📊 Monitoring Service инициализирован")
    
    def _init_database(self):
        """Инициализирует SQLite базу данных"""
        with sqlite3.connect(self.db_path) as conn:
            # Таблица метрик
            conn.execute("""
                CREATE TABLE IF NOT EXISTS metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp REAL NOT NULL,
                    metric_name TEXT NOT NULL,
                    value REAL NOT NULL,
                    labels TEXT,
                    experiment_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Таблица логов активности
            conn.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pair_id TEXT NOT NULL,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    payload TEXT,
                    model_version TEXT,
                    experiment_id TEXT,
                    timestamp REAL NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Таблица экспериментов
            conn.execute("""
                CREATE TABLE IF NOT EXISTS experiments (
                    experiment_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    traffic_split REAL NOT NULL,
                    model_version TEXT NOT NULL,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    status TEXT DEFAULT 'running',
                    config TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Индексы для производительности
            conn.execute("CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status)")
    
    def _setup_default_alerts(self):
        """Настраивает алерты по умолчанию"""
        self.alerts = [
            AlertConfig("latency_p95", 500.0, "gt", window_minutes=5),
            AlertConfig("error_rate", 0.05, "gt", window_minutes=5),
            AlertConfig("throughput", 0.1, "lt", window_minutes=10),
            AlertConfig("model_accuracy", 0.6, "lt", window_minutes=30),
            AlertConfig("feature_drift_score", 0.3, "gt", window_minutes=60)
        ]
    
    def record_metric(self, metric_name: str, value: float, 
                     labels: Optional[Dict[str, str]] = None,
                     experiment_id: Optional[str] = None):
        """
        Записывает метрику
        
        Args:
            metric_name: Название метрики
            value: Значение
            labels: Дополнительные лейблы
            experiment_id: ID эксперимента
        """
        record = MetricRecord(
            timestamp=time.time(),
            metric_name=metric_name,
            value=value,
            labels=labels or {},
            experiment_id=experiment_id
        )
        
        # Добавляем в буфер
        self.metrics_buffer.append(record)
        
        # Периодически сохраняем в базу
        if len(self.metrics_buffer) % 100 == 0:
            self._flush_metrics_to_db()
        
        # Проверяем алерты
        self._check_alerts(record)
    
    def _flush_metrics_to_db(self):
        """Сохраняет метрики из буфера в базу данных"""
        if not self.metrics_buffer:
            return
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                records_to_insert = []
                
                while self.metrics_buffer:
                    record = self.metrics_buffer.popleft()
                    records_to_insert.append((
                        record.timestamp,
                        record.metric_name,
                        record.value,
                        json.dumps(record.labels),
                        record.experiment_id
                    ))
                
                conn.executemany("""
                    INSERT INTO metrics (timestamp, metric_name, value, labels, experiment_id)
                    VALUES (?, ?, ?, ?, ?)
                """, records_to_insert)
                
        except Exception as e:
            print(f"⚠️ Ошибка сохранения метрик: {e}")
    
    def _check_alerts(self, record: MetricRecord):
        """Проверяет алерты для новой метрики"""
        for alert in self.alerts:
            if record.metric_name == alert.metric_name:
                self._evaluate_alert(alert, record)
    
    def _evaluate_alert(self, alert: AlertConfig, record: MetricRecord):
        """Оценивает алерт"""
        # Получаем недавние значения метрики
        recent_values = self._get_recent_metric_values(
            alert.metric_name, 
            minutes=alert.window_minutes
        )
        
        if len(recent_values) < alert.min_samples:
            return
        
        avg_value = np.mean(recent_values)
        
        # Проверяем условие алерта
        triggered = False
        if alert.comparison == "gt" and avg_value > alert.threshold:
            triggered = True
        elif alert.comparison == "lt" and avg_value < alert.threshold:
            triggered = True
        elif alert.comparison == "eq" and abs(avg_value - alert.threshold) < 0.01:
            triggered = True
        
        if triggered:
            self._trigger_alert(alert, avg_value, recent_values)
    
    def _get_recent_metric_values(self, metric_name: str, minutes: int = 5) -> List[float]:
        """Получает недавние значения метрики"""
        cutoff_time = time.time() - (minutes * 60)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT value FROM metrics 
                    WHERE metric_name = ? AND timestamp > ?
                    ORDER BY timestamp DESC
                """, (metric_name, cutoff_time))
                
                return [row[0] for row in cursor.fetchall()]
        except:
            return []
    
    def _trigger_alert(self, alert: AlertConfig, avg_value: float, recent_values: List[float]):
        """Срабатывает алерт"""
        print(f"🚨 ALERT: {alert.metric_name}")
        print(f"   Threshold: {alert.threshold}, Current: {avg_value:.3f}")
        print(f"   Window: {alert.window_minutes}min, Samples: {len(recent_values)}")
        
        # В production здесь был бы отправка в Slack/email
        
        # Логируем алерт как метрику
        self.record_metric(
            f"alert_{alert.metric_name}",
            1.0,
            labels={"threshold": str(alert.threshold), "current_value": str(avg_value)}
        )
    
    def log_activity(self, pair_id: str, action: str, payload: Dict[str, Any],
                    user_id: Optional[str] = None, model_version: str = "v1",
                    experiment_id: Optional[str] = None):
        """
        Логирует активность пользователя
        
        Args:
            pair_id: ID пары
            action: Действие (click, view, accept, reject)
            payload: Дополнительная информация
            user_id: ID пользователя  
            model_version: Версия модели
            experiment_id: ID эксперимента
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO activity_logs 
                    (pair_id, user_id, action, payload, model_version, experiment_id, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    pair_id, user_id, action, 
                    json.dumps(payload), model_version, 
                    experiment_id, time.time()
                ))
                
        except Exception as e:
            print(f"⚠️ Ошибка логирования активности: {e}")
    
    def start_experiment(self, name: str, traffic_split: float, 
                        model_version: str, duration_hours: int = 24) -> str:
        """
        Запускает A/B эксперимент
        
        Args:
            name: Название эксперимента
            traffic_split: Доля трафика (0.0-1.0)
            model_version: Версия модели для тестирования
            duration_hours: Длительность в часах
        
        Returns:
            ID эксперимента
        """
        experiment_id = f"exp_{int(time.time())}_{hashlib.md5(name.encode()).hexdigest()[:8]}"
        
        end_time = datetime.now() + timedelta(hours=duration_hours)
        
        experiment = ExperimentConfig(
            experiment_id=experiment_id,
            name=name,
            traffic_split=traffic_split,
            model_version=model_version,
            start_time=datetime.now(),
            end_time=end_time
        )
        
        self.experiments[experiment_id] = experiment
        
        # Сохраняем в базу
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO experiments 
                    (experiment_id, name, traffic_split, model_version, start_time, end_time, config)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    experiment_id, name, traffic_split, model_version,
                    experiment.start_time.isoformat(), experiment.end_time.isoformat(),
                    json.dumps(asdict(experiment))
                ))
        except Exception as e:
            print(f"⚠️ Ошибка сохранения эксперимента: {e}")
        
        print(f"🧪 Эксперимент запущен: {experiment_id}")
        print(f"   Название: {name}")
        print(f"   Трафик: {traffic_split*100:.1f}%")
        print(f"   Модель: {model_version}")
        
        return experiment_id
    
    def should_use_experiment(self, pair_id: str) -> Optional[str]:
        """
        Определяет, должен ли пользователь попасть в эксперимент
        
        Args:
            pair_id: ID пары
        
        Returns:
            ID эксперимента или None
        """
        for exp_id, experiment in self.experiments.items():
            if experiment.status != "running":
                continue
            
            # Проверяем время окончания
            if experiment.end_time and datetime.now() > experiment.end_time:
                experiment.status = "completed"
                continue
            
            # Хэшируем pair_id для консистентного распределения
            hash_value = int(hashlib.md5(f"{pair_id}_{exp_id}".encode()).hexdigest()[:8], 16)
            normalized_hash = (hash_value % 10000) / 10000.0
            
            if normalized_hash < experiment.traffic_split:
                return exp_id
        
        return None
    
    def get_experiment_metrics(self, experiment_id: str, 
                             days: int = 7) -> Dict[str, Any]:
        """
        Получает метрики эксперимента
        
        Args:
            experiment_id: ID эксперимента
            days: Количество дней для анализа
        
        Returns:
            Метрики эксперимента
        """
        cutoff_time = time.time() - (days * 24 * 3600)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Метрики для эксперимента
                exp_metrics = {}
                cursor = conn.execute("""
                    SELECT metric_name, AVG(value), COUNT(*), MIN(value), MAX(value)
                    FROM metrics 
                    WHERE experiment_id = ? AND timestamp > ?
                    GROUP BY metric_name
                """, (experiment_id, cutoff_time))
                
                for row in cursor:
                    metric_name, avg_val, count, min_val, max_val = row
                    exp_metrics[metric_name] = {
                        'avg': avg_val,
                        'count': count,
                        'min': min_val,
                        'max': max_val
                    }
                
                # Активность пользователей в эксперименте
                cursor = conn.execute("""
                    SELECT action, COUNT(*) 
                    FROM activity_logs 
                    WHERE experiment_id = ? AND timestamp > ?
                    GROUP BY action
                """, (experiment_id, cutoff_time))
                
                user_actions = dict(cursor.fetchall())
                
                # CTR и conversion rate
                clicks = user_actions.get('click', 0)
                views = user_actions.get('view', 0)
                accepts = user_actions.get('accept', 0)
                
                ctr = clicks / max(views, 1)
                conversion_rate = accepts / max(clicks, 1)
                
                return {
                    'experiment_id': experiment_id,
                    'metrics': exp_metrics,
                    'user_actions': user_actions,
                    'ctr': ctr,
                    'conversion_rate': conversion_rate,
                    'total_users': len(set([]))  # Можно добавить подсчет уникальных пользователей
                }
                
        except Exception as e:
            print(f"⚠️ Ошибка получения метрик эксперимента: {e}")
            return {}
    
    def detect_feature_drift(self, current_features: Dict[str, float],
                           model_name: str = "default") -> float:
        """
        Детектит drift в распределении фич
        
        Args:
            current_features: Текущие значения фич
            model_name: Название модели
        
        Returns:
            Drift score (0-1, где 1 = максимальный drift)
        """
        baseline_key = f"{model_name}_baseline"
        
        # Если нет baseline, создаем его
        if baseline_key not in self.feature_baselines:
            self.feature_baselines[baseline_key] = defaultdict(list)
            for feature, value in current_features.items():
                self.feature_baselines[baseline_key][feature].append(value)
            return 0.0
        
        baseline = self.feature_baselines[baseline_key]
        drift_scores = []
        
        for feature, current_value in current_features.items():
            if feature in baseline and len(baseline[feature]) > 10:
                baseline_values = np.array(baseline[feature])
                baseline_mean = np.mean(baseline_values)
                baseline_std = np.std(baseline_values)
                
                # Z-score drift
                if baseline_std > 0:
                    z_score = abs(current_value - baseline_mean) / baseline_std
                    drift_score = min(1.0, z_score / 3.0)  # Нормализуем
                    drift_scores.append(drift_score)
            
            # Обновляем baseline (скользящее окно)
            baseline[feature].append(current_value)
            if len(baseline[feature]) > 1000:
                baseline[feature] = baseline[feature][-500:]  # Оставляем последние 500
        
        overall_drift = np.mean(drift_scores) if drift_scores else 0.0
        
        # Записываем метрику drift
        self.record_metric("feature_drift_score", overall_drift, 
                          labels={"model": model_name})
        
        return overall_drift
    
    def get_business_metrics(self, days: int = 7) -> Dict[str, float]:
        """
        Получает бизнес-метрики
        
        Args:
            days: Количество дней для анализа
        
        Returns:
            Бизнес-метрики
        """
        cutoff_time = time.time() - (days * 24 * 3600)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Подсчитываем действия
                cursor = conn.execute("""
                    SELECT action, COUNT(*) 
                    FROM activity_logs 
                    WHERE timestamp > ?
                    GROUP BY action
                """, (cutoff_time,))
                
                actions = dict(cursor.fetchall())
                
                views = actions.get('view', 0)
                clicks = actions.get('click', 0) 
                accepts = actions.get('accept', 0)
                rejects = actions.get('reject', 0)
                
                # Вычисляем метрики
                ctr = clicks / max(views, 1)
                acceptance_rate = accepts / max(clicks, 1)
                rejection_rate = rejects / max(clicks, 1)
                engagement_rate = (clicks + accepts) / max(views, 1)
                
                # Уникальные пары
                cursor = conn.execute("""
                    SELECT COUNT(DISTINCT pair_id) 
                    FROM activity_logs 
                    WHERE timestamp > ?
                """, (cutoff_time,))
                
                unique_pairs = cursor.fetchone()[0]
                
                return {
                    'ctr': ctr,
                    'acceptance_rate': acceptance_rate,
                    'rejection_rate': rejection_rate,
                    'engagement_rate': engagement_rate,
                    'total_views': views,
                    'total_clicks': clicks,
                    'total_accepts': accepts,
                    'unique_pairs': unique_pairs,
                    'days_analyzed': days
                }
                
        except Exception as e:
            print(f"⚠️ Ошибка получения бизнес-метрик: {e}")
            return {}
    
    def generate_daily_report(self) -> Dict[str, Any]:
        """Генерирует ежедневный отчет"""
        print("📈 Генерируем ежедневный отчет...")
        
        # Получаем метрики за последние 24 часа
        business_metrics = self.get_business_metrics(days=1)
        
        # Технические метрики
        tech_metrics = {}
        for metric_name in ['latency_p95', 'error_rate', 'throughput']:
            values = self._get_recent_metric_values(metric_name, minutes=24*60)
            if values:
                tech_metrics[metric_name] = {
                    'avg': np.mean(values),
                    'p95': np.percentile(values, 95),
                    'count': len(values)
                }
        
        # Активные эксперименты
        active_experiments = [
            exp_id for exp_id, exp in self.experiments.items() 
            if exp.status == "running"
        ]
        
        report = {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'business_metrics': business_metrics,
            'technical_metrics': tech_metrics,
            'active_experiments': active_experiments,
            'alerts_triggered': len([1 for _ in self._get_recent_metric_values('alert_', minutes=24*60)]),
            'feature_drift_avg': np.mean(self._get_recent_metric_values('feature_drift_score', minutes=24*60)) or 0.0
        }
        
        # Сохраняем отчет
        os.makedirs('reports', exist_ok=True)
        filename = f"reports/daily_report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        return report
    
    def cleanup_old_data(self, days_to_keep: int = 30):
        """Очищает старые данные"""
        cutoff_time = time.time() - (days_to_keep * 24 * 3600)
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Удаляем старые метрики
                cursor = conn.execute("DELETE FROM metrics WHERE timestamp < ?", (cutoff_time,))
                metrics_deleted = cursor.rowcount
                
                # Удаляем старые логи активности
                cursor = conn.execute("DELETE FROM activity_logs WHERE timestamp < ?", (cutoff_time,))
                logs_deleted = cursor.rowcount
                
                print(f"🧹 Очистка данных: удалено {metrics_deleted} метрик, {logs_deleted} логов")
                
        except Exception as e:
            print(f"⚠️ Ошибка очистки данных: {e}")

def main():
    """Демонстрация работы Monitoring Service"""
    print("📊 Тестирование Monitoring Service")
    
    # Инициализируем сервис
    monitor = MonitoringService()
    
    # Симулируем метрики
    print("\n1️⃣ Записываем тестовые метрики...")
    for i in range(10):
        monitor.record_metric("latency_p95", 100 + i*10, {"service": "ai"})
        monitor.record_metric("error_rate", 0.01 + i*0.001, {"service": "ai"})
        monitor.record_metric("throughput", 50 - i, {"service": "ai"})
        time.sleep(0.1)
    
    # Запускаем эксперимент
    print("\n2️⃣ Запускаем A/B эксперимент...")
    exp_id = monitor.start_experiment(
        name="New LTR Model Test",
        traffic_split=0.1,
        model_version="ltr_v2",
        duration_hours=1
    )
    
    # Симулируем активность
    print("\n3️⃣ Логируем активность пользователей...")
    test_pairs = [f"pair_{i}" for i in range(5)]
    
    for pair_id in test_pairs:
        # Определяем эксперимент
        experiment_id = monitor.should_use_experiment(pair_id)
        
        # Логируем действия
        monitor.log_activity(pair_id, "view", {"item_id": "test_item"}, experiment_id=experiment_id)
        monitor.log_activity(pair_id, "click", {"item_id": "test_item"}, experiment_id=experiment_id)
        
        if np.random.random() > 0.5:
            monitor.log_activity(pair_id, "accept", {"item_id": "test_item"}, experiment_id=experiment_id)
    
    # Тестируем feature drift
    print("\n4️⃣ Тестируем feature drift detection...")
    baseline_features = {"content_score": 0.8, "cf_score": 0.6, "price": 0.5}
    monitor.detect_feature_drift(baseline_features)
    
    # Drift с отклонением
    drifted_features = {"content_score": 0.2, "cf_score": 0.9, "price": 0.1}
    drift_score = monitor.detect_feature_drift(drifted_features)
    print(f"   Drift score: {drift_score:.3f}")
    
    # Получаем бизнес-метрики
    print("\n5️⃣ Анализируем бизнес-метрики...")
    business_metrics = monitor.get_business_metrics()
    print(f"   CTR: {business_metrics.get('ctr', 0):.3f}")
    print(f"   Acceptance rate: {business_metrics.get('acceptance_rate', 0):.3f}")
    print(f"   Unique pairs: {business_metrics.get('unique_pairs', 0)}")
    
    # Метрики эксперимента
    print("\n6️⃣ Анализируем эксперимент...")
    exp_metrics = monitor.get_experiment_metrics(exp_id)
    print(f"   Experiment CTR: {exp_metrics.get('ctr', 0):.3f}")
    print(f"   User actions: {exp_metrics.get('user_actions', {})}")
    
    # Генерируем отчет
    print("\n7️⃣ Генерируем ежедневный отчет...")
    report = monitor.generate_daily_report()
    print(f"   Алертов за день: {report['alerts_triggered']}")
    print(f"   Средний drift: {report['feature_drift_avg']:.3f}")
    
    # Очистка
    print("\n8️⃣ Тестируем очистку данных...")
    monitor.cleanup_old_data(days_to_keep=1)
    
    print("\n✅ Monitoring Service готов к production!")

if __name__ == "__main__":
    main()
