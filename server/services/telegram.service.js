const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { Op } = require('sequelize');
const { Event, User, Pair } = require('../models'); // Импортируем модели через index
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

let bot;

const startBot = () => {
  if (!token) {
    return;
  }

  bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `Привет! 👋\n\nВаш ID для привязки к аккаунту LoveMemory:\n\n\`${chatId}\`\n\nСкопируйте этот ID и вставьте его в настройках вашего профиля на сайте.`,
      { parse_mode: 'Markdown' }
    );
  });

  bot.on('polling_error', (error) => {
  });
  
  };

const sendMessage = (chatId, message) => {
  if (!bot) {
    return;
  }
  try {
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch(error) {
  }
};

const sendDailyReminders = async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));

  try {
    const eventsToday = await Event.findAll({
      where: {
        event_date: {
          [Op.gte]: startOfDay,
          [Op.lt]: endOfDay,
        },
      },
      include: [{ model: User, attributes: ['id', 'telegram_chat_id'] }]
    });

    if (eventsToday.length === 0) {
        return;
    }

    const notifications = new Map();

    for (const event of eventsToday) {
      const user = event.User;
      if (user && user.telegram_chat_id) {
        if (!notifications.has(user.telegram_chat_id)) {
          notifications.set(user.telegram_chat_id, []);
        }
        notifications.get(user.telegram_chat_id).push(event.title);
      }
    }

    for (const [chatId, titles] of notifications.entries()) {
      const message = `*Напоминание на сегодня* 🔔\n\nСегодня у вас запланировано:\n- ${titles.join('\n- ')}`;
      sendMessage(chatId, message);
    }
    } catch (error) {
  }
};

const startCronJobs = () => {
  // Запускать каждый день в 9:00 утра
  cron.schedule('0 9 * * *', sendDailyReminders, {
    scheduled: true,
    timezone: "Europe/Moscow"
  });
  
  // Telegram bot for notifications started
};

module.exports = { startBot, sendMessage, startCronJobs };