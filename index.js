require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { launchBot, stopBot } = require('./config/bot');
const { validateEnv } = require('./utils/env');
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

validateEnv();

const app = express();

const allowedOrigins = [process.env.CLIENT_URL?.trim()].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'API is running...' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await launchBot(app);
});

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  await stopBot();
  server.close(() => process.exit(0));
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
