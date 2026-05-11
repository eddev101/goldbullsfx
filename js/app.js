/**
 * app.js — Home feed logic
 * Fetches all signals newest-first, renders cards, subscribes to realtime inserts.
 * Auto-updates timestamps every minute.
 * Fetches live XAUUSD price to auto-detect Waiting/Active/TP/SL status.
 */

// ── Live price ─────────────────────────────────────────────────────────────
let livePrice = null;

async function fetchLivePrice() {
  try {
    // Twelve Data free tier — 800 requests/day, no key needed for this endpoint
    const res = await fetch('https://api.twelvedata.com/price?symbol=XAU/USD&apikey=demo');
    const data = await res.json();
    if (data && data.price) {
      livePrice = parseFloat(data.price);
      const el = document.getElementById('live-price');
      if (el) el.textContent = `XAU/USD $${livePrice.toFixed(2)}`;
    }
  } catch (e) {
    // Silently fail — price display just won't show
  }
}

// ── Auto status from live price ────────────────────────────────────────────
function computeStatus(signal) {
  // If already closed/resolved, keep it
  if (['TP1 Hit', 'TP2 Hit', 'SL Hit', 'Closed'].includes(signal.status)) {
    return signal.status;
  }
  if (livePrice === null) return signal.status;

  const price = livePrice;
  const isBuy = signal.action === 'BUY';

  // SL hit
  if (isBuy  && price <= signal.sl) return 'SL Hit';
  if (!isBuy && price >= signal.sl) return 'SL Hit';

  // TP2 hit
  if (signal.tp2) {
    if (isBuy  && price >= signal.tp2) return 'TP2 Hit';
    if (!isBuy && price <= signal.tp2) return 'TP2 Hit';
  }

  // TP1 hit
  if (signal.tp1) {
    if (isBuy  && price >= signal.tp1) return 'TP1 Hit';
    if (!isBuy && price <= signal.tp1) return 'TP1 Hit';
  }

  // Price inside entry range = Active
  if (signal.entry_high && signal.entry_low) {
    if (price <= signal.entry_high && price >= signal.entry_low) return 'Active';
  }

  // Price hasn't reached entry yet = Waiting
  if (isBuy  && price < signal.entry_low)  return 'Waiting';
  if (!isBuy && price > signal.entry_high) return 'Waiting';

  return 'Active';
}

// ── Helpers ────────────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'Waiting': 'badge-waiting',
    'Active':  'badge-active',
    'TP1 Hit': 'badge-tp',
    'TP2 Hit': 'badge-tp',
    'SL Hit':  'badge-sl',
    'Closed':  'badge-closed',
  };
  return `<span class="badge ${map[status] || 'badge-closed'}">${status}</span>`;
}

function actionBadge(action) {
  return `<span class="badge ${action === 'BUY' ? 'badge-buy' : 'badge-sell'}">${action}</span>`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(val) { return val != null ? val : '—'; }

function renderCard(signal) {
  const entryStr = (signal.entry_high != null && signal.entry_low != null)
    ? `${signal.entry_high} – ${signal.entry_low}`
    : fmt(signal.entry_high ?? signal.entry_low);

  const displayStatus = computeStatus(signal);

  return `
    <a class="signal-card" href="signal.html?id=${signal.id}" data-id="${signal.id}">
      <div class="card-top">
        <div class="pair-action">
          <span class="pair">${signal.pair}</span>
          ${actionBadge(signal.action)}
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${statusBadge(displayStatus)}
        </div>
      </div>

      <div class="card-numbers">
        <div class="num-block">
          <label>Entry</label>
          <span>${entryStr}</span>
        </div>
        <div class="num-block">
          <label>SL</label>
          <span>${fmt(signal.sl)}</span>
        </div>
        <div class="num-block">
          <label>TP1</label>
          <span>${fmt(signal.tp1)}</span>
        </div>
        <div class="num-block">
          <label>TP2</label>
          <span>${fmt(signal.tp2)}</span>
        </div>
      </div>

      <div class="card-footer">
        <time data-ts="${signal.created_at}">${timeAgo(signal.created_at)}</time>
        <span class="card-arrow">→</span>
      </div>
    </a>
  `;
}

// ── Refresh timestamps every 60s (no reload needed) ───────────────────────
function refreshTimestamps() {
  document.querySelectorAll('time[data-ts]').forEach(el => {
    el.textContent = timeAgo(el.dataset.ts);
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
const feed = document.getElementById('feed');
let allSignals = [];

async function loadSignals() {
  feed.innerHTML = `
    <div class="skeleton"></div>
    <div class="skeleton"></div>
    <div class="skeleton"></div>
  `;

  const { data, error } = await sb
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    feed.innerHTML = `<div class="error-banner">Failed to load signals: ${error.message}</div>`;
    return;
  }

  if (!data || data.length === 0) {
    feed.innerHTML = `
      <div class="empty">
        <div class="empty-icon">📭</div>
        <p>No signals yet. Forward a signal to the bot to get started.</p>
      </div>
    `;
    return;
  }

  allSignals = data;
  feed.innerHTML = data.map(renderCard).join('');
}

// Re-render status badges when price updates
function refreshStatusBadges() {
  allSignals.forEach(signal => {
    const card = document.querySelector(`[data-id="${signal.id}"]`);
    if (!card) return;
    const badgeEl = card.querySelector('.badge:last-child');
    if (!badgeEl) return;
    const newStatus = computeStatus(signal);
    const map = {
      'Waiting': 'badge-waiting',
      'Active':  'badge-active',
      'TP1 Hit': 'badge-tp',
      'TP2 Hit': 'badge-tp',
      'SL Hit':  'badge-sl',
      'Closed':  'badge-closed',
    };
    badgeEl.className = `badge ${map[newStatus] || 'badge-closed'}`;
    badgeEl.textContent = newStatus;
  });
}

// ── Realtime: new signals pop in instantly ────────────────────────────────
sb.channel('signals-feed')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload) => {
    allSignals.unshift(payload.new);
    const newCard = document.createElement('div');
    newCard.innerHTML = renderCard(payload.new);
    const card = newCard.firstElementChild;

    const empty = feed.querySelector('.empty');
    if (empty) feed.innerHTML = '';

    card.style.borderColor = 'var(--gold)';
    feed.prepend(card);
    setTimeout(() => { card.style.borderColor = ''; }, 2000);
  })
  .subscribe();

// ── Kick everything off ───────────────────────────────────────────────────
fetchLivePrice();
loadSignals();

// Refresh timestamps every 60 seconds
setInterval(refreshTimestamps, 60000);

// Refresh price + status badges every 30 seconds
setInterval(async () => {
  await fetchLivePrice();
  refreshStatusBadges();
}, 30000);
