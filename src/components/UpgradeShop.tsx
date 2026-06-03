import type { ShopUpgrade } from '../game/types';
import TipButton from './TipButton';

interface UpgradeShopProps {
  upgrades: ShopUpgrade[];
  gold: number;
  day: number;
  onBuy: (upgradeId: string) => void;
  onNextNight: () => void;
}

export default function UpgradeShop({ upgrades, gold, day, onBuy, onNextNight }: UpgradeShopProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a0e05',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        gap: '20px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s ease-out' }}>
        <div style={{ fontSize: '36px', marginBottom: '6px' }}>🦉</div>
        <h2
          style={{
            fontFamily: 'Spectral, serif',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#d4a017',
            margin: 0,
          }}
        >
          Owl's Supply Cabinet
        </h2>
        <p
          style={{
            fontFamily: 'Kalam, cursive',
            fontSize: '0.85rem',
            color: '#a07810',
            margin: '4px 0 0',
          }}
        >
          You have{' '}
          <span style={{ color: '#d4a017', fontWeight: 700 }}>{gold}g</span> to spend
        </p>
      </div>

      {/* Grid of upgrades */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px',
          width: '100%',
          maxWidth: '720px',
        }}
      >
        {upgrades.map(upgrade => {
          const canAfford = gold >= upgrade.cost;
          return (
            <div
              key={upgrade.id}
              className="card-shop"
              style={{
                opacity: upgrade.purchased ? 0.6 : 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: 'fadeIn 0.4s ease-out',
                border: upgrade.purchased
                  ? '1px solid #4a3020'
                  : canAfford
                  ? '1px solid #d4a017'
                  : '1px solid #4a3020',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{upgrade.icon}</span>
                <div>
                  <div
                    style={{
                      fontFamily: 'Spectral, serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#f5e6d0',
                    }}
                  >
                    {upgrade.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Kalam, cursive',
                      fontSize: '0.75rem',
                      color: '#d4a017',
                    }}
                  >
                    {upgrade.purchased ? 'Owned' : `${upgrade.cost}g`}
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontFamily: 'Spectral, serif',
                  fontSize: '0.82rem',
                  color: '#c4b49a',
                  margin: 0,
                  lineHeight: 1.5,
                  flex: 1,
                }}
              >
                {upgrade.description}
              </p>
              {!upgrade.purchased && (
                <button
                  className={canAfford ? 'btn-amber' : 'btn-ghost'}
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.4rem 0.8rem',
                    opacity: canAfford ? 1 : 0.5,
                    color: canAfford ? undefined : '#e53935',
                    borderColor: canAfford ? undefined : '#8b2020',
                  }}
                  onClick={() => canAfford && onBuy(upgrade.id)}
                  disabled={!canAfford}
                >
                  {canAfford ? `Buy for ${upgrade.cost}g` : `Need ${upgrade.cost - gold}g more`}
                </button>
              )}
              {upgrade.purchased && (
                <div
                  style={{
                    fontFamily: 'Kalam, cursive',
                    fontSize: '0.78rem',
                    color: '#4caf50',
                    textAlign: 'center',
                  }}
                >
                  ✓ Installed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Begin next night */}
      <button
        className="btn-amber"
        style={{ fontSize: '1.05rem', padding: '0.75rem 2.5rem', marginTop: '8px' }}
        onClick={onNextNight}
      >
        Begin Night {day} 🌙
      </button>

      <TipButton compact />
    </div>
  );
}
