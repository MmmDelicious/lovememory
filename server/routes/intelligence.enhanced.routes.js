const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');
const intelligenceController = require('../controllers/intelligence.enhanced');

const router = express.Router();

/**
 * Enhanced Intelligence Routes с детальным логированием
 */

// 🤝 Получить общие интересы с логированием
router.get('/interests/common/:userId1/:userId2', 
  authenticateToken, 
  intelligenceController.getCommonInterests
);

// 🎁 Получить рекомендации подарков с AI и логированием
router.get('/gifts/:pairId', 
  authenticateToken, 
  intelligenceController.getGiftRecommendations
);

// 💕 Сгенерировать свидание с AI и логированием
router.post('/generate-date-enhanced', 
  authenticateToken, 
  intelligenceController.generateDateEnhanced
);

// 📊 Получить статус логирования
router.get('/logs/status', authenticateToken, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../logs/ai-requests.log');
    
    let logInfo = {
      exists: false,
      size: 0,
      lastModified: null,
      recentEntries: 0
    };
    
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      const content = fs.readFileSync(logFile, 'utf8');
      
      logInfo = {
        exists: true,
        size: stats.size,
        lastModified: stats.mtime,
        recentEntries: content.split('🚀 ЗАПУСК').length - 1
      };
    }
    
    res.json({
      success: true,
      data: logInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 📝 Получить последние логи (только для разработки)
router.get('/logs/recent', authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Logs not available in production'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../logs/ai-requests.log');
    
    if (!fs.existsSync(logFile)) {
      return res.json({
        success: true,
        data: 'Лог файл не найден'
      });
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const entries = content.split('='.repeat(80));
    const recentEntries = entries.slice(-5); // Последние 5 записей
    
    res.json({
      success: true,
      data: recentEntries.join('='.repeat(80))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
