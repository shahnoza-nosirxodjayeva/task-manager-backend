const { Scenes } = require('telegraf');
const User = require('../../models/User');

const broadcastScene = new Scenes.WizardScene(
  'broadcast',
  async (ctx) => {
    await ctx.reply(
      'Enter the message you want to broadcast to all linked users.\n\nSend /cancel to abort.',
      { reply_markup: { remove_keyboard: true } }
    );
    return ctx.wizard.next();
  },
  async (ctx) => {
    const text = ctx.message?.text?.trim();

    if (!text) {
      await ctx.reply('Please send a text message.');
      return;
    }

    ctx.session.broadcastMessage = text;

    await ctx.reply(`Preview:\n\n${text}`, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Send to all', callback_data: 'broadcast_confirm' },
            { text: '❌ Cancel', callback_data: 'broadcast_cancel' },
          ],
        ],
      },
    });

    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.callbackQuery?.data === 'broadcast_cancel') {
      await ctx.answerCbQuery('Broadcast cancelled.');
      await ctx.reply('Broadcast cancelled.', {
        reply_markup: { remove_keyboard: true },
      });
      return ctx.scene.leave();
    }

    if (ctx.callbackQuery?.data !== 'broadcast_confirm') {
      return;
    }

    await ctx.answerCbQuery('Sending broadcast...');

    const message = ctx.session.broadcastMessage;
    const users = await User.find({ telegramChatId: { $ne: null } }).select('telegramChatId name');

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await ctx.telegram.sendMessage(user.telegramChatId, message);
        sent += 1;
      } catch (error) {
        failed += 1;
        console.error(`Broadcast failed for ${user.name}:`, error.message);
      }
    }

    await ctx.editMessageReplyMarkup(undefined);
    await ctx.reply(`Broadcast finished.\nSent: ${sent}\nFailed: ${failed}`);
    return ctx.scene.leave();
  }
);

broadcastScene.command('cancel', async (ctx) => {
  await ctx.reply('Broadcast cancelled.');
  return ctx.scene.leave();
});

module.exports = { broadcastScene };
