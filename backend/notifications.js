/**
 * notifications.js
 * Sends push notifications via OneSignal REST API.
 */

require('dotenv').config();

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

/**
 * Core send function — sends to all subscribed users.
 * @param {string} title   - Notification title
 * @param {string} message - Notification body
 * @param {string} url     - URL to open when tapped (optional)
 */
async function sendPush(title, message, url = '/') {
  try {
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify({
        app_id:             ONESIGNAL_APP_ID,
        included_segments:  ['All'],           // send to everyone
        headings:           { en: title },
        contents:           { en: message },
        url,
        chrome_web_icon:    'https://i.imgur.com/placeholder.png', // replace with your icon URL later
        priority:           10,
      }),
    });

    const data = await res.json();
    if (data.errors) {
      console.error('OneSignal error:', data.errors);
    } else {
      console.log(`📲 Push sent: "${title}" → ${data.recipients} recipients`);
    }
  } catch (err) {
    console.error('Failed to send push notification:', err.message);
  }
}

/**
 * Auto-called when bot saves a new signal.
 * @param {Object} signal - saved signal row from Supabase
 */
function notifyNewSignal(signal) {
  const action  = signal.action === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const entry   = (signal.entry_high && signal.entry_low)
    ? `${signal.entry_high} – ${signal.entry_low}`
    : signal.entry_high ?? signal.entry_low ?? '—';

  const title   = `${action} Signal — ${signal.pair}`;
  const message = `Entry: ${entry} | SL: ${signal.sl ?? '—'} | TP1: ${signal.tp1 ?? '—'} | TP2: ${signal.tp2 ?? '—'}`;

  return sendPush(title, message, '/');
}

/**
 * Manual notification — called from admin panel.
 * @param {string} title
 * @param {string} message
 */
function notifyManual(title, message) {
  return sendPush(title, message, '/');
}

// ── Pre-built update templates ─────────────────────────────────────────────
const TEMPLATES = {
  tp1:  { title: '🎯 TP1 Hit!',       message: 'Take Profit 1 has been reached. Consider securing profits.' },
  tp2:  { title: '🎯 TP2 Hit!',       message: 'Take Profit 2 has been reached. Full target achieved!' },
  sl:   { title: '❌ Stop Loss Hit',   message: 'Stop loss has been triggered. Stay disciplined.' },
  be:   { title: '🔒 Move SL to BE',  message: 'Move your stop loss to breakeven to protect your position.' },
  close:{ title: '🔔 Signal Closed',  message: 'This trade has been closed. Check the app for full results.' },
};

/**
 * Send a pre-built template notification.
 * @param {string} templateKey - one of: tp1, tp2, sl, be, close
 * @param {string} pair        - e.g. 'XAUUSD'
 */
function notifyTemplate(templateKey, pair = 'XAUUSD') {
  const t = TEMPLATES[templateKey];
  if (!t) return;
  return sendPush(`${t.title} — ${pair}`, t.message, '/');
}

module.exports = { notifyNewSignal, notifyManual, notifyTemplate, TEMPLATES };
