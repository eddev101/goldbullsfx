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
const { notifyManual, notifyTemplate, TEMPLATES } = require('./notifications');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Allow admin panel (Netlify) to call this endpoint
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Health check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'goldbullsfx-backend' });
});

// ── Manual push notification from admin panel ─────────────────────────────
// POST /api/notify  { type: 'custom', title, message }
// POST /api/notify  { type: 'template', key: 'tp1'|'tp2'|'sl'|'be'|'close', pair }
app.post('/api/notify', async (req, res) => {
  const { type, title, message, key, pair } = req.body;

  try {
    if (type === 'template') {
      if (!TEMPLATES[key]) return res.status(400).json({ error: 'Invalid template key' });
      await notifyTemplate(key, pair || 'XAUUSD');
    } else {
      if (!title || !message) return res.status(400).json({ error: 'title and message required' });
      await notifyManual(title, message);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
