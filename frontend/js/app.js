/**
 * app.js — Home feed logic
 * Fetches all signals newest-first, renders cards, subscribes to realtime inserts.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

function statusBadge(status) {
  const map = {
    'Active':  'badge-active',
    'TP Hit':  'badge-tp',
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

function fmt(val) {
  return val != null ? val : '—';
}

function renderCard(signal) {
  const entryStr = (signal.entry_high != null && signal.entry_low != null)
    ? `${signal.entry_high} – ${signal.entry_low}`
    : fmt(signal.entry_high ?? signal.entry_low);

  return `
    <a class="signal-card" href="signal.html?id=${signal.id}">
      <div class="card-top">
        <div class="pair-action">
          <span class="pair">${signal.pair}</span>
          ${actionBadge(signal.action)}
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          ${statusBadge(signal.status)}
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
        <time>${timeAgo(signal.created_at)}</time>
        <span class="card-arrow">→</span>
      </div>
    </a>
  `;
}

// ── Main ───────────────────────────────────────────────────────────────────

const feed = document.getElementById('feed');

async function loadSignals() {
  // Show skeletons while loading
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

  feed.innerHTML = data.map(renderCard).join('');
}

// ── Realtime: prepend new signals instantly ────────────────────────────────
sb.channel('signals-feed')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, (payload) => {
    const newCard = document.createElement('div');
    newCard.innerHTML = renderCard(payload.new);
    const card = newCard.firstElementChild;

    // Remove empty state if present
    const empty = feed.querySelector('.empty');
    if (empty) feed.innerHTML = '';

    // Prepend with a flash effect
    card.style.borderColor = 'var(--gold)';
    feed.prepend(card);
    setTimeout(() => { card.style.borderColor = ''; }, 2000);
  })
  .subscribe();

loadSignals();
