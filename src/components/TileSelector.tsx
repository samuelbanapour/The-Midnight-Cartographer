import type { TileType } from '../game/types';

const SELECTABLE_TILES: Array<{ type: TileType; emoji: string; label: string; bg: string }> = [
  { type: 'forest',   emoji: '🌲', label: 'Forest',   bg: '#1e3d1a' },
  { type: 'river',    emoji: '〰',        label: 'River',    bg: '#1a2d4a' },
  { type: 'mountain', emoji: '⛰',        label: 'Mountain', bg: '#3d3530' },
  { type: 'desert',   emoji: '🏙',  label: 'Desert',   bg: '#5c4a1e' },
  { type: 'ruins',    emoji: '○',        label: 'Ruins',    bg: '#2d2840' },
  { type: 'village',  emoji: '🏠',  label: 'Village',  bg: '#4a2e1a' },
  { type: 'dungeon',  emoji: '⬡',        label: 'Dungeon',  bg: '#1a1a2e' },
  { type: 'lair',     emoji: '🐉',  label: 'Lair',     bg: '#3d1a1a' },
  { type: 'swamp',    emoji: '🌿',  label: 'Swamp',    bg: '#1a2e1e' },
  { type: 'sea',      emoji: '🌊',  label: 'Sea',      bg: '#1a1e3d' },
];

interface TileSelectorProps {
  selected: TileType | null;
  onSelect: (tile: TileType) => void;
}

export default function TileSelector({ selected, onSelect }: TileSelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        gap: '6px',
        padding: '8px 4px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
      }}
    >
      {SELECTABLE_TILES.map(({ type, emoji, label, bg }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            title={label}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              backgroundColor: bg,
              border: isSelected
                ? '2px solid #d4a017'
                : '2px solid rgba(139,94,60,0.4)',
              borderRadius: '6px',
              padding: '6px 8px',
              cursor: 'pointer',
              minWidth: '52px',
              transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.15s, border-color 0.15s',
              boxShadow: isSelected
                ? '0 0 10px rgba(212,160,23,0.4)'
                : 'none',
            }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{emoji}</span>
            <span
              style={{
                fontFamily: 'Kalam, cursive',
                fontSize: '9px',
                color: isSelected ? '#d4a017' : '#c4b49a',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
