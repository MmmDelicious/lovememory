import React from 'react';
import { YMaps, Map, Placemark, Polyline } from '@pbe/react-yandex-maps';
import { Place } from '../../api/map';
import styles from './DateRouteMap.module.css';

interface DateRouteMapProps {
  places: Place[];
  routeGeometry?: [number, number][];
  height?: string;
  showRoute?: boolean;
}

const DateRouteMap: React.FC<DateRouteMapProps> = ({ 
  places, 
  routeGeometry, 
  height = '400px',
  showRoute = true 
}) => {
  if (!places || places.length === 0) {
    return (
      <div className={styles.mapContainer} style={{ height }}>
        <div className={styles.emptyState}>
          <p>Нет мест для отображения</p>
        </div>
      </div>
    );
  }

  const mapState = {
    center: places[0].coordinates,
    zoom: places.length === 1 ? 16 : 12,
    controls: ['zoomControl', 'fullscreenControl'],
  };

  const getPlacemarkContent = (place: Place, index: number) => {
    return `
      <div style="min-width: 150px; padding: 5px;">
        <h4 style="margin: 0 0 8px 0; color: #1da1f2; font-size: 14px;">${index + 1}. ${place.name}</h4>
        ${place.address ? `<p style="margin: 0; color: #657786; font-size: 12px;">${place.address}</p>` : ''}
      </div>
    `;
  };

  return (
    <div className={styles.mapContainer} style={{ height }}>
      <YMaps query={{ apikey: import.meta.env.VITE_YANDEX_API, lang: 'ru_RU' }}>
        <Map 
          defaultState={mapState} 
          width="100%" 
          height="100%"
          modules={['control.ZoomControl', 'control.FullscreenControl', 'geoObject.addon.balloon']}
        >
          {places.map((place, index) => (
            <Placemark
              key={place.id}
              geometry={place.coordinates}
              properties={{
                balloonContentBody: getPlacemarkContent(place, index),
              }}
              options={{
                preset: 'islands#blueCircleDotIcon',
              }}
            />
          ))}

          {showRoute && routeGeometry && routeGeometry.length > 1 && (
            <Polyline
              geometry={routeGeometry}
              options={{
                strokeColor: '#1da1f2',
                strokeWidth: 5,
                strokeOpacity: 0.8,
              }}
            />
          )}
        </Map>
      </YMaps>
      
      <div className={styles.placesInfo}>
        <h4>Маршрут свидания:</h4>
        <div className={styles.placesList}>
          {places.map((place, index) => (
            <div key={place.id} className={styles.placeItem}>
              <span className={styles.placeNumber}>{index + 1}</span>
              <div className={styles.placeDetails}>
                <strong>{place.name}</strong>
                {place.address && (
                  <div className={styles.placeAddress}>{place.address}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateRouteMap;
