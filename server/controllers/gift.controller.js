const Gift = require('../models/Gift');
const User = require('../models/User');
const Pair = require('../models/Pair');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const sendGift = async (req, res) => {
  try {
    const { giftType, message, price } = req.body;
    const fromUserId = req.user.id;
    const user = await User.findByPk(fromUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.coins < parseInt(price)) {
      return res.status(400).json({ message: 'Not enough coins' });
    }
    const activePair = await Pair.findOne({
      where: {
        [Op.or]: [{ user1Id: fromUserId }, { user2Id: fromUserId }],
        status: 'active',
      },
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'first_name', 'last_name', 'avatarUrl'],
        },
        {
          model: User,
          as: 'Receiver',
          attributes: ['id', 'first_name', 'last_name', 'avatarUrl'],
        },
      ],
    });
    if (!activePair) {
      return res.status(400).json({ message: 'You have no active partner to send gift to' });
    }
    const partner = activePair.user1Id === fromUserId ? activePair.Receiver : activePair.Requester;
    let photoPath = null;
    if (req.file) {
      photoPath = req.file.filename;
    }
    const gift = await Gift.create({
      fromUserId,
      toUserId: partner.id,
      giftType,
      message,
      photoPath,
      price: parseInt(price)
    });
    await user.update({
      coins: user.coins - parseInt(price)
    });
    const io = req.app.get('socketio');
    if (io) {
      const partnerSocketId = req.app.get('userSockets')?.[partner.id];
      if (partnerSocketId) {
        io.to(partnerSocketId).emit('gift_received', {
          id: gift.id,
          giftType: gift.giftType,
          message: gift.message,
          photoPath: gift.photoPath,
          senderName: user.first_name || 'Your partner',
          createdAt: gift.createdAt
        });
        await gift.update({ 
          isDelivered: true, 
          deliveredAt: new Date() 
        });
      }
    }
    res.json({
      success: true,
      message: 'Gift sent successfully!',
              gift: {
        id: gift.id,
        giftType: gift.giftType,
        isDelivered: gift.isDelivered
      },
      remainingCoins: user.coins - parseInt(price)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending gift' });
  }
};
const getGifts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'received' } = req.query;
    let whereClause = {};
    if (type === 'received') {
      whereClause.toUserId = userId;
    } else if (type === 'sent') {
      whereClause.fromUserId = userId;
    }
    const gifts = await Gift.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'avatarUrl']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'first_name', 'last_name', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50, // Добавляем лимит для производительности
      offset: parseInt(req.query.offset) || 0 // Пагинация
    });
    res.json(gifts);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении подарков' });
  }
};
const markGiftAsViewed = async (req, res) => {
  try {
    const { giftId } = req.params;
    const userId = req.user.id;
    const gift = await Gift.findOne({
      where: {
        id: giftId,
        toUserId: userId
      }
    });
    if (!gift) {
      return res.status(404).json({ message: 'Gift not found' });
    }
    await gift.update({
      isViewed: true,
      viewedAt: new Date()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating gift' });
  }
};
const getUnviewedGifts = async (req, res) => {
  try {
    const userId = req.user.id;
    const gifts = await Gift.findAll({
      where: {
        toUserId: userId,
        isViewed: false
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'first_name', 'last_name', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    res.json(gifts);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении подарков' });
  }
};
const getGiftStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [sentCount, receivedCount, totalSpent] = await Promise.all([
      Gift.count({ where: { fromUserId: userId } }),
      Gift.count({ where: { toUserId: userId } }),
      Gift.sum('price', { where: { fromUserId: userId } }) || 0
    ]);
    res.json({
      sent: sentCount,
      received: receivedCount,
      totalSpent
    });
  } catch (error) {
    res.status(500).json({ message: 'Error getting statistics' });
  }
};
module.exports = {
  sendGift,
  getGifts,
  markGiftAsViewed,
  getUnviewedGifts,
  getGiftStats
};

