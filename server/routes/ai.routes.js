const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/chat', authenticateToken, aiController.handleChat);

module.exports = router;