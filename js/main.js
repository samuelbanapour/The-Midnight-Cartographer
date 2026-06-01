// ============================================================
//  Entry Point — wires together Game and UI
// ============================================================
import { Game }    from './game.js';
import { NIGHTS, UPGRADES } from './data.js';
import * as UI     from './ui.js';

let game;

// ============================================================
//  Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  game = new Game();

  // ── Start Screen ─────────────────────────────────────────
  document.getElementById('btn-start').addEventListener('click', () => {
    game.startNight(1);
    UI.showScreen('screen-game');
    renderCurrentCustomer();
    UI.updateStats(game.state);
    UI.addLogEntry(NIGHTS[0].intro);
  });

  // ── Map Grid ─────────────────────────────────────────────
  UI.initMapGrid(
    (row, col) => {
      const { selectedTile } = game.state;
      if (selectedTile) {
        if (game.placeTile(row, col)) {
          renderMap();
        }
      } else {
        // Click non-fixed tile without selection → remove it
        if (game.removeTile(row, col)) renderMap();
      }
    },
    (row, col) => {
      if (game.removeTile(row, col)) renderMap();
    }
  );

  // ── Clear ─────────────────────────────────────────────────
  document.getElementById('btn-clear').addEventListener('click', () => {
    game.clearMap();
    renderMap();
    UI.renderPalette(
      game.currentCustomer().availableTiles,
      game.state.selectedTile,
      tileSelected
    );
  });

  // ── Crystal Ball button (injected if upgrade owned) ───────
  document.addEventListener('click', e => {
    if (e.target.id === 'btn-crystal') {
      const tile = game.useCrystalBall();
      if (tile) {
        renderMap();
        UI.addLogEntry(`Crystal Ball revealed a ${tile.type} tile!`);
        e.target.disabled = true;
        e.target.textContent = '🔮 Used';
      }
    }
  });

  // ── Submit Map ────────────────────────────────────────────
  document.getElementById('btn-submit').addEventListener('click', () => {
    const result   = game.submitMap();
    const customer = game.currentCustomer();

    // Compute highlights
    const highlights = {};
    if (game.state.upgrades.enchantedLens) {
      Object.assign(highlights, game.revealHighlights(result.score));
    }

    // Also mark exact correct cells green for all players
    for (const b of result.score.breakdown) {
      const cell = game.state.currentMap[b.targetRow]?.[b.targetCol];
      if (cell?.type === b.type && !highlights[`${b.targetRow},${b.targetCol}`]) {
        highlights[`${b.targetRow},${b.targetCol}`] = 'correct';
      }
    }

    UI.renderMap(game.state.currentMap, {}, highlights);
    UI.renderResult(result, customer);
    UI.showModal('modal-result');
    UI.updateStats(game.state);
  });

  // ── Next Customer ─────────────────────────────────────────
  document.getElementById('btn-next-customer').addEventListener('click', () => {
    UI.hideModal('modal-result');
    const outcome = game.nextCustomer();

    if (outcome === 'night-end') {
      // Credit return-visitor bonuses
      const nd = game.nightData();
      if (nd.returnVisitors?.length) {
        for (const rv of nd.returnVisitors) {
          if (rv.bonusGold) {
            game.state.gold += rv.bonusGold;
            game.addLog(`${rv.name} returned with a bonus!`);
          }
        }
      }
      UI.renderNightEnd(game.state, nd);
      UI.showScreen('screen-night-end');
    } else {
      renderCurrentCustomer();
      UI.updateStats(game.state);
    }
  });

  // ── Night End → Shop ──────────────────────────────────────
  document.getElementById('btn-to-shop').addEventListener('click', () => {
    UI.renderShop(game.state, UPGRADES);
    UI.showScreen('screen-shop');
  });

  // ── Shop: purchase ────────────────────────────────────────
  document.getElementById('upgrade-grid').addEventListener('purchase', e => {
    const { upgradeId, cost } = e.detail;
    if (game.purchaseUpgrade(upgradeId, cost)) {
      UI.renderShop(game.state, UPGRADES);
      UI.addLogEntry(`New tool acquired!`);
    }
  });

  // ── Next Night ────────────────────────────────────────────
  document.getElementById('btn-next-night').addEventListener('click', () => {
    if (game.isLastNight()) {
      UI.renderEnd(game.state);
      UI.showScreen('screen-end');
      return;
    }
    const nextNight = game.state.night + 1;
    game.startNight(nextNight);
    UI.showScreen('screen-game');
    renderCurrentCustomer();
    UI.updateStats(game.state);
    UI.addLogEntry(NIGHTS[nextNight - 1].intro);
  });

  // ── Restart ───────────────────────────────────────────────
  document.getElementById('btn-restart').addEventListener('click', () => {
    game = new Game();
    UI.showScreen('screen-start');
  });
});

// ============================================================
//  Helpers
// ============================================================
function tileSelected(type) {
  game.selectTile(type);
  UI.renderPalette(
    game.currentCustomer().availableTiles,
    game.state.selectedTile,
    tileSelected
  );
  const hint = document.getElementById('placement-hint');
  hint.textContent = game.state.selectedTile
    ? `Placing: ${game.state.selectedTile} — click map cell to place, right-click to erase`
    : 'Select a tile → click the map to place it';
}

function renderMap() {
  const hints      = game.hintMap();
  UI.renderMap(game.state.currentMap, hints, {});
}

function renderCurrentCustomer() {
  const customer = game.currentCustomer();
  UI.renderCustomer(customer);
  renderMap();

  // Palette
  UI.renderPalette(customer.availableTiles, game.state.selectedTile, tileSelected);

  // Crystal Ball button
  const controls = document.getElementById('map-controls');
  const existing = document.getElementById('btn-crystal');
  if (existing) existing.remove();

  if (game.state.upgrades.crystalBall && !game.state.crystalBallUsed) {
    const btn = document.createElement('button');
    btn.id        = 'btn-crystal';
    btn.className = 'btn btn-secondary';
    btn.textContent = '🔮 Hint';
    btn.title = 'Reveal one solution tile (once per customer)';
    controls.insertBefore(btn, controls.querySelector('#placement-hint'));
  }
}

// Export for potential debugging
window._game = () => game;
