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
const { GoogleAuth } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Get FCM access token helper ───────────────────────────────────────────
async function getFCMToken() {
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const token  = await client.getAccessToken();
  return token.token;
}

// ── Health check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'goldbullsfx-backend' });
});

// ── Subscribe device token to 'signals' topic ─────────────────────────────
app.post('/api/subscribe', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });

  try {
    const accessToken = await getFCMToken();
    const projectId   = process.env.FIREBASE_PROJECT_ID;

    const response = await fetch(
      `https://iid.googleapis.com/iid/v1/${token}/rel/topics/signals`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'access_token_auth': 'true',
        },
      }
    );

    if (response.ok) {
      console.log('✅ Token subscribed to signals topic');
      res.json({ ok: true });
    } else {
      const err = await response.text();
      console.error('Subscribe error:', err);
      res.status(500).json({ error: err });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Manual push notification from admin panel ─────────────────────────────
app.post('/api/notify', async (req, res) => {
  const { type, title, message, key } = req.body;

  try {
    if (type === 'template') {
      if (!TEMPLATES[key]) return res.status(400).json({ error: 'Invalid template key' });
      await notifyTemplate(key);
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

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
