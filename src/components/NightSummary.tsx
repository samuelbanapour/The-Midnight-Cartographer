import type { NightResult, LoreEntry } from '../game/types';

interface NightSummaryProps {
  result: NightResult;
  lore: LoreEntry | null;
  onContinue: () => void;
}

export default function NightSummary({ result, lore, onContinue }: NightSummaryProps) {
  const repSign = result.totalRepChange >= 0 ? '+' : '';
  const repColor = result.totalRepChange >= 0 ? '#4caf50' : '#e53935';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15,8,2,0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
    >
      <div
        className="card-shop-raised animate-slide-up"
        style={{
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌙</div>
          <h2
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#d4a017',
              margin: 0,
            }}
          >
            Night {result.day} Complete
          </h2>
          <p
            style={{
              fontFamily: 'Kalam, cursive',
              fontSize: '0.85rem',
              color: '#a07810',
              margin: '4px 0 0',
            }}
          >
            The last candle burns out. Dawn approaches.
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
          }}
        >
          <StatCard label="Customers" value={String(result.customersServed)} icon="📜" />
          <StatCard label="Gold Earned" value={`+${result.totalGold}g`} icon="🪙" color="#d4a017" />
          <StatCard
            label="Reputation"
            value={`${repSign}${result.totalRepChange}`}
            icon="⭐"
            color={repColor}
          />
        </div>

        {/* Lore unlock */}
        {lore && (
          <div
            style={{
              backgroundColor: '#1a0e05',
              border: '1px solid #d4a017',
              borderRadius: '8px',
              padding: '14px',
              boxShadow: '0 0 16px rgba(212,160,23,0.2)',
              animation: 'pulse-amber 2s ease-in-out infinite',
            }}
          >
            <div
              style={{
                fontFamily: 'Kalam, cursive',
                fontSize: '0.7rem',
                color: '#d4a017',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
              }}
            >
              ✨ Mystery Fragment Discovered
            </div>
            <p
              style={{
                fontFamily: 'Spectral, serif',
                fontStyle: 'italic',
                fontSize: '0.85rem',
                color: '#f5e6d0',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {lore.text}
            </p>
          </div>
        )}

        {/* Continue */}
        <button className="btn-amber" style={{ fontSize: '1rem', padding: '0.7rem' }} onClick={onContinue}>
          Open Shop 🛒
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = '#f5e6d0',
}: {
  label: string;
  value: string;
  icon: string;
  color?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: '#1a0e05',
        borderRadius: '8px',
        padding: '10px 8px',
        textAlign: 'center',
        border: '1px solid #3a2010',
      }}
    >
      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
      <div
        style={{
          fontFamily: 'Spectral, serif',
          fontWeight: 700,
          fontSize: '1.1rem',
          color,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: 'Kalam, cursive',
          fontSize: '0.7rem',
          color: '#a07810',
          marginTop: '2px',
        }}
      >
        {label}
      </div>
    </div>
  );
}
