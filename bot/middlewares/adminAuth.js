const User = require('../../models/User');
const { getAdminTelegramIds } = require('../../utils/env');

const isConfiguredAdmin = (telegramUserId) => {
  const adminIds = getAdminTelegramIds();
  return adminIds.includes(String(telegramUserId));
};

const isDatabaseAdmin = async (telegramUserId) => {
  const user = await User.findOne({
    telegramUserId: String(telegramUserId),
    role: 'admin',
  }).select('_id');

  return Boolean(user);
};

const isBotAdmin = async (telegramUserId) => {
  if (!telegramUserId) {
    return false;
  }

  if (isConfiguredAdmin(telegramUserId)) {
    return true;
  }

  return isDatabaseAdmin(telegramUserId);
};

const adminOnly = async (ctx, next) => {
  const telegramUserId = ctx.from?.id;

  if (!(await isBotAdmin(telegramUserId))) {
    await ctx.reply('Access denied. This command is restricted to administrators.');
    return;
  }

  return next();
};

module.exports = { isBotAdmin, adminOnly };
