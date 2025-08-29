const { Router } = require('express');
const { getPairingStatus, sendPairRequest, acceptPairRequest, deletePair } = require('../controllers/pair.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

router.get('/status', authenticateToken, getPairingStatus);
router.post('/request', authenticateToken, sendPairRequest);
router.post('/accept/:id', authenticateToken, acceptPairRequest);
router.delete('/:id', authenticateToken, deletePair);

module.exports = router;