import api from './api';

class PlacesService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 1000 * 60 * 30; // 30 минут
  }

  // Получение текущего местоположения пользователя
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 минут
        }
      );
    });
  }

  // Получение города по координатам
  async getCityFromCoordinates(latitude, longitude) {
    const cacheKey = `city_${latitude}_${longitude}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Используем OpenStreetMap Nominatim API (бесплатный)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'LoveMemory-DateGenerator/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to get city');
      
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || 'Неизвестный город';
      const country = data.address?.country || 'Неизвестная страна';
      
      const result = {
        city,
        country,
        displayName: data.display_name,
        coordinates: { latitude, longitude }
      };
      
      this.setCache(cacheKey, result);
      return result;
      
    } catch (error) {
      console.error('Error getting city:', error);
      throw error;
    }
  }

  // Поиск ресторанов и кафе через Overpass API (OpenStreetMap)
  async searchRestaurants(city, coordinates, options = {}) {
    const {
      radius = 5000, // 5 км
      cuisine = null,
      priceRange = null,
      limit = 20,
      includeAntiCafes = false
    } = options;

    const cacheKey = `restaurants_${city}_${cuisine}_${priceRange}_${radius}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Overpass API запрос для поиска ресторанов, кафе и антикафе
      let queries = [
        // Рестораны
        `node["amenity"="restaurant"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `way["amenity"="restaurant"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Кафе
        `node["amenity"="cafe"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `way["amenity"="cafe"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Бары
        `node["amenity"="bar"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Пиццерии
        `node["amenity"="fast_food"]["cuisine"="pizza"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Фуд-корты
        `node["amenity"="food_court"](around:${radius},${coordinates.latitude},${coordinates.longitude});`
      ];

      if (includeAntiCafes) {
        queries.push(
          // Антикафе (игровые кафе)
          `node["amenity"="cafe"]["cafe"="board_game"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
          `node["amenity"="cafe"]["leisure"="adult_gaming_centre"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
          // Тайм-кафе
          `node["amenity"="cafe"]["payment:time"="yes"](around:${radius},${coordinates.latitude},${coordinates.longitude});`
        );
      }

      const overpassQuery = `
        [out:json][timeout:30];
        (
          ${queries.join('\n          ')}
        );
        out center meta;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) throw new Error('Failed to fetch restaurants');

      const data = await response.json();
      const restaurants = this.processRestaurantData(data.elements, coordinates);
      
      // Фильтруем и сортируем
      let filteredRestaurants = restaurants.filter(r => r.name);
      
      if (cuisine) {
        filteredRestaurants = filteredRestaurants.filter(r => 
          r.cuisine?.toLowerCase().includes(cuisine.toLowerCase())
        );
      }

      // Сортируем по расстоянию и добавляем псевдо-рейтинг
      filteredRestaurants = filteredRestaurants
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(restaurant => ({
          ...restaurant,
          rating: this.generatePseudoRating(restaurant),
          atmosphere: this.determineAtmosphere(restaurant),
          budget: this.determineBudget(restaurant)
        }));

      this.setCache(cacheKey, filteredRestaurants);
      return filteredRestaurants;

    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw error;
    }
  }

  // Поиск развлечений и активностей
  async searchActivities(city, coordinates, options = {}) {
    const {
      radius = 10000, // 10 км для активностей
      type = null,
      limit = 15
    } = options;

    const cacheKey = `activities_${city}_${type}_${radius}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Поиск коммерческих заведений и развлечений (фокус на работающих местах)
      const queries = [
        // Торговые центры
        `way["shop"="mall"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["shop"="mall"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `way["amenity"="marketplace"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Кинотеатры (коммерческие)
        `node["amenity"="cinema"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Антикафе и игровые заведения
        `node["amenity"="cafe"]["cafe"="board_game"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["leisure"="adult_gaming_centre"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["amenity"="game_feeding"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Боулинг и развлекательные центры
        `node["sport"="bowling"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["leisure"="amusement_arcade"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Картинг
        `node["sport"="karting"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Бильярд
        `node["sport"="billiards"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Караоке
        `node["amenity"="karaoke"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Спа и массаж
        `node["leisure"="spa"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["shop"="massage"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Квесты
        `node["leisure"="escape_game"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Театры (коммерческие)
        `node["amenity"="theatre"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Музеи (платные)
        `node["tourism"="museum"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Спортивные центры
        `node["leisure"="sports_centre"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["leisure"="fitness_centre"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Ночные клубы
        `node["amenity"="nightclub"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        // Парки развлечений
        `node["leisure"="water_park"](around:${radius},${coordinates.latitude},${coordinates.longitude});`,
        `node["leisure"="theme_park"](around:${radius},${coordinates.latitude},${coordinates.longitude});`
      ];

      const overpassQuery = `
        [out:json][timeout:30];
        (
          ${queries.join('\n          ')}
        );
        out center meta;
      `;

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();
      const activities = this.processActivityData(data.elements, coordinates);
      
      // Фильтруем и обогащаем данными
      let filteredActivities = activities
        .filter(a => a.name)
        .slice(0, limit)
        .map(activity => ({
          ...activity,
          rating: this.generatePseudoRating(activity),
          duration: this.estimateDuration(activity),
          budget: this.determineBudgetForActivity(activity),
          atmosphere: this.determineActivityAtmosphere(activity)
        }));

      this.setCache(cacheKey, filteredActivities);
      return filteredActivities;

    } catch (error) {
      console.error('Error searching activities:', error);
      throw error;
    }
  }

  // Обработка данных ресторанов
  processRestaurantData(elements, userCoords) {
    return elements.map(element => {
      const coords = element.center || { lat: element.lat, lon: element.lon };
      const distance = this.calculateDistance(
        userCoords.latitude, userCoords.longitude,
        coords.lat, coords.lon
      );

      return {
        id: element.id,
        name: element.tags?.name || 'Безымянный ресторан',
        cuisine: element.tags?.cuisine || 'general',
        address: this.formatAddress(element.tags),
        phone: element.tags?.phone,
        website: element.tags?.website,
        coordinates: coords,
        distance: Math.round(distance * 100) / 100,
        openingHours: element.tags?.opening_hours,
        wheelchairAccess: element.tags?.wheelchair === 'yes',
        tags: element.tags || {}
      };
    });
  }

  // Обработка данных активностей
  processActivityData(elements, userCoords) {
    return elements.map(element => {
      const coords = element.center || { lat: element.lat, lon: element.lon };
      const distance = this.calculateDistance(
        userCoords.latitude, userCoords.longitude,
        coords.lat, coords.lon
      );

              const type = this.determineActivityType(element.tags);

        return {
          id: element.id,
          name: element.tags?.name || this.generateDefaultName(type, element.tags),
          type,
          address: this.formatAddress(element.tags),
          phone: element.tags?.phone,
          website: element.tags?.website,
          coordinates: coords,
          distance: Math.round(distance * 100) / 100,
          openingHours: element.tags?.opening_hours,
          wheelchairAccess: element.tags?.wheelchair === 'yes',
          tags: element.tags || {}
        };
    });
  }

  // Определение типа активности
  determineActivityType(tags) {
    if (tags.amenity === 'cinema') return 'entertainment';
    if (tags.tourism === 'museum') return 'cultural';
    if (tags.amenity === 'theatre') return 'cultural';
    if (tags.leisure === 'park' || tags.leisure === 'garden') return 'outdoor';
    if (tags.place === 'square') return 'outdoor';
    if (tags.tourism === 'viewpoint') return 'outdoor';
    if (tags.amenity === 'fountain') return 'outdoor';
    if (tags.highway === 'pedestrian') return 'outdoor';
    if (tags.waterway === 'riverbank') return 'outdoor';
    if (tags.historic || tags.tourism === 'attraction') return 'cultural';
    if (tags.leisure === 'sports_centre') return 'active';
    if (tags.sport === 'bowling') return 'active';
    if (tags.sport === 'karting') return 'active';
    if (tags.leisure === 'water_park') return 'active';
    return 'entertainment';
  }

  // Форматирование адреса
  formatAddress(tags) {
    const parts = [];
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    return parts.join(', ') || 'Адрес не указан';
  }

  // Вычисление расстояния между координатами (формула гаверсинуса)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // Генерация названий по умолчанию для мест без названия
  generateDefaultName(type, tags) {
    const defaultNames = {
      entertainment: 'Развлекательный центр',
      cultural: 'Культурное место',
      outdoor: 'Место для прогулки',
      active: 'Спортивный центр'
    };

    // Специальные случаи
    if (tags.leisure === 'park') return 'Парк';
    if (tags.leisure === 'garden') return 'Сад';
    if (tags.place === 'square') return 'Площадь';
    if (tags.tourism === 'viewpoint') return 'Смотровая площадка';
    if (tags.amenity === 'fountain') return 'Фонтан';
    if (tags.highway === 'pedestrian') return 'Пешеходная улица';
    if (tags.waterway === 'riverbank') return 'Набережная';
    if (tags.historic) return 'Историческое место';
    if (tags.tourism === 'attraction') return 'Достопримечательность';

    return defaultNames[type] || 'Интересное место';
  }

  // Генерация псевдо-рейтинга на основе доступных данных
  generatePseudoRating(place) {
    let rating = 3.5; // Базовый рейтинг

    // Увеличиваем рейтинг для мест с полной информацией
    if (place.phone) rating += 0.2;
    if (place.website) rating += 0.3;
    if (place.openingHours) rating += 0.2;
    if (place.wheelchairAccess) rating += 0.1;

    // Снижаем рейтинг для далеких мест
    if (place.distance > 3) rating -= 0.2;
    if (place.distance > 7) rating -= 0.3;

    // Добавляем случайность для реалистичности
    rating += (Math.random() - 0.5) * 0.6;

    return Math.max(3.0, Math.min(5.0, Math.round(rating * 10) / 10));
  }

  // Определение атмосферы ресторана
  determineAtmosphere(restaurant) {
    const name = restaurant.name.toLowerCase();
    const cuisine = restaurant.cuisine?.toLowerCase() || '';
    
    if (name.includes('кафе') || name.includes('coffee')) return 'intimate';
    if (cuisine.includes('fine') || name.includes('ресторан')) return 'romantic';
    if (name.includes('пиццерия') || name.includes('бургер')) return 'fun';
    if (cuisine.includes('japanese') || cuisine.includes('sushi')) return 'stylish';
    
    return 'cozy';
  }

  // Определение бюджета ресторана
  determineBudget(restaurant) {
    const name = restaurant.name.toLowerCase();
    const cuisine = restaurant.cuisine?.toLowerCase() || '';
    
    if (name.includes('макдональдс') || name.includes('kfc') || name.includes('burger king')) return 'low';
    if (name.includes('ресторан') && (cuisine.includes('fine') || cuisine.includes('french'))) return 'high';
    if (cuisine.includes('sushi') || cuisine.includes('japanese')) return 'medium';
    
    return 'medium';
  }

  // Оценка продолжительности активности
  estimateDuration(activity) {
    switch (activity.type) {
      case 'entertainment':
        if (activity.name.toLowerCase().includes('кино')) return 2.5;
        return 2;
      case 'cultural':
        return 2;
      case 'outdoor':
        return 3;
      case 'active':
        return 2;
      default:
        return 1.5;
    }
  }

  // Определение бюджета для активности
  determineBudgetForActivity(activity) {
    switch (activity.type) {
      case 'outdoor':
        return 'free';
      case 'cultural':
        return 'low';
      case 'entertainment':
        return 'medium';
      case 'active':
        return 'medium';
      default:
        return 'low';
    }
  }

  // Определение атмосферы активности
  determineActivityAtmosphere(activity) {
    switch (activity.type) {
      case 'cultural':
        return 'intellectual';
      case 'outdoor':
        return 'relaxed';
      case 'active':
        return 'exciting';
      case 'entertainment':
        return 'fun';
      default:
        return 'balanced';
    }
  }

  // Кэширование
  getFromCache(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheExpiry) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Очистка кэша
  clearCache() {
    this.cache.clear();
  }
}

export default new PlacesService();
