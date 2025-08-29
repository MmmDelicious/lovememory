const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/chat', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        message: "Intelligence Core is still in development. Coming soon!",
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

router.post('/generate-date', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        options: [
          {
            id: "temp_1",
            title: "Romantic evening",
            description: "Walk + dinner in cozy restaurant",
            schedule: [
              {
                time: "19:00",
                endTime: "20:30",
                activity: "City center walk",
                description: "Leisurely walk and conversation"
              },
              {
                time: "21:00", 
                endTime: "22:30",
                activity: "Restaurant dinner",
                description: "Romantic dinner"
              }
            ],
            estimatedCost: 3000,
            duration: 3.5,
            atmosphere: "romantic",
            reasoning: "Created based on your preferences",
            isRealData: false,
            activitiesCount: 2
          }
        ],
        reasoning: [
          "Analyzing your preferences...",
          "Intelligence Core in development...",
          "Ready! (demo version for now)"
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

router.get('/analyze-relationship', authenticateToken, async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        message: "Relationship analysis:\n\nOverall relationship strength: 75/100\nDominant love language: Quality time\nMood trend: stable\n\nFull analysis will be available after Intelligence Core launch!",
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

router.post('/rate', authenticateToken, async (req, res, next) => {
  try {
    const { rating } = req.body;
    
    res.json({
      success: true,
      message: "Thank you for the rating!"
    });
  } catch (error) {
    next(error);
  }
});

router.get('/context', authenticateToken, async (req, res, next) => {
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
        message: "Intelligence Core is still in development",
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
