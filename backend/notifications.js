/**
 * notifications.js
 * Sends push notifications via ntfy.sh
 */

require('dotenv').config();

const NTFY_TOPIC = process.env.NTFY_TOPIC;

async function sendPush(title, message, tags = '') {
  try {
    // Encode title to handle emojis in headers
    const encodedTitle = encodeURIComponent(title);

    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: {
        'Title':        encodedTitle,
        'Tags':         tags,
        'Priority':     'high',
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: message,
    });

    if (res.ok) {
      console.log(`📲 Push sent: "${title}"`);
    } else {
      const txt = await res.text();
      console.error('ntfy error:', res.status, txt);
    }
  } catch (err) {
    console.error('Failed to send push:', err.message);
  }
}

function notifyNewSignal(signal) {
  const action  = signal.action === 'BUY' ? 'BUY' : 'SELL';
  const emoji   = signal.action === 'BUY' ? 'green_circle' : 'red_circle';
  const entry   = (signal.entry_high && signal.entry_low)
    ? `${signal.entry_high} - ${signal.entry_low}`
    : signal.entry_high ?? signal.entry_low ?? '-';

  const title   = `New ${action} Signal - ${signal.pair}`;
  const message = `Entry: ${entry} | SL: ${signal.sl ?? '-'} | TP1: ${signal.tp1 ?? '-'} | TP2: ${signal.tp2 ?? '-'}`;

  return sendPush(title, message, emoji);
}

function notifyManual(title, message) {
  return sendPush(title, message, 'bell');
}

const TEMPLATES = {
  tp1:   { title: 'TP1 Hit - XAUUSD',       message: 'Take Profit 1 reached. Consider securing profits.',     tags: 'white_check_mark' },
  tp2:   { title: 'TP2 Hit - XAUUSD',       message: 'Take Profit 2 reached. Full target achieved!',          tags: 'white_check_mark' },
  sl:    { title: 'Stop Loss Hit - XAUUSD',  message: 'Stop loss triggered. Stay disciplined.',                tags: 'x' },
  be:    { title: 'Move SL to BE - XAUUSD',  message: 'Move stop loss to breakeven to protect your position.', tags: 'lock' },
  close: { title: 'Signal Closed - XAUUSD',  message: 'Trade closed. Check the app for full results.',         tags: 'bell' },
};

function notifyTemplate(templateKey) {
  const t = TEMPLATES[templateKey];
  if (!t) return;
  return sendPush(t.title, t.message, t.tags);
}

module.exports = { notifyNewSignal, notifyManual, notifyTemplate, TEMPLATES };
