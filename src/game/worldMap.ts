import type { WorldRegion, TileType } from './types';

const E: TileType = 'empty';
const F: TileType = 'forest';
const R: TileType = 'river';
const M: TileType = 'mountain';
const D: TileType = 'desert';
const U: TileType = 'ruins';
const V: TileType = 'village';
const N: TileType = 'dungeon';
const L: TileType = 'lair';
const W: TileType = 'swamp';
const S: TileType = 'sea';

export const WORLD_REGIONS: WorldRegion[] = [
  {
    id: 'thornveil',
    name: 'Thornveil Pass',
    lore: 'The mountains of Thornveil breathe. Locals swear they hear them sigh at dusk — a sound like wind through stone lungs.',
    trueTiles: [
      [M, M, M, M, M, M, M],
      [M, M, R, M, M, M, M],
      [M, F, R, M, M, M, M],
      [M, F, F, R, M, M, M],
      [M, F, F, F, R, M, M],
      [M, M, F, F, R, M, M],
      [M, M, M, M, R, M, M],
    ],
  },
  {
    id: 'saltmere',
    name: 'Saltmere Coast',
    lore: 'Ships vanish in Saltmere not by storm, but by choice. Sailors say the sea there has a memory — and a preference.',
    trueTiles: [
      [S, S, S, S, S, S, S],
      [S, S, V, S, S, S, S],
      [S, V, V, F, S, S, S],
      [F, F, F, F, F, S, S],
      [F, F, N, F, F, S, S],
      [F, N, N, N, F, F, S],
      [F, F, F, F, F, F, F],
    ],
  },
  {
    id: 'ashgrave',
    name: 'Ashgrave Desert',
    lore: "The ruins at Ashgrave's heart were not built by human hands — or hands of any known shape. The geometry is wrong.",
    trueTiles: [
      [D, D, D, D, D, D, D],
      [D, D, U, D, D, D, D],
      [D, U, U, U, D, D, D],
      [D, D, U, D, D, D, D],
      [D, D, D, D, U, D, D],
      [D, D, D, U, U, U, D],
      [D, D, D, D, U, D, D],
    ],
  },
  {
    id: 'mirewood',
    name: 'Mirewood Swamp',
    lore: 'Something ancient sleeps in Mirewood. The trees grow in concentric circles around it — cartographers call it the Vigil Formation.',
    trueTiles: [
      [W, W, W, W, W, W, W],
      [W, F, W, W, W, W, W],
      [W, F, F, W, W, W, W],
      [W, F, L, F, W, W, W],
      [W, F, F, F, W, W, W],
      [W, W, F, W, W, W, W],
      [W, W, W, W, W, W, W],
    ],
  },
  {
    id: 'frostpeak',
    name: 'Frostpeak Heights',
    lore: 'The peak has moved three inches east since last century. Cartographers argue about it at conferences. The mountain does not attend conferences.',
    trueTiles: [
      [M, M, M, M, M, M, M],
      [M, M, M, V, M, M, M],
      [M, M, V, V, R, M, M],
      [M, M, R, R, R, M, M],
      [M, R, R, M, M, M, M],
      [M, R, M, M, M, M, M],
      [M, M, M, M, M, M, M],
    ],
  },
];
