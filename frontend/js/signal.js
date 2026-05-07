/**
 * signal.js — Signal detail page logic
 * Reads ?id= from URL, fetches the signal, renders the full trade card.
 */

function fmt(val) { return val != null ? val : '—'; }

function statusBadge(status) {
  const map = {
    'Active': 'badge-active',
    'TP Hit': 'badge-tp',
    'SL Hit': 'badge-sl',
    'Closed': 'badge-closed',
  };
  return `<span class="badge ${map[status] || 'badge-closed'}">${status}</span>`;
}

function actionBadge(action) {
  return `<span class="badge ${action === 'BUY' ? 'badge-buy' : 'badge-sell'}">${action}</span>`;
}

function resultColor(result) {
  if (!result) return '';
  if (result === 'Win') return 'green';
  if (result === 'Loss') return 'red';
  return '';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

async function loadSignal() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('detail-root').innerHTML =
      '<div class="error-banner">No signal ID provided.</div>';
    return;
  }

  const { data: s, error } = await sb
    .from('signals')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !s) {
    document.getElementById('detail-root').innerHTML =
      '<div class="error-banner">Signal not found.</div>';
    return;
  }

  // Update page title
  document.title = `${s.pair} ${s.action} — GoldBullsFX`;

  const entryStr = (s.entry_high != null && s.entry_low != null)
    ? `${s.entry_high} – ${s.entry_low}`
    : fmt(s.entry_high ?? s.entry_low);

  document.getElementById('detail-root').innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div class="detail-header-left">
          <h1>${s.pair}</h1>
          <div class="badges">
            ${actionBadge(s.action)}
            ${statusBadge(s.status)}
          </div>
        </div>
      </div>

      <div class="detail-body">
        <div class="detail-grid">
          <div class="detail-field wide">
            <label>Entry Range</label>
            <div class="val gold">${entryStr}</div>
          </div>

          <div class="detail-field">
            <label>Stop Loss</label>
            <div class="val red">${fmt(s.sl)}</div>
          </div>

          <div class="detail-field">
            <label>Take Profit 1</label>
            <div class="val green">${fmt(s.tp1)}</div>
          </div>

          <div class="detail-field">
            <label>Take Profit 2</label>
            <div class="val green">${fmt(s.tp2)}</div>
          </div>

          <div class="detail-field">
            <label>Result</label>
            <div class="val ${resultColor(s.result)}">${fmt(s.result)}</div>
          </div>

          <div class="detail-field">
            <label>Profit / Loss (pips)</label>
            <div class="val ${s.profit_loss > 0 ? 'green' : s.profit_loss < 0 ? 'red' : ''}">${fmt(s.profit_loss)}</div>
          </div>
        </div>

        ${s.comment ? `
        <div class="comment-box">
          <label>Analysis / Notes</label>
          <p>${s.comment}</p>
        </div>` : ''}

        <div class="timestamps">
          <span>📅 Posted: ${formatDate(s.created_at)}</span>
          <span>🔄 Updated: ${formatDate(s.updated_at)}</span>
        </div>
      </div>
    </div>
  `;
}

loadSignal();
