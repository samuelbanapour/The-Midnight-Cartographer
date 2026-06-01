// ============================================================
//  Game State & Logic
// ============================================================
import { NIGHTS, UPGRADES } from './data.js';

const GRID_COLS = 6;
const GRID_ROWS = 6;

export class Game {
  constructor() {
    this.state = {
      screen: 'start',
      night: 1,
      gold: 50,
      reputation: 60,        // 0–100
      currentCustomerIdx: 0,
      nightCustomers: [],
      currentMap: emptyMap(),
      selectedTile: null,
      nightResults: [],
      upgrades: {
        betterInk: false,
        enchantedLens: false,
        cozyCurtains: false,
        thickParchment: false,
        crystalBall: false,
      },
      crystalBallUsed: false,
      log: [],
      totalMapsCompleted: 0,
    };
  }

  // ── Night ─────────────────────────────────────────────────
  startNight(nightNum) {
    const nightData = NIGHTS[nightNum - 1];
    this.state.night = nightNum;
    this.state.nightCustomers = nightData.customers;
    this.state.currentCustomerIdx = 0;
    this.state.nightResults = [];
    this.state.crystalBallUsed = false;
    this._loadCustomer(0);
    this.addLog(`Night ${nightNum} begins.`);
  }

  // ── Customer ──────────────────────────────────────────────
  _loadCustomer(idx) {
    const customer = this.state.nightCustomers[idx];
    this.state.currentMap = emptyMap();
    this.state.selectedTile = null;

    for (const anchor of customer.anchors) {
      this.state.currentMap[anchor.row][anchor.col] = {
        type: anchor.type,
        fixed: true,
        label: anchor.label,
      };
    }
  }

  currentCustomer() {
    return this.state.nightCustomers[this.state.currentCustomerIdx];
  }

  // ── Map Interaction ───────────────────────────────────────
  selectTile(type) {
    this.state.selectedTile = this.state.selectedTile === type ? null : type;
  }

  placeTile(row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    const cell = this.state.currentMap[row][col];
    if (cell?.fixed) return false;
    if (!this.state.selectedTile) return false;

    this.state.currentMap[row][col] = {
      type: this.state.selectedTile,
      fixed: false,
    };
    return true;
  }

  removeTile(row, col) {
    const cell = this.state.currentMap[row][col];
    if (!cell || cell.fixed) return false;
    this.state.currentMap[row][col] = null;
    return true;
  }

  clearMap() {
    this.state.currentMap = emptyMap();
    const customer = this.currentCustomer();
    for (const anchor of customer.anchors) {
      this.state.currentMap[anchor.row][anchor.col] = {
        type: anchor.type,
        fixed: true,
        label: anchor.label,
      };
    }
    this.state.selectedTile = null;
  }

  useCrystalBall() {
    if (this.state.crystalBallUsed) return false;
    if (!this.state.upgrades.crystalBall) return false;

    const customer = this.currentCustomer();
    // Find a solution tile that isn't already correctly placed
    const notPlaced = customer.solution.filter(s => {
      const cell = this.state.currentMap[s.row][s.col];
      return !cell || cell.type !== s.type;
    });
    if (notPlaced.length === 0) return false;

    // Reveal the highest-value un-placed tile
    const target = notPlaced.reduce((a, b) => (a.points > b.points ? a : b));
    this.state.currentMap[target.row][target.col] = {
      type: target.type,
      fixed: false,
      hint: true,
    };
    this.state.crystalBallUsed = true;
    return target;
  }

  // ── Scoring ───────────────────────────────────────────────
  submitMap() {
    const customer = this.currentCustomer();
    const score = scoreMap(this.state.currentMap, customer.solution);

    let goldEarned;
    if (score.percent >= 70) {
      goldEarned = customer.successGold;
    } else if (score.percent >= 40) {
      goldEarned = Math.round(customer.successGold * 0.5);
    } else {
      goldEarned = customer.failureGold;
    }

    if (this.state.upgrades.thickParchment) {
      goldEarned = Math.round(goldEarned * 1.25);
    }

    let trustChange;
    if (score.percent >= 70) {
      trustChange = customer.successTrust;
    } else if (score.percent >= 40) {
      trustChange = 0;
    } else {
      trustChange = customer.failureTrust;
      if (this.state.upgrades.cozyCurtains) {
        trustChange = Math.ceil(trustChange / 2);
      }
    }

    this.state.gold += goldEarned;
    this.state.reputation = clamp(this.state.reputation + trustChange, 0, 100);
    this.state.totalMapsCompleted++;

    const result = {
      customer: customer.name,
      score,
      goldEarned,
      trustChange,
    };
    this.state.nightResults.push(result);
    this.addLog(`${customer.name}: ${score.percent}% — +${goldEarned}g`);

    return result;
  }

