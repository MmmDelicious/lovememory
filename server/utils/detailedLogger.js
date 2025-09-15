const fs = require('fs');
const path = require('path');

/**
 * Система подробного логирования для AI процессов
 * Создает читаемые логи с детальной информацией о запросах
 */
class DetailedLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.logFile = path.join(this.logDir, 'ai-requests.log');
    this.requestCounter = 1;
    
    // Создаем папку логов если её нет
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    console.log(`📝 DetailedLogger initialized. Logs: ${this.logFile}`);
  }

  /**
   * Основной метод логирования AI запроса
   */
  async logAIRequest(type, userId, pairId, details = {}) {
    const timestamp = new Date().toISOString();
    const requestId = this.requestCounter++;
    
    try {
      // Получаем детальную информацию о паре
      const pairInfo = await this.getPairDetails(pairId);
      
      const logEntry = this.formatLogEntry({
        requestId,
        timestamp,
        type,
        userId,
        pairId,
        pairInfo,
        details
      });
      
      // Записываем в файл
      fs.appendFileSync(this.logFile, logEntry + '\n\n');
      
      // Также выводим в консоль для разработки
      console.log(`🔍 AI Request ${requestId} (${type}) logged`);
      
      return requestId;
    } catch (error) {
      console.error('❌ Error in DetailedLogger:', error);
      return null;
    }
  }

  /**
   * Получение детальной информации о паре
   */
  async getPairDetails(pairId) {
    try {
      const { Pair, User, UserInterest, Interest } = require('../models');
      
      // Находим пару
      const pair = await Pair.findByPk(pairId, {
        include: [
          { model: User, as: 'User1' },
          { model: User, as: 'User2' }
        ]
      });

      if (!pair) {
        return { error: 'Pair not found' };
      }

      // Получаем интересы для обоих пользователей
      const user1Interests = await UserInterest.findAll({
        where: { user_id: pair.user1_id, preference: ['love', 'like'] },
        include: [{ model: Interest, as: 'Interest' }],
        order: [['intensity', 'DESC']]
      });

      const user2Interests = await UserInterest.findAll({
        where: { user_id: pair.user2_id, preference: ['love', 'like'] },
        include: [{ model: Interest, as: 'Interest' }],
        order: [['intensity', 'DESC']]
      });

      // Находим общие интересы
      const commonInterests = await UserInterest.findCommonInterests(pair.user1_id, pair.user2_id);

      return {
        pair: {
          id: pair.id,
          created_at: pair.created_at,
          harmony_index: pair.harmony_index || 'N/A'
        },
        user1: {
          id: pair.User1.id,
          name: pair.User1.name,
          city: pair.User1.city || 'N/A',
          age: this.calculateAge(pair.User1.birth_date),
          interests: user1Interests.map(ui => ({
            name: ui.Interest.name,
            category: ui.Interest.category,
            preference: ui.preference,
            intensity: ui.intensity
          }))
        },
        user2: {
          id: pair.User2.id,
          name: pair.User2.name,
          city: pair.User2.city || 'N/A',
          age: this.calculateAge(pair.User2.birth_date),
          interests: user2Interests.map(ui => ({
            name: ui.Interest.name,
            category: ui.Interest.category,
            preference: ui.preference,
            intensity: ui.intensity
          }))
        },
        commonInterests: commonInterests.map(ci => ({
          name: ci.interest.name,
          category: ci.interest.category,
          compatibility_score: ci.compatibility_score,
          user1_intensity: ci.user1_intensity,
          user2_intensity: ci.user2_intensity
        }))
      };
    } catch (error) {
      console.error('Error getting pair details:', error);
      return { error: error.message };
    }
  }

  /**
   * Форматирование записи лога
   */
  formatLogEntry({ requestId, timestamp, type, userId, pairId, pairInfo, details }) {
    const separator = '='.repeat(80);
    
    let log = `${separator}\n`;
    log += `🚀 ЗАПУСК ${requestId} | ${type.toUpperCase()}\n`;
    log += `📅 Время: ${timestamp}\n`;
    log += `👤 Пользователь: ${userId}\n`;
    log += `💑 Пара: ${pairId}\n`;
    log += `${separator}\n\n`;

    if (pairInfo.error) {
      log += `❌ ОШИБКА: ${pairInfo.error}\n`;
      return log;
    }

    // Информация о паре
    log += `💕 ИНФОРМАЦИЯ О ПАРЕ:\n`;
    log += `   Создана: ${pairInfo.pair.created_at}\n`;
    log += `   Гармония: ${pairInfo.pair.harmony_index}\n\n`;

    // Пользователь 1
    log += `👤 ПОЛЬЗОВАТЕЛЬ 1: ${pairInfo.user1.name}\n`;
    log += `   ID: ${pairInfo.user1.id}\n`;
    log += `   Возраст: ${pairInfo.user1.age}\n`;
    log += `   Город: ${pairInfo.user1.city}\n`;
    log += `   Интересы (${pairInfo.user1.interests.length}):\n`;
    pairInfo.user1.interests.slice(0, 10).forEach(interest => {
      log += `     • ${interest.name} (${interest.category}) - ${interest.preference} (${interest.intensity}/10)\n`;
    });
    log += '\n';

    // Пользователь 2
    log += `👤 ПОЛЬЗОВАТЕЛЬ 2: ${pairInfo.user2.name}\n`;
    log += `   ID: ${pairInfo.user2.id}\n`;
    log += `   Возраст: ${pairInfo.user2.age}\n`;
    log += `   Город: ${pairInfo.user2.city}\n`;
    log += `   Интересы (${pairInfo.user2.interests.length}):\n`;
    pairInfo.user2.interests.slice(0, 10).forEach(interest => {
      log += `     • ${interest.name} (${interest.category}) - ${interest.preference} (${interest.intensity}/10)\n`;
    });
    log += '\n';

    // Общие интересы
    log += `🤝 ОБЩИЕ ИНТЕРЕСЫ (${pairInfo.commonInterests.length}):\n`;
    pairInfo.commonInterests.slice(0, 10).forEach(interest => {
      log += `   • ${interest.name} (${interest.category})\n`;
      log += `     Совместимость: ${interest.compatibility_score}/10\n`;
      log += `     ${pairInfo.user1.name}: ${interest.user1_intensity}/10 | ${pairInfo.user2.name}: ${interest.user2_intensity}/10\n`;
    });
    log += '\n';

    // Детали запроса
    if (details && Object.keys(details).length > 0) {
      log += `🔧 ДЕТАЛИ ЗАПРОСА:\n`;
      Object.entries(details).forEach(([key, value]) => {
        log += `   ${key}: ${JSON.stringify(value, null, 2)}\n`;
      });
      log += '\n';
    }

    return log;
  }

  /**
   * Логирование результата
   */
  async logResult(requestId, result, processingTime) {
    try {
      let resultLog = `📊 РЕЗУЛЬТАТ ЗАПРОСА ${requestId}:\n`;
      resultLog += `⏱️  Время обработки: ${processingTime}ms\n`;
      
      if (Array.isArray(result)) {
        resultLog += `📝 Количество результатов: ${result.length}\n`;
        result.slice(0, 5).forEach((item, index) => {
          resultLog += `   ${index + 1}. ${item.title || item.name || 'Unnamed'}\n`;
          if (item.score) resultLog += `      Оценка: ${item.score}\n`;
          if (item.reasons) resultLog += `      Причины: ${item.reasons.join(', ')}\n`;
        });
      } else {
        resultLog += `📝 Результат: ${JSON.stringify(result, null, 2)}\n`;
      }
      
      resultLog += '\n';
      
      fs.appendFileSync(this.logFile, resultLog);
    } catch (error) {
      console.error('Error logging result:', error);
    }
  }

  /**
   * Вычисление возраста
   */
  calculateAge(birthDate) {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Очистка старых логов (оставляем только последние 100 запросов)
   */
  cleanOldLogs() {
    try {
      if (fs.existsSync(this.logFile)) {
        const content = fs.readFileSync(this.logFile, 'utf8');
        const entries = content.split('='.repeat(80));
        
        if (entries.length > 100) {
          const recentEntries = entries.slice(-50); // Оставляем последние 50
          fs.writeFileSync(this.logFile, recentEntries.join('='.repeat(80)));
          console.log('🧹 Cleaned old log entries');
        }
      }
    } catch (error) {
      console.error('Error cleaning logs:', error);
    }
  }
}

// Singleton instance
const detailedLogger = new DetailedLogger();

module.exports = detailedLogger;
