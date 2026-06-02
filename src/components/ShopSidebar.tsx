import type { ShopUpgrade } from '../game/types';

interface ShopSidebarProps {
  gold: number;
  reputation: number;
  day: number;
  completedContracts: number;
  upgrades: ShopUpgrade[];
  customersTonight: number;
  customersServedTonight: number;
}

export default function ShopSidebar({
  gold,
  reputation,
  day,
  completedContracts,
  upgrades,
  customersTonight,
  customersServedTonight,
}: ShopSidebarProps) {
  const purchasedUpgrades = upgrades.filter(u => u.purchased);

  const repColor =
    reputation > 60 ? '#4caf50' : reputation > 30 ? '#d4a017' : '#e53935';

  return (
    <div
      className="card-shop"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid #4a3020',
          paddingBottom: '10px',
        }}
      >
        <span className="animate-candle-flicker" style={{ fontSize: '20px' }}>
          🕯️
        </span>
        <span
          style={{
            fontFamily: 'Spectral, serif',
            fontWeight: 700,
            fontSize: '0.95rem',
            color: '#d4a017',
          }}
        >
          The Cartographer
        </span>
      </div>

      {/* Day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>🌙</span>
        <div>
          <div
            style={{
              fontFamily: 'Kalam, cursive',
              fontSize: '0.75rem',
              color: '#a07810',
              lineHeight: 1,
            }}
          >
            Night
          </div>
          <div
            style={{
              fontFamily: 'Spectral, serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#f5e6d0',
              lineHeight: 1.2,
            }}
          >
            {day}
          </div>
        </div>
      </div>

      {/* Gold */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>🪙</span>
        <div>
          <div
            style={{
              fontFamily: 'Kalam, cursive',
              fontSize: '0.75rem',
              color: '#a07810',
              lineHeight: 1,
            }}
          >
            Gold
          </div>
          <div
            style={{
              fontFamily: 'Spectral, serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#d4a017',
              lineHeight: 1.2,
            }}
          >
            {gold}g
          </div>
        </div>
      </div>

      {/* Reputation */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              fontFamily: 'Kalam, cursive',
              fontSize: '0.75rem',
              color: '#a07810',
            }}
          >
            ⭐ Reputation
          </span>
          <span
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: '0.85rem',
              color: repColor,
              fontWeight: 600,
            }}
          >
            {reputation}/100
          </span>
        </div>
        <div
          style={{
            height: '8px',
            backgroundColor: '#2e1a0a',
            borderRadius: '9999px',
            border: '1px solid #4a3020',
            overflow: 'hidden',
          }}
        >
          <div
            className="rep-bar-fill"
            style={{
              width: `${Math.max(0, Math.min(100, reputation))}%`,
              backgroundColor: repColor,
            }}
          />
        </div>
      </div>

      {/* Tonight */}
      <div
        style={{
          backgroundColor: '#1a0e05',
          borderRadius: '6px',
          padding: '8px 10px',
          border: '1px solid #3a2010',
        }}
      >
        <div
          style={{
            fontFamily: 'Kalam, cursive',
            fontSize: '0.72rem',
            color: '#a07810',
            marginBottom: '4px',
          }}
        >
          Tonight's customers
        </div>
        <div
          style={{
            fontFamily: 'Spectral, serif',
            fontSize: '0.95rem',
            color: '#f5e6d0',
          }}
        >
          {customersServedTonight} / {customersTonight}
        </div>
      </div>

      {/* Completed contracts */}
      <div
        style={{
          fontFamily: 'Kalam, cursive',
          fontSize: '0.75rem',
          color: '#a07810',
        }}
      >
        Maps drawn: {completedContracts}
      </div>

      {/* Purchased upgrades */}
      {purchasedUpgrades.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'Kalam, cursive',
              fontSize: '0.72rem',
              color: '#a07810',
              marginBottom: '6px',
            }}
          >
            Shop upgrades
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {purchasedUpgrades.map(u => (
              <span
                key={u.id}
                title={u.name}
                style={{
                  fontSize: '18px',
                  lineHeight: 1,
                  cursor: 'default',
                }}
              >
                {u.icon}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
