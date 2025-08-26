const express = require('express');

// Импортируем middleware (JS файлы)
const authMiddleware = require('../middleware/auth.middleware');
// const rateLimitMiddleware = require('../middleware/rateLimit.middleware'); // Временно отключено

const router = express.Router();

/**
 * Intelligence Core Routes - JS версия для совместимости
 */

// Применяем middleware для всех роутов
router.use(authMiddleware); // Требуем аутентификацию
// router.use(rateLimitMiddleware.aiInteraction); // Временно отключено для тестирования

/**
 * Временные заглушки пока не скомпилируем TS версии
 */

// POST /api/intelligence/chat - основной чат с AI Orchestrator
router.post('/chat', async (req, res, next) => {
  try {
    // Временная заглушка
    res.json({
      success: true,
      data: {
        message: "🚧 Intelligence Core пока в разработке. Скоро будет готов! 🚀",
        intent: "CHAT",
        confidence: 1.0,
        metadata: {
          status: "development",
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence/generate-date - генерация вариантов свиданий
router.post('/generate-date', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        options: [
          {
            id: "temp_1",
            title: "Романтический вечер",
            description: "Прогулка + ужин в уютном ресторане",
            schedule: [
              {
                time: "19:00",
                endTime: "20:30",
                activity: "Прогулка по центру",
                description: "Неспешная прогулка и общение"
              },
              {
                time: "21:00", 
                endTime: "22:30",
                activity: "Ужин в ресторане",
                description: "Романтический ужин"
              }
            ],
            estimatedCost: 3000,
            duration: 3.5,
            atmosphere: "romantic",
            reasoning: "Создан на основе ваших предпочтений",
            isRealData: false,
            activitiesCount: 2
          }
        ],
        reasoning: [
          "🚧 Анализирую ваши предпочтения...",
          "🚧 Intelligence Core в разработке...",
          "✅ Готово! (пока демо-версия)"
        ],
        metadata: {
          generatedAt: new Date(),
          usedRealData: false,
          confidence: 0.5,
          status: "development"
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/intelligence/analyze-relationship - анализ отношений
router.get('/analyze-relationship', async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        message: "📊 Анализ отношений:\n\n🏆 Общая сила отношений: 75/100\n💕 Главный язык любви: Качественное время\n📈 Тренд настроения: стабильный ➡️\n\n🚧 Полный анализ будет доступен после запуска Intelligence Core!",
        analysis: {
          overallStrength: 75,
          dominantLoveLanguage: "quality_time",
          sentimentTrend: 0.0,
          status: "development"
        },
        metadata: {
          timestamp: new Date().toISOString(),
          status: "development"
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/intelligence/rate - оценка качества ответа AI
router.post('/rate', async (req, res, next) => {
  try {
    const { rating } = req.body;
    
    console.log(`⭐ Received rating: ${rating} from user ${req.user?.id}`);
    
    res.json({
      success: true,
      message: "Спасибо за оценку! 🙏"
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/intelligence/context - получение контекста (для отладки)
router.get('/context', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        success: false,
        message: 'This endpoint is not available in production' 
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user?.id,
          name: req.user?.name || "Demo User"
        },
        status: "development",
        message: "🚧 Intelligence Core пока в разработке",
        availableEndpoints: [
          "POST /api/intelligence/chat",
          "POST /api/intelligence/generate-date", 
          "GET /api/intelligence/analyze-relationship",
          "POST /api/intelligence/rate"
        ]
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
