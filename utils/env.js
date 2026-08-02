const getBotToken = () =>
  process.env.BOT_TOKEN?.trim() || process.env.TELEGRAM_BOT_TOKEN?.trim() || '';

const getAdminTelegramIds = () => {
  const raw = process.env.TELEGRAM_ADMIN_IDS || '';
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (!getBotToken()) {
    console.warn('BOT_TOKEN (or TELEGRAM_BOT_TOKEN) is not set — Telegram bot will be disabled.');
  }

  if (!process.env.CLIENT_URL?.trim() && process.env.NODE_ENV === 'production') {
    console.warn('CLIENT_URL is not set — CORS will fall back to same-origin only.');
  }
};

module.exports = { getBotToken, getAdminTelegramIds, validateEnv };
