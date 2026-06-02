export type TileType =
  | 'empty' | 'forest' | 'river' | 'mountain'
  | 'desert' | 'ruins' | 'village' | 'dungeon'
  | 'lair' | 'swamp' | 'sea';

export type CustomerType = 'knight' | 'mage' | 'merchant' | 'monster' | 'ranger' | 'bard';

export type UpgradeEffect =
  | 'accuracy_bonus'
  | 'reputation_shield'
  | 'extra_clue'
  | 'gold_bonus'
  | 'cozy_decor'
  | 'enchanted_ink';

export type GamePhase =
  | 'title'
  | 'night_open'
  | 'map_drawing'
  | 'map_submitted'
  | 'night_summary'
  | 'upgrade_shop'
  | 'game_over';

export interface Clue {
  text: string;
  tileType: TileType;
  gridX: number;
  gridY: number;
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  emoji: string;
  regionId: string;
  greeting: string;
  departurePositive: string;
  departureNegative: string;
  clues: Clue[];
  baseReward: number;
}

export interface ShopUpgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  purchased: boolean;
  effect: UpgradeEffect;
}

export interface WorldRegion {
  id: string;
  name: string;
  lore: string;
  trueTiles: TileType[][];
}

export interface LoreEntry {
  id: string;
  unlockedOnDay: number;
  text: string;
}

export interface ActiveContract {
  customer: Customer;
  playerGrid: TileType[][];
  accuracy: number | null;
  goldEarned: number | null;
  repChange: number | null;
}

export interface NightResult {
  day: number;
  customersServed: number;
  totalGold: number;
  totalRepChange: number;
  loreUnlocked: LoreEntry | null;
}

export interface GameState {
  day: number;
  gold: number;
  reputation: number;
  completedContracts: number;
  failedContracts: number;
  upgrades: ShopUpgrade[];
  discoveredLore: LoreEntry[];
  phase: GamePhase;
  currentContract: ActiveContract | null;
  customerQueue: Customer[];
  currentCustomerIndex: number;
  nightResult: NightResult | null;
}
