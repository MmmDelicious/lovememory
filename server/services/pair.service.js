const { Op } = require('sequelize');
const { User, Pair } = require('../models');

class PairService {
  async getPairingStatus(userId) {
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
      return { status: 'unpaired' };
    }
    return pair;
  }

  async sendPairRequest(requesterId, partnerEmail) {
    const receiver = await User.findOne({ where: { email: partnerEmail } });
    if (!receiver) {
      const error = new Error('Пользователь с таким email не найден.');
      error.statusCode = 404;
      throw error;
    }
    if (requesterId === receiver.id) {
      const error = new Error('Нельзя создать пару с самим собой.');
      error.statusCode = 400;
      throw error;
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
      const error = new Error('Один из пользователей уже состоит в паре или имеет активный запрос.');
      error.statusCode = 400;
      throw error;
    }

    return Pair.create({ user1Id: requesterId, user2Id: receiver.id });
  }

  async acceptPairRequest(pairId, receiverId) {
    const pairRequest = await Pair.findOne({ where: { id: pairId, user2Id: receiverId, status: 'pending' } });
    if (!pairRequest) {
      const error = new Error('Запрос на создание пары не найден.');
      error.statusCode = 404;
      throw error;
    }
    pairRequest.status = 'active';
    await pairRequest.save();
    return pairRequest;
  }

  async deletePair(pairId, userId) {
    const pair = await Pair.findOne({ where: { id: pairId, [Op.or]: [{ user1Id: userId }, { user2Id: userId }] } });
    if (!pair) {
      const error = new Error('Пара или запрос не найдены.');
      error.statusCode = 404;
      throw error;
    }
    await pair.destroy();
    return { message: 'Связь успешно разорвана.' };
  }
}

module.exports = new PairService();