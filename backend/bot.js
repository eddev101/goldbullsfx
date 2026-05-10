/**
 * bot.js
 * Grammy Telegram bot.
 * Receives forwarded messages, parses them, saves to Supabase.
 *
 * HOW TO USE:
 * 1. Create a bot via @BotFather on Telegram → get token → put in .env
 * 2. Start a private chat with your bot
 * 3. When you see a signal in the public channel, forward it to your bot
 * 4. Bot will parse and save it automatically
 */

require('dotenv').config();
const { Bot } = require('grammy');
const { parseSignal } = require('./parser');
const { insertSignal } = require('./supabase');
const { notifyNewSignal } = require('./notifications');

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// ── Handle all incoming messages ──────────────────────────────────────────
bot.on('message', async (ctx) => {
  const text = ctx.message.text || ctx.message.caption || '';

  if (!text) return;

  // Try to parse as a signal
  const signal = parseSignal(text);

  if (!signal) {
    // Not a signal — ignore silently or send a soft reply
    // Uncomment the line below if you want feedback when a message is skipped:
    // await ctx.reply('⚠️ Could not parse as a signal. Ignored.');
    return;
  }

  try {
    const saved = await insertSignal(signal);

    // 🔔 Push notification to all app users
    notifyNewSignal(saved);

    await ctx.reply(
      `✅ Signal saved!\n\n` +
      `📊 *${saved.pair} ${saved.action}*\n` +
      `🎯 Entry: ${saved.entry_high} – ${saved.entry_low}\n` +
      `🛑 SL: ${saved.sl}\n` +
      `💰 TP1: ${saved.tp1}  |  TP2: ${saved.tp2}\n` +
      `🆔 ID: \`${saved.id}\``,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Failed to save signal:', err.message);
    await ctx.reply(`❌ Error saving signal: ${err.message}`);
  }
});

// ── /start command ────────────────────────────────────────────────────────
bot.command('start', (ctx) => {
  ctx.reply(
    '👋 GoldBullsFX Bot is running!\n\n' +
    'Forward any signal message from the channel here and I\'ll parse and save it automatically.'
  );
});

module.exports = { bot };
