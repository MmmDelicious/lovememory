const Gift = require('../models/Gift');
const User = require('../models/User');
const Pair = require('../models/Pair');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Отправить подарок
const sendGift = async (req, res) => {
  try {
    console.log('sendGift called with req.user:', req.user);
    console.log('sendGift called with req.body:', req.body);
    
    const { giftType, message, price } = req.body;
    const fromUserId = req.user.id;
    
    console.log('fromUserId:', fromUserId);
    
    // Проверяем баланс пользователя
    const user = await User.findByPk(fromUserId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    
    if (user.coins < parseInt(price)) {
      return res.status(400).json({ message: 'Недостаточно монеток' });
    }
    
    // Находим активную пару
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
      return res.status(400).json({ message: 'У вас нет активного партнера для отправки подарка' });
    }
    
    // Определяем партнера
    const partner = activePair.user1Id === fromUserId ? activePair.Receiver : activePair.Requester;
    
    // Обрабатываем фото если есть
    let photoPath = null;
    if (req.file) {
      photoPath = req.file.filename;
    }
    
    // Создаем подарок
    const gift = await Gift.create({
      fromUserId,
      toUserId: partner.id,
      giftType,
      message,
      photoPath,
      price: parseInt(price)
    });
    
    // Списываем монетки
    await user.update({
      coins: user.coins - parseInt(price)
    });
    
    // Отправляем уведомление через WebSocket если партнер онлайн
    const io = req.app.get('socketio');
    if (io) {
      // Проверяем если партнер онлайн
      const partnerSocketId = req.app.get('userSockets')?.[partner.id];
      if (partnerSocketId) {
        io.to(partnerSocketId).emit('gift_received', {
          id: gift.id,
          giftType: gift.giftType,
          message: gift.message,
          photoPath: gift.photoPath,
          senderName: user.first_name || 'Ваш партнер',
          createdAt: gift.createdAt
        });
        
        // Помечаем как доставленный
        await gift.update({ 
          isDelivered: true, 
          deliveredAt: new Date() 
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Подарок успешно отправлен!',
              gift: {
        id: gift.id,
        giftType: gift.giftType,
        isDelivered: gift.isDelivered
      },
      remainingCoins: user.coins - parseInt(price)
    });
    
  } catch (error) {
    console.error('Error sending gift:', error);
    res.status(500).json({ message: 'Ошибка при отправке подарка' });
  }
};

// Получить список подарков
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
    console.error('Error getting gifts:', error);
    res.status(500).json({ message: 'Ошибка при получении подарков' });
  }
};

// Отметить подарок как просмотренный
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
      return res.status(404).json({ message: 'Подарок не найден' });
    }
    
    await gift.update({
      isViewed: true,
      viewedAt: new Date()
    });
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Error marking gift as viewed:', error);
    res.status(500).json({ message: 'Ошибка при обновлении подарка' });
  }
};

// Получить непросмотренные подарки
const getUnviewedGifts = async (req, res) => {
  try {
    console.log('getUnviewedGifts called with req.user:', req.user);
    const userId = req.user.id;
    console.log('userId for getUnviewedGifts:', userId);
    
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
      limit: 20 // Лимит для непросмотренных подарков
    });
    
    res.json(gifts);
    
  } catch (error) {
    console.error('Error getting unviewed gifts:', error);
    res.status(500).json({ message: 'Ошибка при получении подарков' });
  }
};

// Получить статистику подарков
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
    console.error('Error getting gift stats:', error);
    res.status(500).json({ message: 'Ошибка при получении статистики' });
  }
};

module.exports = {
  sendGift,
  getGifts,
  markGiftAsViewed,
  getUnviewedGifts,
  getGiftStats
};
