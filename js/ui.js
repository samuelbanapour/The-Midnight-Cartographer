// ============================================================
//  UI — all DOM manipulation, zero game logic
// ============================================================
import { TILE_TYPES } from './data.js';

const GRID_COLS = 6;
const GRID_ROWS = 6;

// ── Screen management ──────────────────────────────────────
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

export function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

export function hideModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ── Map Grid ───────────────────────────────────────────────
export function initMapGrid(onCellClick, onCellRightClick) {
  const grid = document.getElementById('map-grid');
  grid.innerHTML = '';
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'map-cell empty';
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => onCellClick(row, col));
      cell.addEventListener('contextmenu', e => {
        e.preventDefault();
        onCellRightClick(row, col);
      });
      grid.appendChild(cell);
    }
  }
}

export function renderMap(mapData, hints = {}, highlights = {}) {
  const cells = document.querySelectorAll('.map-cell');
  cells.forEach(cell => {
    const row = +cell.dataset.row;
    const col = +cell.dataset.col;
    const tile = mapData[row][col];

    // Reset classes
    cell.className = 'map-cell';
    cell.innerHTML = '';

    if (tile) {
      const def = TILE_TYPES[tile.type];
      cell.classList.add(tile.type);
      if (tile.fixed) cell.classList.add('fixed');
      if (tile.hint)  cell.classList.add('crystal-hint');

      const emoji = document.createElement('span');
      emoji.className = 'tile-emoji';
      emoji.textContent = def?.emoji ?? '?';
      cell.appendChild(emoji);

      if (tile.label) {
        const lbl = document.createElement('span');
        lbl.className = 'tile-label';
        lbl.textContent = tile.label;
        cell.appendChild(lbl);
      }
    } else {
      cell.classList.add('empty');
    }

    // Highlights (post-scoring)
    const key = `${row},${col}`;
    if (highlights[key] === 'correct') cell.classList.add('highlight-correct');
    else if (highlights[key] === 'reveal')  cell.classList.add('highlight-wrong');

    // Hint dots (Better Ink)
    if (hints[key] === 'hot')  cell.classList.add('hint-warm');
    else if (hints[key] === 'warm') cell.classList.add('hint-warm');
  });
}

// ── Tile Palette ───────────────────────────────────────────
export function renderPalette(availableTiles, selectedTile, onSelect) {
  const container = document.getElementById('tile-palette');
  container.innerHTML = '';
  for (const id of availableTiles) {
    const def = TILE_TYPES[id];
    if (!def) continue;
    const btn = document.createElement('button');
    btn.className = 'palette-tile' + (selectedTile === id ? ' selected' : '');
    btn.dataset.type = id;
    btn.title = def.desc;
    btn.innerHTML = `<span class="tile-emoji">${def.emoji}</span><span class="tile-name">${def.label}</span>`;
    btn.addEventListener('click', () => onSelect(id));
    container.appendChild(btn);
  }
}

// ── Customer ───────────────────────────────────────────────
export function renderCustomer(customer) {
  document.getElementById('customer-emoji').textContent = customer.emoji;
  document.getElementById('customer-name').textContent  = customer.name;
  document.getElementById('customer-type').textContent  = customer.type;

  const box = document.getElementById('testimony-text');
  box.innerHTML = customer.testimony
    .map((line, i) =>
      `<p class="testimony-line" style="animation-delay:${i * 0.18}s">${line}</p>`
    )
    .join('');
}

