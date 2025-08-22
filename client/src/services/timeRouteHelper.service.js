class TimeRouteHelper {
  constructor() {
    this.transportSpeed = {
      walking: 4, // км/ч
      public_transport: 20, // км/ч
      car: 30 // км/ч в городе
    };
  }
  parseOpeningHours(openingHours) {
    if (!openingHours) return null;
    try {
      if (openingHours === '24/7') {
        return { isOpen24_7: true };
      }
      const schedules = openingHours.split(';').map(s => s.trim());
      const parsedSchedule = {};
      schedules.forEach(schedule => {
        const match = schedule.match(/([A-Za-z\-,]+)\s+(\d{1,2}:\d{2})\-(\d{1,2}:\d{2})/);
        if (match) {
          const [, days, openTime, closeTime] = match;
          const daysList = this.parseDays(days);
          daysList.forEach(day => {
            parsedSchedule[day] = {
              open: openTime,
              close: closeTime
            };
          });
        }
      });
      return Object.keys(parsedSchedule).length > 0 ? parsedSchedule : null;
    } catch (error) {
      console.warn('Failed to parse opening hours:', openingHours, error);
      return null;
    }
  }
  parseDays(daysString) {
    const dayMap = {
      'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6, 'Su': 0
    };
    const days = [];
    if (daysString.includes('-')) {
      const [start, end] = daysString.split('-');
      const startDay = dayMap[start];
      const endDay = dayMap[end];
      for (let i = startDay; i <= endDay; i++) {
        days.push(i);
      }
      if (startDay > endDay) {
        for (let i = startDay; i <= 6; i++) days.push(i);
        for (let i = 0; i <= endDay; i++) days.push(i);
      }
    } else if (daysString.includes(',')) {
      daysString.split(',').forEach(day => {
        if (dayMap[day.trim()] !== undefined) {
          days.push(dayMap[day.trim()]);
        }
      });
    } else {
      if (dayMap[daysString] !== undefined) {
        days.push(dayMap[daysString]);
      }
    }
    return days;
  }
  isOpenAt(schedule, dateTime) {
    if (!schedule) return true; // Если расписание неизвестно, считаем открытым
    if (schedule.isOpen24_7) return true;
    const dayOfWeek = dateTime.getDay();
    const timeString = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    const daySchedule = schedule[dayOfWeek];
    if (!daySchedule) return false;
    const openTime = daySchedule.open;
    const closeTime = daySchedule.close;
    return timeString >= openTime && timeString <= closeTime;
  }
  calculateTravelTime(distance, transportType = 'walking') {
    const speed = this.transportSpeed[transportType];
    return (distance / speed) * 60; // возвращаем в минутах
  }
  optimizeRoute(places, startPoint) {
    if (places.length <= 1) return places;
    const optimized = [];
    let currentPoint = startPoint;
    let remainingPlaces = [...places];
    while (remainingPlaces.length > 0) {
      let nearestIndex = 0;
      let minDistance = this.calculateDistance(
        currentPoint.coordinates.lat, 
        currentPoint.coordinates.lon,
        remainingPlaces[0].coordinates.lat || remainingPlaces[0].coordinates.latitude,
        remainingPlaces[0].coordinates.lon || remainingPlaces[0].coordinates.longitude
      );
      for (let i = 1; i < remainingPlaces.length; i++) {
        const distance = this.calculateDistance(
          currentPoint.coordinates.lat, 
          currentPoint.coordinates.lon,
          remainingPlaces[i].coordinates.lat || remainingPlaces[i].coordinates.latitude,
          remainingPlaces[i].coordinates.lon || remainingPlaces[i].coordinates.longitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }
      const nearestPlace = remainingPlaces.splice(nearestIndex, 1)[0];
      optimized.push(nearestPlace);
      currentPoint = {
        coordinates: {
          lat: nearestPlace.coordinates.lat || nearestPlace.coordinates.latitude,
          lon: nearestPlace.coordinates.lon || nearestPlace.coordinates.longitude
        }
      };
    }
    return optimized;
  }
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
  createFlexibleSchedule(activities, startTime, preferences = {}) {
    const {
      maxDuration = 6, // максимум 6 часов
      includeFood = true,
      transportType = 'walking',
      bufferTime = 15 // минут между активностями
    } = preferences;
    if (activities.length === 0) return [];
    const schedule = [];
    let currentTime = new Date(startTime);
    let totalDuration = 0;
    const userLocation = { coordinates: { lat: activities[0].coordinates.lat, lon: activities[0].coordinates.lon } };
    const optimizedActivities = this.optimizeRoute(activities, userLocation);
    for (let i = 0; i < optimizedActivities.length; i++) {
      const activity = optimizedActivities[i];
      if (totalDuration >= maxDuration * 60) break;
      const openingHours = this.parseOpeningHours(activity.openingHours);
      if (!this.isOpenAt(openingHours, currentTime)) {
        continue; // Пропускаем закрытые заведения
      }
      const activityDuration = this.getActivityDuration(activity);
      const endTime = new Date(currentTime.getTime() + activityDuration * 60000);
      schedule.push({
        time: this.formatTime(currentTime),
        endTime: this.formatTime(endTime),
        activity: activity.name,
        type: activity.type || 'activity',
        description: this.generateActivityDescription(activity),
        placeDescription: activity.description || null, // описание места
        location: activity.address || 'Локация уточняется',
        coordinates: activity.coordinates,
        duration: activityDuration,
        cost: this.estimateActivityCost(activity)
      });
      currentTime = new Date(endTime.getTime() + bufferTime * 60000);
      totalDuration += activityDuration + bufferTime;
      if (includeFood && totalDuration > 180 && i < optimizedActivities.length - 1) { // 3 часа
        const foodBreak = this.addFoodBreak(currentTime, optimizedActivities, i);
        if (foodBreak) {
          schedule.push(foodBreak);
          currentTime = new Date(currentTime.getTime() + 90 * 60000); // 1.5 часа на еду
          totalDuration += 90;
        }
      }
    }
    return schedule;
  }
  getActivityDuration(activity) {
    const type = activity.type;
    const name = activity.name?.toLowerCase() || '';
    const baseDurations = {
      entertainment: 120, // 2 часа
      cultural: 90,       // 1.5 часа
      outdoor: 120,       // 2 часа
      active: 90,         // 1.5 часа
      restaurant: 90,     // 1.5 часа
      cafe: 60           // 1 час
    };
    if (name.includes('кино') || name.includes('cinema')) return 150; // 2.5 часа
    if (name.includes('музей') || name.includes('museum')) return 120; // 2 часа
    if (name.includes('парк') || name.includes('park')) return 90;     // 1.5 часа
    if (name.includes('кафе') || name.includes('coffee')) return 60;   // 1 час
    return baseDurations[type] || 90; // по умолчанию 1.5 часа
  }
  generateActivityDescription(activity) {
    const type = activity.type;
    const descriptions = {
      entertainment: `Время для развлечений и отдыха`,
      cultural: `Культурная программа для расширения кругозора`,
      outdoor: `Активный отдых на свежем воздухе`,
      active: `Спортивная активность для поднятия настроения`,
      restaurant: `Время для приятного обеда/ужина`,
      cafe: `Перерыв на кофе и общение`
    };
    return descriptions[type] || `Время в ${activity.name}`;
  }
  estimateActivityCost(activity) {
    const type = activity.type;
    const baseCosts = {
      entertainment: 800,  // билет в кино/театр
      cultural: 400,       // билет в музей
      outdoor: 0,          // прогулка в парке
      active: 1200,        // спортивное мероприятие
      restaurant: 2500,    // обед/ужин на двоих
      cafe: 600           // кофе на двоих
    };
    const name = activity.name?.toLowerCase() || '';
    let cost = baseCosts[type] || 500;
    if (name.includes('премиум') || name.includes('elite')) cost *= 2;
    if (name.includes('макдональдс') || name.includes('kfc')) cost = 400;
    if (name.includes('суши') || name.includes('sushi')) cost += 500;
    return cost;
  }
  addFoodBreak(currentTime, activities, currentIndex) {
    const nearbyFood = activities.slice(currentIndex + 1).find(activity => 
      activity.type === 'restaurant' || 
      activity.type === 'cafe' ||
      activity.name?.toLowerCase().includes('кафе') ||
      activity.name?.toLowerCase().includes('ресторан')
    );
    if (nearbyFood) {
      const endTime = new Date(currentTime.getTime() + 90 * 60000);
              return {
          time: this.formatTime(currentTime),
          endTime: this.formatTime(endTime),
          activity: nearbyFood.name,
          type: 'food',
          description: 'Время для обеда и отдыха',
          placeDescription: nearbyFood.description || null,
          location: nearbyFood.address || 'Локация уточняется',
          coordinates: nearbyFood.coordinates,
          duration: 90,
          cost: this.estimateActivityCost({ type: 'restaurant' })
        };
    }
    return null;
  }
  formatTime(date) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  generateDurationVariants() {
    return [
      { 
        duration: 3, 
        label: 'Короткое свидание (3 часа)',
        activities: 2,
        includeFood: false 
      },
      { 
        duration: 5, 
        label: 'Классическое свидание (5 часов)',
        activities: 3,
        includeFood: true 
      },
      { 
        duration: 8, 
        label: 'Полный день вместе (8 часов)',
        activities: 4,
        includeFood: true 
      }
    ];
  }
  createWalkingRoute(startPoint, endPoint, intermediatePoints = []) {
    const allPoints = [startPoint, ...intermediatePoints, endPoint];
    const route = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      const from = allPoints[i];
      const to = allPoints[i + 1];
      const distance = this.calculateDistance(
        from.coordinates.lat, from.coordinates.lon,
        to.coordinates.lat, to.coordinates.lon
      );
      const walkingTime = this.calculateTravelTime(distance, 'walking');
      route.push({
        from: from.name,
        to: to.name,
        distance: Math.round(distance * 1000), // в метрах
        walkingTime: Math.round(walkingTime), // в минутах
        description: `Прогулка от ${from.name} до ${to.name}`
      });
    }
    return route;
  }
}
export default new TimeRouteHelper();

