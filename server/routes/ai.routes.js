const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/chat', authMiddleware, aiController.handleChat);

module.exports = router;