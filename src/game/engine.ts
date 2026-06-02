import type { GameState, ShopUpgrade, Customer, TileType, LoreEntry } from './types';
import { CUSTOMERS, UPGRADES, LORE_ENTRIES } from './data';
import { WORLD_REGIONS } from './worldMap';

const SAVE_KEY = 'midnight_cartographer_v1';
const GRID_SIZE = 7;
const CUSTOMERS_PER_NIGHT = 3;

export function createInitialState(): GameState {
  return {
    day: 1,
    gold: 50,
    reputation: 70,
    completedContracts: 0,
    failedContracts: 0,
    upgrades: UPGRADES.map(u => ({ ...u, purchased: false })),
    discoveredLore: [],
    phase: 'night_open',
    currentContract: null,
    customerQueue: buildQueue(1),
    currentCustomerIndex: 0,
    nightResult: null,
  };
}

export function buildQueue(day: number): Customer[] {
  const count = day === 1 ? 2 : CUSTOMERS_PER_NIGHT;
  const offset = (day - 1) * CUSTOMERS_PER_NIGHT;
  const result: Customer[] = [];
  for (let i = 0; i < count; i++) {
    result.push(CUSTOMERS[(offset + i) % CUSTOMERS.length]);
  }
  return result;
}

export function emptyGrid(): TileType[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array<TileType>(GRID_SIZE).fill('empty')
  );
}

export function scoreGrid(
  playerGrid: TileType[][],
  regionId: string,
  upgrades: ShopUpgrade[]
): number {
  const region = WORLD_REGIONS.find(r => r.id === regionId);
  if (!region) return 0;
  let correct = 0;
  let total = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const truth = region.trueTiles[y][x];
      if (truth === 'empty') continue;
      total++;
      if (playerGrid[y][x] === truth) correct++;
    }
  }
  let score = total > 0 ? Math.round((correct / total) * 100) : 0;
  if (upgrades.find(u => u.id === 'glowing_ink' && u.purchased)) {
    score = Math.min(100, score + 10);
  }
  return score;
}

export function calcReward(
  customer: Customer,
  accuracy: number,
  upgrades: ShopUpgrade[]
): number {
  let reward = Math.round(customer.baseReward * (accuracy / 100));
  if (upgrades.find(u => u.id === 'enchanted_parchment' && u.purchased)) {
    reward = Math.round(reward * 1.2);
  }
  if (
    customer.type === 'monster' &&
    upgrades.find(u => u.id === 'cozy_decor' && u.purchased)
  ) {
    reward = Math.round(reward * 1.3);
  }
  return reward;
}

export function calcRepChange(accuracy: number, upgrades: ShopUpgrade[]): number {
  if (accuracy >= 80) return 10;
  if (accuracy >= 60) return 5;
  if (accuracy >= 40) return -5;
  const hasShield = upgrades.find(u => u.id === 'sturdy_desk' && u.purchased);
  return hasShield ? -8 : -15;
}

export function getRevealedTiles(
  regionId: string,
  upgrades: ShopUpgrade[]
): Array<{ x: number; y: number; type: TileType }> {
  if (!upgrades.find(u => u.id === 'enchanted_ink' && u.purchased)) return [];
  const region = WORLD_REGIONS.find(r => r.id === regionId);
  if (!region) return [];
  const nonEmpty: Array<{ x: number; y: number; type: TileType }> = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (region.trueTiles[y][x] !== 'empty') {
        nonEmpty.push({ x, y, type: region.trueTiles[y][x] });
      }
    }
  }
  for (let i = nonEmpty.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = nonEmpty[i];
    nonEmpty[i] = nonEmpty[j]!;
    nonEmpty[j] = tmp!;
  }
  return nonEmpty.slice(0, 2);
}

export function checkLoreUnlock(
  day: number,
  existing: LoreEntry[]
): LoreEntry | null {
  return (
    LORE_ENTRIES.find(
      e => e.unlockedOnDay === day && !existing.find(ex => ex.id === e.id)
    ) ?? null
  );
}

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
