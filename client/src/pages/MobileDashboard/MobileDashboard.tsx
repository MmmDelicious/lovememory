import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Heart, 
  Trophy, 
  Users, 
  Plus,
  ChevronRight,
  Gamepad2,
  BarChart3,
  ChevronLeft,
  Clock,
  MapPin
} from 'lucide-react';
import styles from './MobileDashboard.module.css';

const MobileDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date());

  const upcomingEvents = [
    {
      id: 1,
      title: 'Романтический ужин',
      date: '20 янв',
      time: '19:00',
      type: 'date',
      location: 'Ресторан "Небо"'
    },
    {
      id: 2,
      title: 'Игровой вечер',
      date: '22 янв', 
      time: '20:00',
      type: 'game',
      location: 'Дома'
    },
    {
      id: 3,
      title: 'Прогулка в парке',
      date: '25 янв',
      time: '15:00',
      type: 'walk',
      location: 'Сокольники'
    }
  ];

  const quickStats = [
    { label: 'События', value: '12', icon: Calendar, trend: '+3' },
    { label: 'Игры', value: '8', icon: Gamepad2, trend: '+2' },
    { label: 'Гармония', value: '87%', icon: Heart, trend: '+5%' },
    { label: 'Рейтинг', value: 'Топ 15%', icon: Trophy, trend: '↑2' }
  ];

  // Простой календарь
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Пустые дни в начале
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const hasEvent = (day: number) => {
    // Простая проверка - есть ли события в этот день
    return day === 20 || day === 22 || day === 25;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  if (currentView === 'calendar') {
    return (
      <div className={styles.mobileCalendar}>
        {/* Calendar Header */}
        <div className={styles.calendarHeader}>
          <button 
            className={styles.backButton}
            onClick={() => setCurrentView('dashboard')}
          >
            <ChevronLeft size={24} />
          </button>
          <h1>Календарь</h1>
          <button className={styles.addButton}>
            <Plus size={24} />
          </button>
        </div>

        {/* Month Navigation */}
        <div className={styles.monthNav}>
          <button onClick={() => navigateMonth('prev')}>
            <ChevronLeft size={20} />
          </button>
          <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <button onClick={() => navigateMonth('next')}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className={styles.calendarGrid}>
          {/* Week days header */}
          {weekDays.map(day => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
          
          {/* Calendar days */}
          {getDaysInMonth(currentDate).map((day, index) => (
            <div 
              key={index} 
              className={`${styles.calendarDay} ${
                day ? styles.validDay : styles.emptyDay
              } ${
                day && isToday(day) ? styles.today : ''
              } ${
                day && hasEvent(day) ? styles.hasEvent : ''
              }`}
            >
              {day && (
                <>
                  <span className={styles.dayNumber}>{day}</span>
                  {hasEvent(day) && <div className={styles.eventDot} />}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Events List */}
        <div className={styles.calendarEvents}>
          <h3>Ближайшие события</h3>
          <div className={styles.eventsList}>
            {upcomingEvents.map(event => (
              <div key={event.id} className={styles.calendarEventCard}>
                <div className={styles.eventDate}>
                  <span className={styles.eventDay}>{event.date}</span>
                  <span className={styles.eventTime}>{event.time}</span>
                </div>
                <div className={styles.eventContent}>
                  <h4>{event.title}</h4>
                  <div className={styles.eventMeta}>
                    <span className={styles.eventType}>
                      {event.type === 'date' ? '💕' : event.type === 'game' ? '🎮' : '🚶'}
                    </span>
                    <span className={styles.eventLocation}>
                      <MapPin size={12} />
                      {event.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mobileDashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.greeting}>
          <h1>Привет, Александр! 👋</h1>
          <p>Как дела с любимой?</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.calendarButton}
            onClick={() => setCurrentView('calendar')}
          >
            <Calendar size={24} />
          </button>
          <div className={styles.avatar}>
            <span>А</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsSection}>
        <h2>Статистика</h2>
        <div className={styles.statsGrid}>
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Icon size={20} />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statTrend}>{stat.trend}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Быстрые действия</h2>
        <div className={styles.actionGrid}>
          <Link to="/games" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <Gamepad2 size={24} />
            </div>
            <span>Играть</span>
          </Link>
          
          <button 
            className={styles.actionCard}
            onClick={() => setCurrentView('calendar')}
          >
            <div className={styles.actionIcon}>
              <Plus size={24} />
            </div>
            <span>Событие</span>
          </button>
          
          <Link to="/insights" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <BarChart3 size={24} />
            </div>
            <span>Статистика</span>
          </Link>
          
          <button className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <Users size={24} />
            </div>
            <span>Пара</span>
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className={styles.upcomingSection}>
        <div className={styles.sectionHeader}>
          <h2>Ближайшие события</h2>
          <button 
            className={styles.seeAll}
            onClick={() => setCurrentView('calendar')}
          >
            Все <ChevronRight size={16} />
          </button>
        </div>
        
        <div className={styles.eventsList}>
          {upcomingEvents.slice(0, 3).map(event => (
            <div key={event.id} className={styles.eventCard}>
              <div className={styles.eventDate}>
                <span className={styles.eventDay}>{event.date}</span>
                <span className={styles.eventTime}>{event.time}</span>
              </div>
              <div className={styles.eventContent}>
                <h3>{event.title}</h3>
                <div className={styles.eventMeta}>
                  <span className={styles.eventType}>
                    {event.type === 'date' ? '💕 Свидание' : 
                     event.type === 'game' ? '🎮 Игра' : '🚶 Прогулка'}
                  </span>
                  <span className={styles.eventLocation}>
                    <MapPin size={12} />
                    {event.location}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className={styles.eventArrow} />
            </div>
          ))}
        </div>
      </div>

      {/* Love Quote */}
      <div className={styles.quoteCard}>
        <div className={styles.quoteIcon}>💝</div>
        <blockquote>
          "Большинство супружеских споров невозможно полностью разрешить. 
          Ключ — баланс позитива 5:1."
        </blockquote>
        <cite>— Джон Готтман</cite>
      </div>
    </div>
  );
};

export default MobileDashboard;