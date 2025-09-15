const pairService = require('../services/pair.service');
exports.getPairingStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    }
    
    const status = await pairService.getPairingStatus(req.user.id);
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};
exports.sendPairRequest = async (req, res, next) => {
  try {
    const { partnerEmail } = req.body;
    const newPair = await pairService.sendPairRequest(req.user.id, partnerEmail);
    res.status(201).json(newPair);
  } catch (error) {
    next(error);
  }
};
exports.acceptPairRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedPair = await pairService.acceptPairRequest(id, req.user.id);
    res.status(200).json(updatedPair);
  } catch (error) {
    next(error);
  }
};
exports.rejectPairRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pairService.rejectPairRequest(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
exports.deletePair = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pairService.deletePair(id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.fixMutualRequests = async (req, res, next) => {
  try {
    const result = await pairService.fixMutualRequests(req.user.id);
    res.status(200).json({ success: true, message: 'Взаимные запросы исправлены' });
  } catch (error) {
    next(error);
  }
};