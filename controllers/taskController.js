const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendTelegramNotification, notifyAdmins } = require('../utils/telegram');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDeadline = (deadline) => {
  if (!deadline) {
    return 'Belgilanmagan';
  }

  return new Date(deadline).toLocaleString('uz-UZ');
};

const createTask = async (req, res) => {
  try {
    const { title, description, deadline } = req.body;
    let { assignedTo } = req.body;

    if (
      !assignedTo ||
      (typeof assignedTo === 'string' && !assignedTo.trim()) ||
      !mongoose.isValidObjectId(assignedTo)
    ) {
      assignedTo = null;
    }

    if (!title) {
      return res.status(400).json({ message: 'Task title is required.' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      deadline,
      createdBy: req.user._id,
    });

    const creator = await User.findById(req.user._id).select('name email');

    await notifyAdmins(
      [
        '📦 <b>New task created</b>',
        '',
        `<b>Title:</b> ${escapeHtml(task.title)}`,
        `<b>Created by:</b> ${escapeHtml(creator?.name || 'Unknown')}`,
        `<b>Status:</b> ${escapeHtml(task.status)}`,
      ].join('\n')
    );

    if (assignedTo) {
      const assignedUser = await User.findById(assignedTo);

      if (assignedUser?.telegramChatId) {
        const message = [
          '📌 <b>Yangi topshiriq biriktirildi!</b>',
          '',
          `<b>Sarlavha:</b> ${escapeHtml(task.title)}`,
          `<b>Izoh:</b> ${escapeHtml(task.description || 'Mavjud emas')}`,
          `<b>Muddati:</b> ${escapeHtml(formatDeadline(task.deadline))}`,
        ].join('\n');

        await sendTelegramNotification(assignedUser.telegramChatId, message);
      }
    }

    await task.populate('assignedTo', 'name email');
    return res.status(201).json(task);
  } catch (error) {
    console.error('Task creation error:', error);
    return res.status(500).json({ message: 'Unable to create task.' });
  }
};

const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch tasks.' });
  }
};

const updateTask = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const allowedFields = ['title', 'description', 'status', 'assignedTo', 'deadline'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.prototype.hasOwnProperty.call(updates, 'assignedTo')) {
      const assignedTo = updates.assignedTo;

      if (assignedTo === undefined) {
        delete updates.assignedTo;
      } else if (
        !assignedTo ||
        (typeof assignedTo === 'string' && !assignedTo.trim()) ||
        !mongoose.isValidObjectId(assignedTo)
      ) {
        updates.assignedTo = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
      if (typeof updates.status !== 'string') {
        return res.status(400).json({ message: 'Invalid task status.' });
      }

      const normalizedStatus = updates.status
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-');
      const allowedStatuses = ['pending', 'in-progress', 'completed'];

      if (!allowedStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ message: 'Invalid task status.' });
      }

      updates.status = normalizedStatus;
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const statusOrAssigneeUpdated =
      Object.prototype.hasOwnProperty.call(updates, 'status') ||
      Object.prototype.hasOwnProperty.call(updates, 'assignedTo');

    if (statusOrAssigneeUpdated && task.assignedTo) {
      const assignedUserId = task.assignedTo._id || task.assignedTo;
      const assignedUser = await User.findById(assignedUserId);

      if (assignedUser?.telegramChatId) {
        const message = [
          Object.prototype.hasOwnProperty.call(updates, 'assignedTo')
            ? '📌 <b>Topshiriq sizga biriktirildi!</b>'
            : "🔄 <b>Topshiriq holati o'zgardi!</b>",
          '',
          `<b>Sarlavha:</b> ${escapeHtml(task.title)}`,
          `<b>Izoh:</b> ${escapeHtml(task.description || 'Mavjud emas')}`,
          `<b>Muddati:</b> ${escapeHtml(formatDeadline(task.deadline))}`,
          `<b>Holati:</b> ${escapeHtml(task.status)}`,
        ].join('\n');

        await sendTelegramNotification(assignedUser.telegramChatId, message);
      }
    }

    return res.status(200).json(task);
  } catch (error) {
    console.error('Update Task Error:', error);
    return res.status(500).json({ message: 'Unable to update task.' });
  }
};

const deleteTask = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid task ID.' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete task.' });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
