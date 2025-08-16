class PlaceEnhancerService {
  constructor() {
    this.visitedPlaces = new Set(); // История посещенных мест для этой сессии
    this.diversityWeight = 0.7; // Вес разнообразия в алгоритме подбора
    this.categoryDistribution = new Map(); // Распределение категорий для баланса
  }

  // Генерация умного описания места
  generatePlaceDescription(place) {
    const type = place.type;
    const name = place.name?.toLowerCase() || '';
    const tags = place.tags || {};
    
    // Базовые описания по типам
    const baseDescriptions = {
      entertainment: this.getEntertainmentDescription(place),
      cultural: this.getCulturalDescription(place),
      outdoor: this.getOutdoorDescription(place),
      active: this.getActiveDescription(place),
      restaurant: this.getRestaurantDescription(place),
      cafe: this.getCafeDescription(place)
    };

    let description = baseDescriptions[type] || this.getGenericDescription(place);
    
    // Добавляем детали на основе тегов
    description += this.addContextualDetails(place);
    
    // Добавляем информацию о доступности
    if (place.wheelchairAccess) {
      description += " Доступно для людей с ограниченными возможностями.";
    }
    
    // Добавляем информацию о рейтинге
    if (place.rating && place.rating >= 4.0) {
      description += ` Высоко оценено посетителями (${place.rating}★).`;
    }
    
    return description;
  }

  // Описания для развлекательных мест
  getEntertainmentDescription(place) {
    const name = place.name?.toLowerCase() || '';
    
    if (name.includes('кино') || name.includes('cinema')) {
      return "Современный кинотеатр с комфортными залами и новейшими фильмами.";
    }
    
    if (name.includes('боулинг') || place.tags?.sport === 'bowling') {
      return "Боулинг-центр для активного отдыха и веселого времяпрепровождения.";
    }
    
    if (name.includes('карт') || place.tags?.sport === 'karting') {
      return "Картинг-центр для любителей скорости и адреналина.";
    }
    
    if (place.tags?.leisure === 'water_park') {
      return "Аквапарк с горками, бассейнами и водными развлечениями.";
    }
    
    return "Развлекательный центр для приятного досуга и отдыха.";
  }

  // Описания для культурных мест
  getCulturalDescription(place) {
    const name = place.name?.toLowerCase() || '';
    const tags = place.tags || {};
    
    if (tags.tourism === 'museum') {
      if (name.includes('искус') || name.includes('художеств')) {
        return "Художественный музей с коллекцией произведений искусства.";
      }
      if (name.includes('истор')) {
        return "Исторический музей, рассказывающий о прошлом города и страны.";
      }
      if (name.includes('наук') || name.includes('технич')) {
        return "Музей науки и техники с интерактивными экспозициями.";
      }
      return "Музей с интересной экспозицией и познавательными выставками.";
    }
    
    if (tags.amenity === 'theatre') {
      return "Театр, где можно насладиться спектаклями и театральным искусством.";
    }
    
    if (tags.historic || tags.tourism === 'attraction') {
      return "Историческая достопримечательность с богатой культурной ценностью.";
    }
    
    return "Культурное место для расширения кругозора и духовного развития.";
  }

  // Описания для уличных мест
  getOutdoorDescription(place) {
    const tags = place.tags || {};
    const name = place.name?.toLowerCase() || '';
    
    if (tags.leisure === 'park') {
      if (name.includes('центр') || name.includes('главн')) {
        return "Центральный парк города - идеальное место для романтических прогулок.";
      }
      if (name.includes('детск')) {
        return "Семейный парк с детскими площадками и зонами отдыха.";
      }
      return "Зеленый парк с аллеями, скамейками и красивой природой.";
    }
    
    if (tags.leisure === 'garden') {
      return "Ботанический сад с разнообразными растениями и уютными дорожками.";
    }
    
    if (tags.place === 'square') {
      return "Городская площадь - место встреч и прогулок в центре города.";
    }
    
    if (tags.tourism === 'viewpoint') {
      return "Смотровая площадка с панорамным видом на город.";
    }
    
    if (tags.amenity === 'fountain') {
      return "Красивый фонтан - романтичное место для фотографий и отдыха.";
    }
    
    if (tags.waterway === 'riverbank') {
      return "Набережная для неспешных прогулок вдоль воды.";
    }
    
    if (tags.highway === 'pedestrian') {
      return "Пешеходная улица с магазинами, кафе и уличной атмосферой.";
    }
    
    return "Место для прогулок на свежем воздухе и единения с природой.";
  }

  // Описания для активных мест
  getActiveDescription(place) {
    const tags = place.tags || {};
    
    if (tags.leisure === 'sports_centre') {
      return "Спортивный центр с различными видами активности и тренажерами.";
    }
    
    return "Место для активного отдыха и занятий спортом.";
  }

  // Описания для ресторанов
  getRestaurantDescription(place) {
    const name = place.name?.toLowerCase() || '';
    const cuisine = place.cuisine?.toLowerCase() || '';
    
    if (cuisine.includes('sushi') || cuisine.includes('japanese')) {
      return "Японский ресторан с аутентичными суши и традиционной кухней.";
    }
    
    if (cuisine.includes('italian')) {
      return "Итальянский ресторан с пастой, пиццей и средиземноморской атмосферой.";
    }
    
    if (cuisine.includes('french')) {
      return "Французский ресторан с изысканной кухней и романтичной обстановкой.";
    }
    
    if (cuisine.includes('georgian')) {
      return "Грузинский ресторан с хинкали, хачапури и домашней атмосферой.";
    }
    
    if (name.includes('макдональдс') || name.includes('kfc') || name.includes('burger king')) {
      return "Ресторан быстрого питания для быстрого и недорогого перекуса.";
    }
    
    if (name.includes('премиум') || name.includes('fine') || cuisine.includes('fine')) {
      return "Премиальный ресторан с изысканной кухней и высоким уровнем сервиса.";
    }
    
    return "Ресторан с разнообразным меню и приятной атмосферой для ужина.";
  }

  // Описания для кафе
  getCafeDescription(place) {
    const name = place.name?.toLowerCase() || '';
    
    if (name.includes('coffee') || name.includes('кофе')) {
      return "Уютная кофейня с ароматным кофе и камерной атмосферой.";
    }
    
    if (name.includes('чай') || name.includes('tea')) {
      return "Чайная с большим выбором сортов чая и спокойной обстановкой.";
    }
    
    return "Кафе для приятного общения за чашкой кофе или чая.";
  }

  // Общее описание
  getGenericDescription(place) {
    return "Интересное место, которое стоит посетить вместе.";
  }

  // Добавление контекстуальных деталей
  addContextualDetails(place) {
    let details = "";
    const tags = place.tags || {};
    
    // Информация о времени работы
    if (place.openingHours && place.openingHours !== '24/7') {
      details += " Обратите внимание на режим работы.";
    } else if (place.openingHours === '24/7') {
      details += " Работает круглосуточно.";
    }
    
    // Информация о контактах
    if (place.phone) {
      details += " Рекомендуется предварительное бронирование.";
    }
    
    // Информация о расстоянии
    if (place.distance < 1) {
      details += " Находится в пешей доступности.";
    } else if (place.distance > 5) {
      details += " Потребуется транспорт для добирания.";
    }
    
    return details;
  }

  // Умный алгоритм подбора мест с разнообразием
  selectDiversePlaces(places, count, interests = [], userHistory = []) {
    if (places.length === 0) return [];
    
    // Исключаем места из истории пользователя
    const availablePlaces = places.filter(place => 
      !userHistory.includes(place.id) && !this.visitedPlaces.has(place.id)
    );
    
    if (availablePlaces.length === 0) {
      // Если все места уже посещены, сбрасываем историю сессии
      this.visitedPlaces.clear();
      return this.selectDiversePlaces(places, count, interests, userHistory);
    }
    
    const selected = [];
    const usedTypes = new Set();
    const usedSubcategories = new Set();
    
    // Первый проход: выбираем места разных типов
    for (const place of availablePlaces) {
      if (selected.length >= count) break;
      
      const type = place.type;
      const subcategory = this.getSubcategory(place);
      
      // Проверяем разнообразие типов
      if (!usedTypes.has(type)) {
        // Дополнительные очки за соответствие интересам
        const interestMatch = this.calculateInterestMatch(place, interests);
        
        if (interestMatch > 0.3 || selected.length < count / 2) {
          selected.push(place);
          usedTypes.add(type);
          usedSubcategories.add(subcategory);
          this.visitedPlaces.add(place.id);
        }
      }
    }
    
    // Второй проход: заполняем оставшиеся места разными подкатегориями
    for (const place of availablePlaces) {
      if (selected.length >= count) break;
      
      const subcategory = this.getSubcategory(place);
      
      if (!selected.some(p => p.id === place.id) && !usedSubcategories.has(subcategory)) {
        selected.push(place);
        usedSubcategories.add(subcategory);
        this.visitedPlaces.add(place.id);
      }
    }
    
    // Третий проход: заполняем оставшиеся места лучшими по рейтингу
    const remaining = availablePlaces
      .filter(place => !selected.some(p => p.id === place.id))
      .sort((a, b) => (b.rating || 3.5) - (a.rating || 3.5));
    
    for (const place of remaining) {
      if (selected.length >= count) break;
      selected.push(place);
      this.visitedPlaces.add(place.id);
    }
    
    return selected;
  }

  // Получение подкатегории места
  getSubcategory(place) {
    const type = place.type;
    const name = place.name?.toLowerCase() || '';
    const tags = place.tags || {};
    
    if (type === 'entertainment') {
      if (name.includes('кино')) return 'cinema';
      if (tags.sport === 'bowling') return 'bowling';
      if (tags.sport === 'karting') return 'karting';
      return 'general_entertainment';
    }
    
    if (type === 'cultural') {
      if (tags.tourism === 'museum') return 'museum';
      if (tags.amenity === 'theatre') return 'theatre';
      if (tags.historic) return 'historic';
      return 'general_cultural';
    }
    
    if (type === 'outdoor') {
      if (tags.leisure === 'park') return 'park';
      if (tags.leisure === 'garden') return 'garden';
      if (tags.place === 'square') return 'square';
      if (tags.tourism === 'viewpoint') return 'viewpoint';
      if (tags.amenity === 'fountain') return 'fountain';
      if (tags.waterway === 'riverbank') return 'riverbank';
      return 'general_outdoor';
    }
    
    if (type === 'restaurant') {
      const cuisine = place.cuisine?.toLowerCase() || '';
      if (cuisine.includes('sushi')) return 'japanese';
      if (cuisine.includes('italian')) return 'italian';
      if (cuisine.includes('french')) return 'french';
      if (cuisine.includes('georgian')) return 'georgian';
      return 'general_restaurant';
    }
    
    return type;
  }

  // Расчет соответствия интересам
  calculateInterestMatch(place, interests) {
    if (!interests || interests.length === 0) return 0.5;
    
    let score = 0;
    const type = place.type;
    
    interests.forEach(interest => {
      switch (interest) {
        case 'entertainment':
          if (type === 'entertainment') score += 1;
          break;
        case 'culture':
        case 'creativity':
          if (type === 'cultural') score += 1;
          break;
        case 'fitness':
        case 'sports':
          if (type === 'active' || type === 'outdoor') score += 1;
          break;
        case 'communication':
          if (type === 'cafe' || type === 'restaurant') score += 0.8;
          if (type === 'outdoor') score += 0.6;
          break;
        case 'intimacy':
          if (type === 'restaurant') score += 0.9;
          if (type === 'outdoor') score += 0.7;
          break;
      }
    });
    
    return Math.min(score / interests.length, 1);
  }

  // Контекстуальные рекомендации
  getContextualRecommendations(places, context = {}) {
    const { timeOfDay, dayOfWeek, season, weather } = context;
    
    return places.map(place => {
      let contextScore = 1;
      let contextNote = "";
      
      // Время дня
      if (timeOfDay === 'morning' && place.type === 'outdoor') {
        contextScore += 0.3;
        contextNote += "Отличное время для прогулки. ";
      }
      
      if (timeOfDay === 'evening' && place.type === 'restaurant') {
        contextScore += 0.2;
        contextNote += "Идеально для романтического ужина. ";
      }
      
      // День недели
      if (dayOfWeek === 'weekend' && place.type === 'entertainment') {
        contextScore += 0.2;
        contextNote += "Выходные - время для развлечений. ";
      }
      
      // Сезон
      if (season === 'summer' && place.type === 'outdoor') {
        contextScore += 0.4;
        contextNote += "Прекрасная летняя погода для прогулок. ";
      }
      
      if (season === 'winter' && (place.type === 'cultural' || place.type === 'entertainment')) {
        contextScore += 0.3;
        contextNote += "Уютное место в холодную погоду. ";
      }
      
      // Погода
      if (weather === 'rain' && place.type === 'outdoor') {
        contextScore -= 0.5;
        contextNote += "Не лучший выбор в дождливую погоду. ";
      }
      
      return {
        ...place,
        contextScore,
        contextNote: contextNote.trim()
      };
    });
  }

  // Сброс истории сессии
  resetSessionHistory() {
    this.visitedPlaces.clear();
    this.categoryDistribution.clear();
  }

  // Получение статистики разнообразия
  getDiversityStats() {
    const typeCount = {};
    this.visitedPlaces.forEach(placeId => {
      // Здесь нужно будет получить тип места по ID
      // Пока упрощенная версия
    });
    
    return {
      totalPlaces: this.visitedPlaces.size,
      uniqueTypes: Object.keys(typeCount).length
    };
  }
}

export default new PlaceEnhancerService();
