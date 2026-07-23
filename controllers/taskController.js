const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendTelegramNotification } = require('../utils/telegram');

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
    const { title, description, assignedTo, deadline } = req.body;

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

    return res.status(201).json(task);
  } catch (error) {
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
          "🔄 <b>Topshiriq holati o'zgardi!</b>",
          '',
          `<b>Sarlavha:</b> ${escapeHtml(task.title)}`,
          `<b>Yangi holat:</b> ${escapeHtml(task.status)}`,
        ].join('\n');

        await sendTelegramNotification(assignedUser.telegramChatId, message);
      }
    }

    return res.status(200).json(task);
  } catch (error) {
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
