const { Router } = require('express');
const { getPairingStatus, sendPairRequest, acceptPairRequest, rejectPairRequest, deletePair, fixMutualRequests } = require('../controllers/pair.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = Router();

router.get('/status', authenticateToken, getPairingStatus);
router.post('/request', authenticateToken, sendPairRequest);
router.post('/accept/:id', authenticateToken, acceptPairRequest);
router.post('/reject/:id', authenticateToken, rejectPairRequest);
router.delete('/:id', authenticateToken, deletePair);
router.post('/fix-mutual', authenticateToken, fixMutualRequests);

module.exports = router;