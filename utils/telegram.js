const User = require('../models/User');
const { bot } = require('../config/bot');
const { getAdminTelegramIds } = require('./env');

const sendTelegramNotification = async (chatId, message) => {
  if (!chatId || !bot) {
    return;
  }

  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
  }
};

const getAdminChatIds = async () => {
  const configuredIds = getAdminTelegramIds();
  const chatIds = new Set();

  const dbAdmins = await User.find({
    role: 'admin',
    telegramChatId: { $ne: null },
  }).select('telegramChatId telegramUserId');

  dbAdmins.forEach((admin) => chatIds.add(admin.telegramChatId));

  if (configuredIds.length) {
    const linkedConfiguredAdmins = await User.find({
      telegramUserId: { $in: configuredIds },
      telegramChatId: { $ne: null },
    }).select('telegramChatId telegramUserId');

    linkedConfiguredAdmins.forEach((admin) => chatIds.add(admin.telegramChatId));

    const linkedIds = new Set([
      ...dbAdmins.map((admin) => admin.telegramUserId).filter(Boolean),
      ...linkedConfiguredAdmins.map((admin) => admin.telegramUserId).filter(Boolean),
    ]);

    for (const telegramUserId of configuredIds) {
      if (!linkedIds.has(telegramUserId)) {
        chatIds.add(telegramUserId);
      }
    }
  }

  return [...chatIds];
};

const notifyAdmins = async (message) => {
  const adminChatIds = await getAdminChatIds();
  await Promise.all(adminChatIds.map((chatId) => sendTelegramNotification(chatId, message)));
};

module.exports = { sendTelegramNotification, notifyAdmins };
