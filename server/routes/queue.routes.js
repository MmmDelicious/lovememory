const express = require('express');
const queueController = require('../controllers/queue.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Queue Management Routes
 * Background tasks and queues management
 */

/**
 * GET /api/queue/status
 * Get status of all queues
 */
router.get('/status', queueController.getQueueStatus);

/**
 * GET /api/queue/health
 * Check queue system health
 */
router.get('/health', queueController.healthCheck);

/**
 * POST /api/queue/analysis
 * Add user analysis task
 * 
 * Body: { priority?: number, delay?: number }
 */
router.post('/analysis', authenticateToken, queueController.addAnalysisJob);

/**
 * POST /api/queue/insight
 * Add insight generation task
 * 
 * Body: { priority?: number, delay?: number }
 */
router.post('/insight', authenticateToken, queueController.addInsightJob);

/**
 * POST /api/queue/manage
 * Queue management (pause/resume/clear)
 * 
 * Body: { queueName: string, action: 'pause'|'resume'|'clear' }
 */
router.post('/manage', authenticateToken, queueController.manageQueue);

/**
 * DELETE /api/queue/clear-all
 * Clear all queues (development only)
 */
router.delete('/clear-all', authenticateToken, queueController.clearAllQueues);

module.exports = router;

