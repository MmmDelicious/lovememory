const { User, Pair } = require('../models');
const { Op } = require('sequelize');

class PairService {
  async getPairingStatus(userId) {
    if (!userId) {
      const error = new Error('userId is required');
      error.statusCode = 400;
      throw error;
    }
    
    // Ищем активную пару
    const activePair = await Pair.findOne({
      where: {
        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
        status: 'active',
      },
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'first_name', 'display_name', 'gender', 'city', 'email'],
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'first_name', 'display_name', 'gender', 'city', 'email'],
        },
      ],
    });

    // Если есть активная пара, возвращаем её
    if (activePair) {
      const partnerData = activePair.user1_id === userId ? activePair.Receiver : activePair.Requester;
      
      return {
        status: 'active',
        id: activePair.id,
        user1_id: activePair.user1_id,
        user2_id: activePair.user2_id,
        Requester: activePair.Requester,
        Receiver: activePair.Receiver,
        partner: {
          id: partnerData.id,
          name: partnerData.display_name || partnerData.first_name, // Приоритет display_name
          gender: partnerData.gender,
          city: partnerData.city,
        },
      };
    }

    // Ищем pending запрос
    const pendingPair = await Pair.findOne({
      where: {
        [Op.or]: [{ user1_id: userId }, { user2_id: userId }],
        status: 'pending',
      },
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'first_name', 'display_name', 'gender', 'city', 'email'],
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'first_name', 'display_name', 'gender', 'city', 'email'],
        },
      ],
    });

    // Если есть pending запрос, возвращаем его
    if (pendingPair) {
      return {
        status: 'pending',
        id: pendingPair.id,
        user1_id: pendingPair.user1_id,
        user2_id: pendingPair.user2_id,
        Requester: pendingPair.Requester,
        Receiver: pendingPair.Receiver,
      };
    }

    // Если ничего не найдено
    return { status: 'unpaired' };
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
                { user1_id: requesterId, user2_id: partner.id },
                { user1_id: partner.id, user2_id: requesterId },
            ]
        }
    });

    if (existingPair) {
        const error = new Error('Запрос на создание пары с этим пользователем уже существует.');
        error.statusCode = 409;
        throw error;
    }

    const newPair = await Pair.create({
      user1_id: requesterId,
      user2_id: partner.id,
      status: 'pending',
    });
    return newPair;
  }

  async acceptPairRequest(pairId, userId) {
    const pair = await Pair.findByPk(pairId);
    if (!pair || pair.user2_id !== userId) {
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
            [Op.or]: [{ user1_id: userId }, { user2_id: userId }]
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