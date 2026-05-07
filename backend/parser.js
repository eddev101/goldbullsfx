/**
 * parser.js
 * Parses Telegram signal messages into structured data.
 *
 * Handles format like:
 * "Gold Trader Alliance ❤ Trade Setup #08 - May 06 🧑‍💻 XAU/USD Buy
 *  4696 - 4693 📌 Stoploss : 4690
 *  - Take Profit : 4701 ( 80pips )
 *  - Take Profit : 4735 ( 250pips)
 *  Price has just retested..."
 */

function parseSignal(text) {
  // ── 1. Must contain XAU/USD or XAUUSD to be a signal ──────────────────
  if (!/(XAU\/USD|XAUUSD)/i.test(text)) return null;

  // ── 2. Must contain BUY or SELL ────────────────────────────────────────
  const actionMatch = text.match(/\b(buy|sell)\b/i);
  if (!actionMatch) return null;
  const action = actionMatch[1].toUpperCase();

  // ── 3. Entry range: two numbers separated by " - " near the action ─────
  //    e.g. "4696 - 4693" or "2340 - 2335"
  //    We look for this pattern after the BUY/SELL word
  const entryMatch = text.match(/(\d{3,5}(?:\.\d+)?)\s*[-–]\s*(\d{3,5}(?:\.\d+)?)/);
  let entry_high = null;
  let entry_low = null;
  if (entryMatch) {
    const a = parseFloat(entryMatch[1]);
    const b = parseFloat(entryMatch[2]);
    entry_high = Math.max(a, b);
    entry_low = Math.min(a, b);
  }

  // ── 4. Stoploss ─────────────────────────────────────────────────────────
  const slMatch = text.match(/stop\s*loss\s*[:\-]?\s*(\d{3,5}(?:\.\d+)?)/i);
  const sl = slMatch ? parseFloat(slMatch[1]) : null;

  // ── 5. Take Profits (collect all occurrences) ───────────────────────────
  const tpRegex = /take\s*profit\s*[:\-]?\s*(\d{3,5}(?:\.\d+)?)/gi;
  const tps = [];
  let tpMatch;
  while ((tpMatch = tpRegex.exec(text)) !== null) {
    tps.push(parseFloat(tpMatch[1]));
  }
  const tp1 = tps[0] ?? null;
  const tp2 = tps[1] ?? null;

  // ── 6. Trade number / label (optional, for notes) ──────────────────────
  const setupMatch = text.match(/Trade Setup\s*#?(\d+)/i);
  const setupNum = setupMatch ? `#${setupMatch[1]}` : null;

  // ── 7. Comment: everything after the last TP line ──────────────────────
  //    We strip the structured part and keep the analysis text as comment
  const commentMatch = text.match(/\d+\s*\(\s*\d+pips\s*\)[^\n]*\n?([\s\S]*)/i);
  let comment = commentMatch ? commentMatch[1].trim() : null;
  if (comment && comment.length < 3) comment = null;

  return {
    pair: 'XAUUSD',
    action,
    entry_high,
    entry_low,
    sl,
    tp1,
    tp2,
    status: 'Active',
    result: null,
    profit_loss: null,
    comment: comment || (setupNum ? `Trade Setup ${setupNum}` : null),
  };
}

module.exports = { parseSignal };
