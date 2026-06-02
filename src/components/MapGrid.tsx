import { useState, useCallback } from 'react';
import type { TileType } from '../game/types';

interface TileConfig {
  bg: string;
  emoji: string;
  label: string;
}

const TILE_CONFIG: Record<TileType, TileConfig> = {
  empty:    { bg: '#2e1a0a', emoji: '·', label: 'Empty' },
  forest:   { bg: '#1e3d1a', emoji: '🌲', label: 'Forest' },
  river:    { bg: '#1a2d4a', emoji: '〰', label: 'River' },
  mountain: { bg: '#3d3530', emoji: '⛰', label: 'Mountain' },
  desert:   { bg: '#5c4a1e', emoji: '🏙', label: 'Desert' },
  ruins:    { bg: '#2d2840', emoji: '○', label: 'Ruins' },
  village:  { bg: '#4a2e1a', emoji: '🏠', label: 'Village' },
  dungeon:  { bg: '#1a1a2e', emoji: '⬡', label: 'Dungeon' },
  lair:     { bg: '#3d1a1a', emoji: '🐉', label: 'Lair' },
  swamp:    { bg: '#1a2e1e', emoji: '🌿', label: 'Swamp' },
  sea:      { bg: '#1a1e3d', emoji: '🌊', label: 'Sea' },
};

interface MapGridProps {
  grid: TileType[][];
  selectedTile: TileType | null;
  lockedCells?: Array<{ x: number; y: number }>;
  onCellClick: (x: number, y: number) => void;
  showAccuracy?: boolean;
  trueGrid?: TileType[][];
}

export default function MapGrid({
  grid,
  selectedTile,
  lockedCells = [],
  onCellClick,
  showAccuracy = false,
  trueGrid,
}: MapGridProps) {
  const [lastPlaced, setLastPlaced] = useState<string | null>(null);

  const isLocked = useCallback(
    (x: number, y: number) => lockedCells.some(c => c.x === x && c.y === y),
    [lockedCells]
  );

  const getCellClass = useCallback(
    (x: number, y: number, tile: TileType): string => {
      const classes = ['map-cell'];
      if (isLocked(x, y)) {
        classes.push('locked');
      } else if (showAccuracy && trueGrid) {
        const truth = trueGrid[y]?.[x];
        if (tile !== 'empty' && truth !== 'empty') {
          classes.push(tile === truth ? 'correct-reveal' : 'incorrect-reveal');
        }
      }
      return classes.join(' ');
    },
    [isLocked, showAccuracy, trueGrid]
  );

  const handleClick = useCallback(
    (x: number, y: number) => {
      if (isLocked(x, y)) return;
      if (showAccuracy) return;
      onCellClick(x, y);
      setLastPlaced(`${x},${y}`);
      setTimeout(() => setLastPlaced(null), 250);
    },
    [isLocked, showAccuracy, onCellClick]
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '3px',
        width: '100%',
        maxWidth: '448px',
        margin: '0 auto',
      }}
    >
      {grid.map((row, y) =>
        row.map((tile, x) => {
          const cfg = TILE_CONFIG[tile];
          const key = `${x},${y}`;
          const isNew = lastPlaced === key;
          return (
            <div
              key={key}
              className={getCellClass(x, y, tile)}
              style={{
                backgroundColor: cfg.bg,
                minWidth: '36px',
                minHeight: '36px',
                fontSize: 'clamp(12px, 2.5vw, 20px)',
                animation: isNew ? 'inkDrop 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards' : undefined,
              }}
              onClick={() => handleClick(x, y)}
              title={`${cfg.label} (${x},${y})`}
            >
              <span style={{ lineHeight: 1, pointerEvents: 'none' }}>
                {tile === 'empty' ? (
                  <span style={{ opacity: 0.25, fontSize: '0.7em' }}>{cfg.emoji}</span>
                ) : (
                  cfg.emoji
                )}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