  // ── Progress ──────────────────────────────────────────────
  nextCustomer() {
    this.state.currentCustomerIdx++;
    if (this.state.currentCustomerIdx >= this.state.nightCustomers.length) {
      return 'night-end';
    }
    this._loadCustomer(this.state.currentCustomerIdx);
    return 'continue';
  }

  nightData() {
    return NIGHTS[this.state.night - 1];
  }

  isLastNight() {
    return this.state.night >= NIGHTS.length;
  }

  // ── Shop ──────────────────────────────────────────────────
  purchaseUpgrade(upgradeId, cost) {
    if (this.state.upgrades[upgradeId]) return false;
    if (this.state.gold < cost) return false;
    this.state.gold -= cost;
    this.state.upgrades[upgradeId] = true;
    this.addLog(`Purchased: ${UPGRADES.find(u => u.id === upgradeId)?.name}`);
    return true;
  }

  // ── Helpers ───────────────────────────────────────────────
  addLog(message) {
    this.state.log.unshift({ text: message, ts: Date.now() });
    if (this.state.log.length > 10) this.state.log.pop();
  }

  hintMap() {
    if (!this.state.upgrades.betterInk) return {};
    const customer = this.currentCustomer();
    const warm = {};
    for (const target of customer.solution) {
      // Mark cells within distance 2 of each solution tile
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const r = target.row + dr;
          const c = target.col + dc;
          if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
            const dist = Math.abs(dr) + Math.abs(dc);
            if (dist <= 2 && !warm[`${r},${c}`]) {
              warm[`${r},${c}`] = dist <= 1 ? 'hot' : 'warm';
            }
          }
        }
      }
    }
    return warm;
  }

  revealHighlights(score) {
    if (!this.state.upgrades.enchantedLens) return {};
    const customer = this.currentCustomer();
    const hl = {};
    for (const target of customer.solution) {
      const cell = this.state.currentMap[target.row][target.col];
      if (cell?.type === target.type) {
        hl[`${target.row},${target.col}`] = 'correct';
      } else {
        hl[`${target.row},${target.col}`] = 'reveal';
      }
    }
    return hl;
  }

  summaryStats() {
    const results = this.state.nightResults;
    if (results.length === 0) return { total: 0, avgPercent: 0, goldEarned: 0 };
    return {
      total: results.length,
      avgPercent: Math.round(results.reduce((s, r) => s + r.score.percent, 0) / results.length),
      goldEarned: results.reduce((s, r) => s + r.goldEarned, 0),
    };
  }
}

// ============================================================
//  Pure scoring function
// ============================================================
export function scoreMap(playerMap, solution) {
  let earned = 0;
  let max = 0;
  const breakdown = [];

  for (const target of solution) {
    max += target.points;

    let bestDist = Infinity;
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (playerMap[row][col]?.type === target.type) {
          const dist = Math.abs(row - target.row) + Math.abs(col - target.col);
          if (dist < bestDist) bestDist = dist;
        }
      }
    }

    let pts = 0;
    let note = 'Missing';
    if (bestDist === Infinity) {
      pts = 0; note = 'Missing';
    } else if (bestDist === 0) {
      pts = target.points; note = 'Exact!';
    } else if (bestDist === 1) {
      pts = Math.round(target.points * 0.65); note = 'Very close';
    } else if (bestDist === 2) {
      pts = Math.round(target.points * 0.35); note = 'Nearby';
    } else if (bestDist === 3) {
      pts = Math.round(target.points * 0.1); note = 'Far off';
    } else {
      pts = 0; note = 'Way off';
    }

    earned += pts;
    breakdown.push({
      type: target.type,
      label: target.label || target.type,
      pts,
      max: target.points,
      note,
      targetRow: target.row,
      targetCol: target.col,
    });
  }

  return {
    earned,
    max,
    percent: max > 0 ? Math.round((earned / max) * 100) : 0,
    breakdown,
  };
}

// ── Utilities ─────────────────────────────────────────────
function emptyMap() {
  return Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