// ── Stats Panel ────────────────────────────────────────────
export function updateStats(state) {
  document.getElementById('stat-night').textContent = state.night;
  document.getElementById('stat-gold').textContent  = `💰 ${state.gold}`;

  const stars = Math.round(state.reputation / 20);
  document.getElementById('stat-rep').innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<span class="rep-star${i < stars ? '' : ' dim'}">★</span>`
  ).join('');

  const remaining = state.nightCustomers.length - state.currentCustomerIdx - 1;
  document.getElementById('stat-queue').textContent =
    remaining > 0 ? `${remaining} waiting` : 'Last one';
}

// ── Log ────────────────────────────────────────────────────
export function addLogEntry(text) {
  const container = document.getElementById('event-log-entries');
  const entry = document.createElement('div');
  entry.className = 'log-entry new';
  entry.textContent = text;
  container.insertBefore(entry, container.firstChild);
  setTimeout(() => entry.classList.remove('new'), 600);
  while (container.children.length > 8) container.removeChild(container.lastChild);
}

// ── Result Modal ───────────────────────────────────────────
export function renderResult(result, customer) {
  const { score, goldEarned, trustChange } = result;

  const title =
    score.percent >= 70 ? '✅ Map Accepted!' :
    score.percent >= 40 ? '⚠️ Partially Accurate' :
                          '❌ Map Rejected';
  document.getElementById('result-title').textContent = title;

  document.getElementById('result-score-display').innerHTML = `
    <div class="score-total">
      <span class="score-num">${score.earned}</span>
      <span class="score-sep">/</span>
      <span class="score-max">${score.max}</span>
      <span class="score-pct">(${score.percent}%)</span>
    </div>
    <div class="score-breakdown">
      ${score.breakdown.map(b => `
        <div class="score-item ${b.pts === b.max ? 'perfect' : b.pts > 0 ? 'partial' : 'miss'}">
          <span class="score-tile-emoji">${TILE_TYPES[b.type]?.emoji ?? '?'}</span>
          <span class="score-tile-name">${b.label}</span>
          <span class="score-tile-result">${b.note}</span>
          <span class="score-tile-pts">${b.pts}/${b.max}</span>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('result-feedback').textContent =
    score.percent >= 70 ? customer.successMessage :
    score.percent >= 40 ? `${customer.name} studies the map carefully, then nods slowly.` :
                          customer.failureMessage;

  const trustClass = trustChange > 0 ? 'pos' : trustChange < 0 ? 'neg' : 'neu';
  document.getElementById('result-reward').innerHTML = `
    <span class="reward-gold">+${goldEarned} gold</span>
    <span class="reward-trust ${trustClass}">${trustChange >= 0 ? '+' : ''}${trustChange} reputation</span>
  `;
}

// ── Night End Screen ───────────────────────────────────────
export function renderNightEnd(state, nightData) {
  const stats = {
    total: state.nightResults.length,
    avgPct: state.nightResults.length
      ? Math.round(state.nightResults.reduce((s, r) => s + r.score.percent, 0) / state.nightResults.length)
      : 0,
    goldEarned: state.nightResults.reduce((s, r) => s + r.goldEarned, 0),
  };

  document.getElementById('night-end-title').textContent = `Night ${state.night} Complete`;

  document.getElementById('night-end-summary').innerHTML = `
    <div class="summary-item"><span>Maps Made</span><strong>${stats.total}</strong></div>
    <div class="summary-item"><span>Avg Accuracy</span><strong>${stats.avgPct}%</strong></div>
    <div class="summary-item"><span>Gold Earned</span><strong>💰 ${stats.goldEarned}</strong></div>
    <div class="summary-item"><span>Total Gold</span><strong>💰 ${state.gold}</strong></div>
  `;

  // Return visitors
  const returnSection = document.createElement('div');
  returnSection.className = 'return-visitors';
  if (nightData.returnVisitors?.length) {
    returnSection.innerHTML = `<h3>👥 Returning Customers</h3>` +
      nightData.returnVisitors.map(v => `
        <div class="return-visitor">
          <span class="rv-emoji">${v.emoji}</span>
          <div>
            <strong>${v.name}:</strong>
            <span class="rv-msg">${v.message}</span>
            ${v.bonusGold ? `<span class="rv-bonus">+${v.bonusGold} bonus gold!</span>` : ''}
          </div>
        </div>
      `).join('');
  }
  const existing = document.querySelector('.return-visitors');
  if (existing) existing.remove();
  document.querySelector('.night-end-content').insertBefore(
    returnSection,
    document.getElementById('world-shift-news')
  );

  // World shift
  const shiftBox = document.getElementById('world-shift-news');
  if (nightData.worldShift) {
    shiftBox.classList.remove('hidden');
    document.getElementById('world-shift-text').textContent = nightData.worldShift;
  } else {
    shiftBox.classList.add('hidden');
  }

  document.getElementById('next-night-num').textContent = state.night + 1;
}

// ── Shop Screen ────────────────────────────────────────────
export function renderShop(state, upgrades) {
  document.getElementById('shop-gold-amount').textContent = state.gold;

  const grid = document.getElementById('upgrade-grid');
  grid.innerHTML = '';

  for (const upg of upgrades) {
    const purchased = state.upgrades[upg.id];
    const canAfford = state.gold >= upg.cost;

    const card = document.createElement('div');
    card.className = [
      'upgrade-card',
      purchased ? 'purchased' : '',
      !purchased && !canAfford ? 'unaffordable' : '',
    ].join(' ');

    card.innerHTML = `
      <div class="upgrade-icon">${upg.icon}</div>
      <div class="upgrade-name">${upg.name}</div>
      <div class="upgrade-desc">${upg.description}</div>
      <div class="upgrade-cost">${purchased ? '✓ Owned' : `💰 ${upg.cost} gold`}</div>
    `;

    if (!purchased) {
      card.addEventListener('click', () => {
        if (!canAfford) return;
        card.dispatchEvent(new CustomEvent('purchase', {
          bubbles: true,
          detail: { upgradeId: upg.id, cost: upg.cost },
        }));
      });
    }
    grid.appendChild(card);
  }
}

// ── End Screen ─────────────────────────────────────────────
export function renderEnd(state) {
  const rep = state.reputation;
  const title =
    rep >= 80 ? 'A Legendary Cartographer!' :
    rep >= 55 ? 'A Skilled Cartographer'    :
    rep >= 30 ? 'A Promising Apprentice'    :
                'Maps… were drawn.';

  document.getElementById('end-title').textContent = title;
  document.getElementById('end-narrative').innerHTML = `
    <p>The sun rises over the city. Three nights of testimony, ink, and mystery are behind you.</p>
    <p style="margin-top:0.6rem">
      ${rep >= 70
        ? 'Adventurers across the land speak of the owl cartographer whose maps never lie. The world feels more settled — and a little less prone to moving overnight.'
        : 'Your maps guided many travellers, though some returned singed. With more practice, perhaps the world\'s secrets will yield to you.'}
    </p>
    <p style="margin-top:0.6rem;font-style:italic;color:var(--text-muted)">
      And somewhere out there, the Cartographer's Stone rests — finally, perhaps, in the right place on a map.
    </p>
  `;

  document.getElementById('final-score').innerHTML = `
    <div class="final-stat"><span>Maps Completed</span><strong>${state.totalMapsCompleted}</strong></div>
    <div class="final-stat"><span>Final Gold</span><strong>💰 ${state.gold}</strong></div>
    <div class="final-stat"><span>Reputation</span><strong>${state.reputation}/100</strong></div>
  `;
}
