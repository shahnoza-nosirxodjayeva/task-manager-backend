const User = require('../../models/User');
const Task = require('../../models/Task');
const { adminOnly } = require('../middlewares/adminAuth');

const adminReplyKeyboard = {
  keyboard: [
    [{ text: '📊 Stats' }, { text: '👥 Users' }],
    [{ text: '📢 Broadcast' }],
  ],
  resize_keyboard: true,
};

const sendStats = async (ctx) => {
  const [totalUsers, linkedUsers, adminUsers, totalTasks, pendingTasks, inProgressTasks, completedTasks] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ telegramChatId: { $ne: null } }),
      User.countDocuments({ role: 'admin' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'in-progress' }),
      Task.countDocuments({ status: 'completed' }),
    ]);

  const message = [
    '📊 <b>System Metrics</b>',
    '',
    `<b>Users:</b> ${totalUsers}`,
    `<b>Linked to Telegram:</b> ${linkedUsers}`,
    `<b>Admins:</b> ${adminUsers}`,
    '',
    `<b>Tasks:</b> ${totalTasks}`,
    `<b>Pending:</b> ${pendingTasks}`,
    `<b>In Progress:</b> ${inProgressTasks}`,
    `<b>Completed:</b> ${completedTasks}`,
  ].join('\n');

  await ctx.reply(message, { parse_mode: 'HTML' });
};

const sendUsersList = async (ctx) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .select('name email role telegramChatId createdAt');

  if (!users.length) {
    await ctx.reply('No users found.');
    return;
  }

  const lines = users.map((user, index) => {
    const linked = user.telegramChatId ? '✅' : '❌';
    return `${index + 1}. ${user.name} (${user.email})\n   Role: ${user.role} | Telegram: ${linked}`;
  });

  await ctx.reply(`👥 <b>Latest Users</b>\n\n${lines.join('\n\n')}`, {
    parse_mode: 'HTML',
  });
};

const registerAdminCommands = (bot) => {
  bot.command('admin', adminOnly, async (ctx) => {
    await ctx.reply('Admin panel', { reply_markup: adminReplyKeyboard });
  });

  bot.command('stats', adminOnly, sendStats);
  bot.command('users', adminOnly, sendUsersList);

  bot.command('broadcast', adminOnly, async (ctx) => {
    await ctx.scene.enter('broadcast');
  });

  bot.hears('📊 Stats', adminOnly, async (ctx) => {
    await ctx.scene.leave().catch(() => {});
    await sendStats(ctx);
  });

  bot.hears('👥 Users', adminOnly, async (ctx) => {
    await ctx.scene.leave().catch(() => {});
    await sendUsersList(ctx);
  });

  bot.hears('📢 Broadcast', adminOnly, async (ctx) => {
    await ctx.scene.enter('broadcast');
  });
};

module.exports = { registerAdminCommands, adminReplyKeyboard };
