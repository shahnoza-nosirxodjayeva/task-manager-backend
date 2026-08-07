const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { notifyAdmins } = require('../utils/telegram');

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  telegramChatId: user.telegramChatId,
  isTelegramConnected: Boolean(user.telegramChatId),
  role: user.role,
  token: createToken(user._id),
});

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    telegramChatId: req.user.telegramChatId,
    isTelegramConnected: Boolean(req.user.telegramChatId),
    role: req.user.role,
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await notifyAdmins(
      [
        '🆕 <b>New user registered</b>',
        '',
        `<b>Name:</b> ${escapeHtml(user.name)}`,
        `<b>Email:</b> ${escapeHtml(user.email)}`,
        `<b>Role:</b> ${escapeHtml(user.role)}`,
      ].join('\n')
    );

    return res.status(201).json(formatUserResponse(user));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to register user.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    return res.status(200).json(formatUserResponse(user));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to log in.' });
  }
};

module.exports = { registerUser, loginUser, getCurrentUser };
