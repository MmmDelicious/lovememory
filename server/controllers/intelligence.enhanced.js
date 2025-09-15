const detailedLogger = require('../utils/detailedLogger');
const { spawn } = require('child_process');
const path = require('path');

/**
 * Enhanced Intelligence Controller с детальным логированием
 * Интегрирует все AI функции с подробными логами
 */
class EnhancedIntelligenceController {

  /**
   * Получить общие интересы с детальным логированием
   */
  async getCommonInterests(req, res, next) {
    const startTime = Date.now();
    let requestId = null;
    
    try {
      const userId = req.user?.id;
      const { userId1, userId2 } = req.params;
      
      // Логируем начало запроса
      requestId = await detailedLogger.logAIRequest('COMMON_INTERESTS', userId, null, {
        userId1,
        userId2,
        requestedBy: userId
      });

      // Проверяем права доступа (пользователь должен быть одним из участников)
      if (userId1 !== userId && userId2 !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
      }

      const { UserInterest } = require('../models');
      const commonInterests = await UserInterest.findCommonInterests(userId1, userId2);
      
      const processingTime = Date.now() - startTime;
      
      // Логируем результат
      if (requestId) {
        await detailedLogger.logResult(requestId, commonInterests, processingTime);
      }

      res.status(200).json({
        success: true,
        data: commonInterests,
        metadata: {
          requestId,
          processingTime,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (requestId) {
        await detailedLogger.logResult(requestId, { error: error.message }, processingTime);
      }
      
      console.error('❌ Error in getCommonInterests:', error);
      next(error);
    }
  }

  /**
   * Получить AI рекомендации подарков с детальным логированием
   */
  async getGiftRecommendations(req, res, next) {
    const startTime = Date.now();
    let requestId = null;
    
    try {
      const userId = req.user?.id;
      const { pairId } = req.params;
      const { top_k = 10, user_location } = req.query;
      
      // Логируем начало запроса
      requestId = await detailedLogger.logAIRequest('GIFT_RECOMMENDATIONS', userId, pairId, {
        top_k,
        user_location,
        requestedBy: userId
      });

      // Проверяем существование пары в базе
      const { Pair } = require('../models');
      const pair = await Pair.findByPk(pairId);
      
      if (!pair) {
        throw new Error('Pair not found');
      }

      // Вызываем Python AI систему для рекомендаций
      const recommendations = await this.callPythonAI('recommendations', {
        pair_id: pairId,
        top_k: parseInt(top_k),
        user_location: user_location ? JSON.parse(user_location) : null,
        focus: 'gifts' // Указываем фокус на подарки
      });
      
      const processingTime = Date.now() - startTime;
      
      // Логируем результат
      if (requestId) {
        await detailedLogger.logResult(requestId, recommendations, processingTime);
      }

      res.json({
        success: true,
        data: {
          pair_id: pairId,
          recommendations: recommendations,
          timestamp: new Date().toISOString(),
          model_version: 'enhanced_v1',
          requestId
        }
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (requestId) {
        await detailedLogger.logResult(requestId, { error: error.message }, processingTime);
      }
      
      console.error('❌ Error in getGiftRecommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Генерация свидания с детальным логированием
   */
  async generateDateEnhanced(req, res, next) {
    const startTime = Date.now();
    let requestId = null;
    
    try {
      const userId = req.user?.id;
      const { context } = req.body;
      const pairId = context?.pairId;
      
      // Логируем начало запроса
      requestId = await detailedLogger.logAIRequest('DATE_GENERATION', userId, pairId, {
        context,
        requestedBy: userId
      });

      // Генерируем свидание через улучшенный AI
      const dateResult = await this.callPythonAI('date_generation', {
        pair_id: pairId,
        preferences: context?.preferences || {},
        context: context
      });
      
      const processingTime = Date.now() - startTime;
      
      // Логируем результат
      if (requestId) {
        await detailedLogger.logResult(requestId, dateResult, processingTime);
      }

      res.json({
        success: true,
        data: {
          ...dateResult,
          requestId,
          metadata: {
            processingTime,
            timestamp: new Date().toISOString()
          }
        }
      });
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      if (requestId) {
        await detailedLogger.logResult(requestId, { error: error.message }, processingTime);
      }
      
      console.error('❌ Error in generateDateEnhanced:', error);
      next(error);
    }
  }

  /**
   * Вызов Python AI системы
   */
  async callPythonAI(operation, params) {
    return new Promise((resolve, reject) => {
      const aiDir = path.join(__dirname, '../../ai');
      const pythonScript = this.getPythonScript(operation);
      
      const args = ['-c', pythonScript];
      
      const pythonProcess = spawn('python', args, {
        cwd: aiDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONPATH: aiDir }
      });
      
      // Отправляем параметры в stdin
      pythonProcess.stdin.write(JSON.stringify(params));
      pythonProcess.stdin.end();
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python AI процесс завершился с кодом ${code}`);
          console.error('Error output:', errorOutput);
          reject(new Error(`AI процесс ошибка: ${errorOutput}`));
          return;
        }
        
        try {
          const result = JSON.parse(output);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result);
          }
        } catch (parseError) {
          console.error('Ошибка парсинга AI ответа:', parseError);
          console.error('Raw output:', output);
          reject(new Error('Некорректный ответ от AI системы'));
        }
      });
      
      // Timeout для долгих операций
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('AI операция превысила таймаут'));
      }, 30000); // 30 секунд
    });
  }

  /**
   * Получение Python скрипта для операции
   */
  getPythonScript(operation) {
    const baseImports = `
import sys
import json
from ultimate_ai_service import UltimateAIService

# Читаем параметры из stdin
params = json.loads(sys.stdin.read())
ai_service = UltimateAIService()
`;

    switch (operation) {
      case 'recommendations':
        return baseImports + `
try:
    result = ai_service.get_ultimate_recommendations(
        pair_id=params['pair_id'],
        top_k=params.get('top_k', 10),
        user_location=params.get('user_location'),
        context=params.get('context', {}),
        include_scenarios=True,
        include_explanations=True
    )
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

      case 'date_generation':
        return baseImports + `
try:
    # Используем LLM wrapper для креативной генерации
    from llm_wrapper import LLMWrapper
    llm = LLMWrapper()
    
    result = llm.generate_date_scenarios(
        pair_id=params['pair_id'],
        preferences=params.get('preferences', {}),
        context=params.get('context', {})
    )
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

      default:
        throw new Error(`Unknown AI operation: ${operation}`);
    }
  }
}

module.exports = new EnhancedIntelligenceController();
