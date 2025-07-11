const { Router } = require('express');
const { getPairingStatus, sendPairRequest, acceptPairRequest, deletePair } = require('../controllers/pair.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = Router();
router.use(authMiddleware);

router.get('/status', getPairingStatus);
router.post('/request', sendPairRequest);
router.post('/accept/:id', acceptPairRequest);
router.delete('/:id', deletePair);

module.exports = router;