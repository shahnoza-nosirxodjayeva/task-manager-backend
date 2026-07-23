const { bot } = require('../config/bot');

const sendTelegramNotification = async (chatId, message) => {
  if (!chatId) {
    return;
  }

  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
  }
};

module.exports = { sendTelegramNotification };
