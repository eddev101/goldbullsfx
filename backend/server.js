/**
 * server.js
 * Express server — starts the Grammy bot in long-polling mode.
 * Long-polling = no need to set up a webhook URL, works immediately on any machine.
 *
 * HOW TO RUN:
 *   node server.js
 *   or for auto-restart on changes:
 *   npx nodemon server.js
 */

require('dotenv').config();
const express = require('express');
const { bot } = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── Health check endpoint ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'goldbullsfx-backend' });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ── Start Telegram bot (long polling) ────────────────────────────────────
bot.start({
  onStart: () => console.log('🤖 Telegram bot is listening...'),
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
