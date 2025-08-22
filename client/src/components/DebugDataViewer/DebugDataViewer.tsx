import React, { useState, useEffect } from 'react';
import placesService from '../../services/places.service';
import eventsAfisha from '../../services/eventsAfisha.service';
import styles from './DebugDataViewer.module.css';
interface DebugDataViewerProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  coordinates?: { latitude: number; longitude: number };
}
const DebugDataViewer: React.FC<DebugDataViewerProps> = ({ 
  isOpen, 
  onClose, 
  city, 
  coordinates 
}) => {
  const [data, setData] = useState<any>({
    activities: [],
    restaurants: [],
    events: [],
    loading: true
  });
  useEffect(() => {
    if (isOpen && coordinates) {
      fetchData();
    }
  }, [isOpen, coordinates, city]);
  const fetchData = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const [activities, restaurants, events] = await Promise.all([
        placesService.searchActivities(city, coordinates!, { radius: 8000, limit: 15 }),
        placesService.searchRestaurants(city, coordinates!, { 
          radius: 5000, 
          limit: 15, 
          includeAntiCafes: true 
        }),
        eventsAfisha.searchEvents(city, 14)
      ]);
      setData({
        activities,
        restaurants,
        events,
        loading: false
      });
      console.log('=== ПОЛНЫЕ ДАННЫЕ ДЛЯ ОТЛАДКИ ===');
      console.log('Город:', city);
      console.log('Координаты:', coordinates);
      console.log('Активности найдено:', activities.length);
      console.log('Активности:', activities);
      console.log('Рестораны найдено:', restaurants.length);
      console.log('Рестораны:', restaurants);
      console.log('События найдено:', events.length);
      console.log('События:', events);
      console.log('====================================');
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };
  const formatData = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };
  if (!isOpen) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🔍 Отладка данных для города: {city}</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.content}>
          {data.loading ? (
            <div className={styles.loading}>Загружаю данные...</div>
          ) : (
            <div className={styles.sections}>
              <div className={styles.section}>
                <h3>🎯 Активности ({data.activities.length})</h3>
                <div className={styles.summary}>
                  {data.activities.length > 0 ? (
                    <ul>
                      {data.activities.slice(0, 5).map((activity: any, idx: number) => (
                        <li key={idx}>
                          <strong>{activity.name}</strong> - {activity.type} 
                          {activity.rating && ` (${activity.rating}★)`}
                          {activity.distance && ` - ${activity.distance}км`}
                        </li>
                      ))}
                      {data.activities.length > 5 && <li>... и еще {data.activities.length - 5}</li>}
                    </ul>
                  ) : (
                    <p>Активности не найдены</p>
                  )}
                </div>
                <details>
                  <summary>Показать полные данные</summary>
                  <pre className={styles.jsonData}>{formatData(data.activities)}</pre>
                </details>
              </div>
              <div className={styles.section}>
                <h3>🍽️ Рестораны и кафе ({data.restaurants.length})</h3>
                <div className={styles.summary}>
                  {data.restaurants.length > 0 ? (
                    <ul>
                      {data.restaurants.slice(0, 5).map((restaurant: any, idx: number) => (
                        <li key={idx}>
                          <strong>{restaurant.name}</strong> - {restaurant.cuisine || 'общая кухня'}
                          {restaurant.rating && ` (${restaurant.rating}★)`}
                          {restaurant.distance && ` - ${restaurant.distance}км`}
                        </li>
                      ))}
                      {data.restaurants.length > 5 && <li>... и еще {data.restaurants.length - 5}</li>}
                    </ul>
                  ) : (
                    <p>Рестораны не найдены</p>
                  )}
                </div>
                <details>
                  <summary>Показать полные данные</summary>
                  <pre className={styles.jsonData}>{formatData(data.restaurants)}</pre>
                </details>
              </div>
              <div className={styles.section}>
                <h3>🎭 События и афиша ({data.events.length})</h3>
                <div className={styles.summary}>
                  {data.events.length > 0 ? (
                    <ul>
                      {data.events.slice(0, 5).map((event: any, idx: number) => (
                        <li key={idx}>
                          <strong>{event.title}</strong> - {event.category}
                          <br />
                          <small>{event.price} | {event.location} | {event.source}</small>
                        </li>
                      ))}
                      {data.events.length > 5 && <li>... и еще {data.events.length - 5}</li>}
                    </ul>
                  ) : (
                    <p>События не найдены</p>
                  )}
                </div>
                <details>
                  <summary>Показать полные данные</summary>
                  <pre className={styles.jsonData}>{formatData(data.events)}</pre>
                </details>
              </div>
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button onClick={fetchData} className={styles.refreshButton} disabled={data.loading}>
            🔄 Обновить данные
          </button>
          <p className={styles.note}>
            💡 Данные также выводятся в консоль браузера (F12)
          </p>
        </div>
      </div>
    </div>
  );
};
export default DebugDataViewer;

