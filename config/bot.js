const { Telegraf } = require('telegraf');
const User = require('../models/User');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start(async (ctx) => {
  try {
    const userId = ctx.payload || ctx.message?.text?.split(' ')[1];

    if (!userId) {
      await ctx.reply('Welcome! Please link your account from the Task Manager Web App.');
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { telegramChatId: ctx.chat.id.toString() },
      { new: true }
    );

    if (!user) {
      await ctx.reply('Unable to link this account. Please request a new link from the Task Manager Web App.');
      return;
    }

    await ctx.reply('Your Telegram account has been successfully linked to Task Manager!');
  } catch (error) {
    console.error('Telegram account linking failed:', error.message);
    await ctx.reply('Unable to link your account right now. Please try again later.').catch(() => {});
  }
});

bot.catch((error) => {
  console.error('Telegram bot error:', error.message);
});

const launchBot = async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot was not launched: TELEGRAM_BOT_TOKEN is not configured.');
    return;
  }

  try {
    await bot.launch();
    console.log('Telegram bot is running.');
  } catch (error) {
    console.error('Telegram bot failed to launch:', error.message);
  }
};

module.exports = { bot, launchBot };
