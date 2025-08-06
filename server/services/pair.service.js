const { User, Pair } = require('../models');
const { Op } = require('sequelize');

class PairService {
  async getPairingStatus(userId) {
    const pair = await Pair.findOne({
      where: {
        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
        status: 'active',
      },
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'first_name', 'gender', 'city'],
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'first_name', 'gender', 'city'],
        },
      ],
    });

    if (!pair) {
      return { status: 'unpaired' };
    }

    const partnerData = pair.user1Id === userId ? pair.Receiver : pair.Requester;
    
    return {
      status: 'paired',
      pairId: pair.id,
      partner: {
        id: partnerData.id,
        name: partnerData.first_name,
        gender: partnerData.gender,
        city: partnerData.city,
      },
    };
  }

  async sendPairRequest(requesterId, partnerEmail) {
    if (!partnerEmail) {
      const error = new Error('Email партнера не указан.');
      error.statusCode = 400;
      throw error;
    }
    
    const partner = await User.findOne({ where: { email: partnerEmail } });
    if (!partner) {
      const error = new Error('Пользователь с таким email не найден.');
      error.statusCode = 404;
      throw error;
    }

    if (requesterId === partner.id) {
        const error = new Error('Нельзя создать пару с самим собой.');
        error.statusCode = 400;
        throw error;
    }

    const existingPair = await Pair.findOne({
        where: {
            [Op.or]: [
                { user1Id: requesterId, user2Id: partner.id },
                { user1Id: partner.id, user2Id: requesterId },
            ]
        }
    });

    if (existingPair) {
        const error = new Error('Запрос на создание пары с этим пользователем уже существует.');
        error.statusCode = 409;
        throw error;
    }

    const newPair = await Pair.create({
      user1Id: requesterId,
      user2Id: partner.id,
      status: 'pending',
    });
    return newPair;
  }

  async acceptPairRequest(pairId, userId) {
    const pair = await Pair.findByPk(pairId);
    if (!pair || pair.user2Id !== userId) {
      const error = new Error('Запрос на создание пары не найден или адресован не вам.');
      error.statusCode = 404;
      throw error;
    }
    pair.status = 'active';
    await pair.save();
    return pair;
  }

  async deletePair(pairId, userId) {
    const pair = await Pair.findOne({
        where: {
            id: pairId,
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }]
        }
    });

    if (!pair) {
      const error = new Error('Пара не найдена.');
      error.statusCode = 404;
      throw error;
    }
    
    await pair.destroy();
    return { message: 'Пара успешно удалена.' };
  }
}

module.exports = new PairService();