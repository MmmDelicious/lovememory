const { Op } = require('sequelize');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Контроллер для AI рекомендаций
 * Интегрирует Python content-based рекомендательную систему
 */
class RecommendationController {
    
    /**
     * Получить рекомендации для пары
     * GET /api/recommendations/:pairId
     */
    async getRecommendations(req, res) {
        try {
            const { pairId } = req.params;
            const { top_k = 10, user_location } = req.query;
            
            // Валидация pairId
            if (!pairId) {
                return res.status(400).json({
                    success: false,
                    message: 'Pair ID is required'
                });
            }
            
            // Проверяем существование пары в базе
            const Pair = require('../models/Pair');
            const pair = await Pair.findByPk(pairId);
            
            if (!pair) {
                return res.status(404).json({
                    success: false,
                    message: 'Pair not found'
                });
            }
            
            // Вызываем Python рекомендательную систему
            const recommendations = await this.callPythonRecommender(pairId, top_k, user_location);
            
            // Логируем impression
            await this.logRecommendationImpression(pairId, recommendations, req.user?.id);
            
            res.json({
                success: true,
                data: {
                    pair_id: pairId,
                    recommendations: recommendations,
                    timestamp: new Date().toISOString(),
                    model_version: 'content_v1'
                }
            });
            
        } catch (error) {
            console.error('Error in getRecommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    
    /**
     * Вызывает Python рекомендательную систему
     */
    async callPythonRecommender(pairId, topK, userLocation) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '../../ai/content_recommender.py');
            const aiDir = path.join(__dirname, '../../ai');
            
            // Параметры для Python скрипта
            const args = ['-c', `
import sys
sys.path.append('${aiDir}')
from content_recommender import ContentBasedRecommender
import json

try:
    recommender = ContentBasedRecommender()
    recommendations = recommender.recommend_date('${pairId}', top_k=${topK})
    
    # Конвертируем в JSON-сериализуемый формат
    result = []
    for rec in recommendations:
        result.append({
            'item_id': rec.item_id,
            'title': rec.title,
            'category': rec.category,
            'score': float(rec.score),
            'reasons': rec.reasons,
            'price': float(rec.price),
            'location': rec.location
        })
    
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`];
            
            const pythonProcess = spawn('python', args, {
                cwd: aiDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
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
                    console.error('Python process error:', errorOutput);
                    reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
                    return;
                }
                
                try {
                    const result = JSON.parse(output.trim());
                    
                    if (result.error) {
                        reject(new Error(result.error));
                        return;
                    }
                    
                    resolve(result);
                } catch (parseError) {
                    console.error('Failed to parse Python output:', output);
                    reject(new Error('Failed to parse Python output'));
                }
            });
            
            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }
    
    /**
     * Логирует показ рекомендаций в activity_logs
     */
    async logRecommendationImpression(pairId, recommendations, userId) {
        try {
            const ActivityLog = require('../models/ActivityLog');
            
            const logEntry = {
                pair_id: pairId,
                user_id: userId,
                action: 'recommendation_shown',
                payload: {
                    recommendations_count: recommendations.length,
                    items_shown: recommendations.map(rec => ({
                        item_id: rec.item_id,
                        title: rec.title,
                        score: rec.score
                    })),
                    model_version: 'content_v1'
                },
                model_version: 'content_v1',
                created_at: new Date()
            };
            
            await ActivityLog.create(logEntry);
            
        } catch (error) {
            console.error('Error logging recommendation impression:', error);
            // Не прерываем основной процесс из-за ошибки логирования
        }
    }
    
    /**
     * Логирует клик по рекомендации
     * POST /api/recommendations/:pairId/click
     */
    async logRecommendationClick(req, res) {
        try {
            const { pairId } = req.params;
            const { item_id, item_title, score } = req.body;
            
            if (!item_id) {
                return res.status(400).json({
                    success: false,
                    message: 'item_id is required'
                });
            }
            
            const ActivityLog = require('../models/ActivityLog');
            
            const logEntry = {
                pair_id: pairId,
                user_id: req.user?.id,
                action: 'recommendation_clicked',
                payload: {
                    item_id: item_id,
                    item_title: item_title,
                    score: score,
                    model_version: 'content_v1'
                },
                model_version: 'content_v1',
                created_at: new Date()
            };
            
            await ActivityLog.create(logEntry);
            
            res.json({
                success: true,
                message: 'Click logged successfully'
            });
            
        } catch (error) {
            console.error('Error logging recommendation click:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to log click',
                error: error.message
            });
        }
    }
    
    /**
     * Получить метрики модели
     * GET /api/recommendations/metrics
     */
    async getModelMetrics(req, res) {
        try {
            const modelPath = path.join(__dirname, '../../ai/models/content_v1_metadata.json');
            
            if (!fs.existsSync(modelPath)) {
                return res.status(404).json({
                    success: false,
                    message: 'Model metadata not found'
                });
            }
            
            const metadata = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
            
            res.json({
                success: true,
                data: {
                    model_id: metadata.model_id,
                    type: metadata.type,
                    version: metadata.version,
                    metrics: metadata.metrics,
                    parameters: metadata.parameters,
                    created_at: metadata.created_at
                }
            });
            
        } catch (error) {
            console.error('Error getting model metrics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get model metrics',
                error: error.message
            });
        }
    }
    
    /**
     * Обновить весовые коэффициенты модели
     * PUT /api/recommendations/weights
     */
    async updateModelWeights(req, res) {
        try {
            const { weights } = req.body;
            
            if (!weights || typeof weights !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Weights object is required'
                });
            }
            
            // Валидируем веса
            const requiredWeights = ['interest_overlap', 'distance_score', 'price_match'];
            const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
            
            if (Math.abs(totalWeight - 1.0) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: 'Weights must sum to 1.0'
                });
            }
            
            // Обновляем веса в Python скрипте
            const pythonScript = path.join(__dirname, '../../ai/update_weights.py');
            const aiDir = path.join(__dirname, '../../ai');
            
            const args = ['-c', `
import sys
sys.path.append('${aiDir}')
from content_recommender import ContentBasedRecommender
import json

try:
    recommender = ContentBasedRecommender()
    recommender.weights = ${JSON.stringify(weights)}
    
    # Пересчитываем метрики с новыми весами
    metrics = recommender.evaluate_baseline_metrics(k=10)
    recommender.save_model_metadata(metrics)
    
    print(json.dumps({'success': True, 'metrics': metrics}))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`];
            
            const pythonProcess = spawn('python', args, {
                cwd: aiDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
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
                    console.error('Python process error:', errorOutput);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update weights',
                        error: errorOutput
                    });
                }
                
                try {
                    const result = JSON.parse(output.trim());
                    
                    if (result.error) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update weights',
                            error: result.error
                        });
                    }
                    
                    res.json({
                        success: true,
                        message: 'Weights updated successfully',
                        data: {
                            weights: weights,
                            metrics: result.metrics
                        }
                    });
                    
                } catch (parseError) {
                    console.error('Failed to parse Python output:', output);
                    res.status(500).json({
                        success: false,
                        message: 'Failed to update weights',
                        error: 'Failed to parse Python output'
                    });
                }
            });
            
        } catch (error) {
            console.error('Error updating model weights:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update weights',
                error: error.message
            });
        }
    }
}

module.exports = new RecommendationController();
