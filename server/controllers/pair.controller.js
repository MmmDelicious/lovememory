const { Op } = require('sequelize');
const { User, Pair } = require('../models');

exports.getPairingStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const userId = req.user.id;
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: [
        { model: User, as: 'Requester', attributes: ['id', 'email', 'first_name'] },
        { model: User, as: 'Receiver', attributes: ['id', 'email', 'first_name'] },
      ],
    });
    if (!pair) {
      return res.status(200).json({ status: 'unpaired' });
    }
    res.status(200).json(pair);
  } catch (error) {
    console.error('!!! Ошибка в getPairingStatus:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

exports.sendPairRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const { partnerEmail } = req.body;
    const requesterId = req.user.id;
    const receiver = await User.findOne({ where: { email: partnerEmail } });
    if (!receiver) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден.' });
    }
    if (requesterId === receiver.id) {
      return res.status(400).json({ message: 'Нельзя создать пару с самим собой.' });
    }
    const existingPair = await Pair.findOne({
      where: {
        [Op.or]: [
          { user1Id: requesterId, user2Id: receiver.id },
          { user1Id: receiver.id, user2Id: requesterId },
          { user1Id: requesterId, status: { [Op.ne]: 'inactive' } },
          { user2Id: requesterId, status: { [Op.ne]: 'inactive' } },
          { user1Id: receiver.id, status: { [Op.ne]: 'inactive' } },
          { user2Id: receiver.id, status: { [Op.ne]: 'inactive' } }
        ],
      },
    });
    if (existingPair) {
      return res.status(400).json({ message: 'Один из пользователей уже состоит в паре или имеет активный запрос.' });
    }
    const newPair = await Pair.create({ user1Id: requesterId, user2Id: receiver.id });
    res.status(201).json(newPair);
  } catch (error) {
    console.error('!!! Ошибка в sendPairRequest:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

exports.acceptPairRequest = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const { id } = req.params;
    const pairRequest = await Pair.findOne({ where: { id, user2Id: req.user.id, status: 'pending' } });
    if (!pairRequest) {
      return res.status(404).json({ message: 'Запрос на создание пары не найден.' });
    }
    pairRequest.status = 'active';
    await pairRequest.save();
    res.status(200).json(pairRequest);
  } catch (error) {
    console.error('!!! Ошибка в acceptPairRequest:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};

exports.deletePair = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Пользователь не аутентифицирован.' });
    }
    const { id } = req.params;
    const userId = req.user.id;
    const pair = await Pair.findOne({ where: { id, [Op.or]: [{ user1Id: userId }, { user2Id: userId }] } });
    if (!pair) {
      return res.status(404).json({ message: 'Пара или запрос не найдены.' });
    }
    await pair.destroy();
    res.status(200).json({ message: 'Связь успешно разорвана.' });
  } catch (error) {
    console.error('!!! Ошибка в deletePair:', error);
    res.status(500).json({ message: 'Ошибка на сервере', error: error.message });
  }
};