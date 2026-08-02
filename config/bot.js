const { Telegraf, session, Scenes } = require('telegraf');
const User = require('../models/User');
const { getBotToken } = require('../utils/env');
const { registerAdminCommands } = require('../bot/commands/adminCommands');
const { broadcastScene } = require('../bot/scenes/broadcastScene');

const botToken = getBotToken();
const bot = botToken ? new Telegraf(botToken) : null;

const stage = new Scenes.Stage([broadcastScene]);

const registerBotHandlers = () => {
  if (!bot) {
    return;
  }

  bot.use(session());
  bot.use(stage.middleware());

  bot.start(async (ctx) => {
    try {
      const userId = ctx.payload || ctx.message?.text?.split(' ')[1];
      const telegramUserId = String(ctx.from.id);
      const telegramChatId = String(ctx.chat.id);

      if (!userId) {
        await ctx.reply('Welcome! Please link your account from the Task Manager Web App.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'ℹ️ How to link', callback_data: 'link_help' }],
            ],
          },
        });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { telegramChatId, telegramUserId },
        { new: true }
      );

      if (!user) {
        await ctx.reply(
          'Unable to link this account. Please request a new link from the Task Manager Web App.'
        );
        return;
      }

      await ctx.reply('Your Telegram account has been successfully linked to Task Manager!', {
        reply_markup: {
          keyboard: [[{ text: '📋 My Tasks Info' }]],
          resize_keyboard: true,
        },
      });
    } catch (error) {
      console.error('Telegram account linking failed:', error.message);
      await ctx.reply('Unable to link your account right now. Please try again later.').catch(() => {});
    }
  });

  bot.action('link_help', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(
      'Open the Task Manager Web App, go to your profile, and click "Connect Telegram". You will receive a personalized /start link.'
    );
  });

  bot.hears('📋 My Tasks Info', async (ctx) => {
    await ctx.reply(
      'Task updates are sent here automatically when you are assigned a task or when its status changes.'
    );
  });

  registerAdminCommands(bot);

  bot.catch((error) => {
    console.error('Telegram bot error:', error.message);
  });
};

const getWebhookPath = () => `/telegraf/${bot?.secretPathComponent()}`;

const launchBot = async (app) => {
  if (!bot) {
    return null;
  }

  registerBotHandlers();

  const webhookUrl = process.env.WEBHOOK_URL?.trim();

  if (webhookUrl && app) {
    const path = getWebhookPath();
    app.use(bot.webhookCallback(path));
    await bot.telegram.setWebhook(`${webhookUrl.replace(/\/$/, '')}${path}`);
    console.log(`Telegram bot webhook active at ${path}`);
    return { mode: 'webhook', path };
  }

  await bot.launch();
  console.log('Telegram bot is running in polling mode.');
  return { mode: 'polling' };
};

const stopBot = async () => {
  if (!bot) {
    return;
  }

  if (process.env.WEBHOOK_URL?.trim()) {
    await bot.telegram.deleteWebhook();
  } else {
    bot.stop('SIGTERM');
  }
};

module.exports = { bot, launchBot, stopBot, getWebhookPath };
