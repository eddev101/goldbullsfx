/**
 * notifications.js
 * Sends push notifications via Firebase Cloud Messaging (FCM v1 API).
 */

require('dotenv').config();

const FIREBASE_PROJECT_ID   = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const APP_URL               = 'https://goldbullsfx.pages.dev';

// ── Get OAuth2 access token ────────────────────────────────────────────────
async function getAccessToken() {
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    credentials: {
      client_email: FIREBASE_CLIENT_EMAIL,
      private_key:  FIREBASE_PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const token  = await client.getAccessToken();
  return token.token;
}

// ── Core send function ─────────────────────────────────────────────────────
async function sendPush(title, body, path = '/') {

  try {

    const accessToken = await getAccessToken();

    const url =
      `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

    const response = await fetch(url, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },

      body: JSON.stringify({

        message: {

          topic: 'signals',

          notification: {
            title,
            body
          },

          data: {
            url: `${APP_URL}/index.html`
          },

          android: {

            priority: 'HIGH',

            notification: {
              channel_id: 'signals',
              sound: 'default',
              icon: 'ic_launcher',
              click_action: 'OPEN_ACTIVITY_1'
            }

          },

          webpush: {

            notification: {
              icon: '/icons/icon-192.png'
            },

            fcm_options: {
              link: `${APP_URL}/index.html`
            }

          }

        }

      }),

    });

    const data = await response.json();

    if (data.error) {

      console.error('FCM Error:', data.error);

    } else {

      console.log(`📲 Push sent: ${title}`);

    }

  } catch (err) {

    console.error('Push send failed:', err);

  }

}

// ── Signal notifications ───────────────────────────────────────────────────
function notifyNewSignal(signal) {
  const action  = signal.action === 'BUY' ? '🟢 BUY' : '🔴 SELL';
  const entry   = (signal.entry_high && signal.entry_low)
    ? `${signal.entry_high} - ${signal.entry_low}`
    : signal.entry_high ?? signal.entry_low ?? '-';

  const title = `${action} Signal - ${signal.pair}`;
  const body  = `Entry: ${entry} | SL: ${signal.sl ?? '-'} | TP1: ${signal.tp1 ?? '-'} | TP2: ${signal.tp2 ?? '-'}`;
  const path  = `/signal.html?id=${signal.id}`;

  return sendPush(title, body, path);
}

function notifyManual(title, message) {
  return sendPush(title, message, '/');
}

const TEMPLATES = {
  tp1:   { title: '🎯 TP1 Hit - XAUUSD',      body: 'Take Profit 1 reached. Consider securing profits.' },
  tp2:   { title: '🎯 TP2 Hit - XAUUSD',      body: 'Take Profit 2 reached. Full target achieved!' },
  sl:    { title: '❌ Stop Loss Hit - XAUUSD', body: 'Stop loss triggered. Stay disciplined.' },
  be:    { title: '🔒 Move SL to BE - XAUUSD',body: 'Move stop loss to breakeven to protect your position.' },
  close: { title: '🔔 Signal Closed - XAUUSD',body: 'Trade closed. Check the app for full results.' },
};

function notifyTemplate(templateKey) {
  const t = TEMPLATES[templateKey];
  if (!t) return;
  return sendPush(t.title, t.body, '/');
}

module.exports = { notifyNewSignal, notifyManual, notifyTemplate, TEMPLATES };
