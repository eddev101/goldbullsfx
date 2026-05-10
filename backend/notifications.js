/**
 * notifications.js
 * Sends push notifications via OneSignal REST API v2.
 */

require('dotenv').config();

const ONESIGNAL_APP_ID  = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY; // os_v2_org_... key

/**
 * Core send function — sends to all subscribed users.
 */
async function sendPush(title, message, url = '/') {
  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`, // v2 uses "Key" not "Basic"
      },
      body: JSON.stringify({
        app_id:            ONESIGNAL_APP_ID,
        target_channel:    'push',
        included_segments: ['All'],
        headings:          { en: title },
        contents:          { en: message },
        url,
        priority:          10,
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
 */
function notifyNewSignal(signal) {
  const action = signal.action === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const entry  = (signal.entry_high && signal.entry_low)
    ? `${signal.entry_high} – ${signal.entry_low}`
    : signal.entry_high ?? signal.entry_low ?? '—';

  const title   = `${action} Signal — ${signal.pair}`;
  const message = `Entry: ${entry} | SL: ${signal.sl ?? '—'} | TP1: ${signal.tp1 ?? '—'} | TP2: ${signal.tp2 ?? '—'}`;

  return sendPush(title, message, '/');
}

/**
 * Manual notification from admin panel.
 */
function notifyManual(title, message) {
  return sendPush(title, message, '/');
}

// ── Pre-built update templates ─────────────────────────────────────────────
const TEMPLATES = {
  tp1:  { title: '🎯 TP1 Hit!',      message: 'Take Profit 1 has been reached. Consider securing profits.' },
  tp2:  { title: '🎯 TP2 Hit!',      message: 'Take Profit 2 has been reached. Full target achieved!' },
  sl:   { title: '❌ Stop Loss Hit',  message: 'Stop loss has been triggered. Stay disciplined.' },
  be:   { title: '🔒 Move SL to BE', message: 'Move your stop loss to breakeven to protect your position.' },
  close:{ title: '🔔 Signal Closed', message: 'This trade has been closed. Check the app for full results.' },
};

function notifyTemplate(templateKey, pair = 'XAUUSD') {
  const t = TEMPLATES[templateKey];
  if (!t) return;
  return sendPush(`${t.title} — ${pair}`, t.message, '/');
}

module.exports = { notifyNewSignal, notifyManual, notifyTemplate, TEMPLATES };
