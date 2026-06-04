import { useEffect, useState } from 'react';
import {
  DEFAULT_TIP_SKU,
  TIP_TIERS,
  isSupporter,
  onEntitlementChange,
  purchaseSupporter,
  restorePurchases,
} from '../services/monetization';

interface TipButtonProps {
  /** Compact variant for tight spots (e.g. the upgrade shop footer). */
  compact?: boolean;
}

export default function TipButton({ compact = false }: TipButtonProps) {
  const [supported, setSupported] = useState(isSupporter());
  const [busy, setBusy] = useState(false);
  const [selectedSku, setSelectedSku] = useState(DEFAULT_TIP_SKU);

  useEffect(() => onEntitlementChange(setSupported), []);

  const selectedTier = TIP_TIERS.find(t => t.sku === selectedSku) ?? TIP_TIERS[1];

  const handleBuy = async () => {
    if (busy) return;
    setBusy(true);
    await purchaseSupporter(selectedSku);
    setBusy(false);
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    await restorePurchases();
    setBusy(false);
  };

  if (supported) {
    return (
      <div
        style={{
          fontFamily: 'Kalam, cursive',
          fontSize: compact ? '0.72rem' : '0.8rem',
          color: '#8b7355',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: 'center',
        }}
      >
        ✓ Supporter — thank you, friend
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {/* Tip amount chips ($1 minimum, $2.99 default pre-selected) */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {TIP_TIERS.map(tier => {
          const active = tier.sku === selectedSku;
          return (
            <button
              key={tier.sku}
              onClick={() => setSelectedSku(tier.sku)}
              disabled={busy}
              style={{
                fontFamily: 'Kalam, cursive',
                fontSize: compact ? '0.72rem' : '0.8rem',
                padding: compact ? '0.25rem 0.6rem' : '0.3rem 0.75rem',
                borderRadius: '999px',
                cursor: busy ? 'default' : 'pointer',
                border: active ? '1px solid #d4a017' : '1px solid #4a3020',
                background: active ? 'rgba(212,160,23,0.15)' : 'transparent',
                color: active ? '#d4a017' : '#8b7355',
              }}
            >
              {tier.label}
            </button>
          );
        })}
      </div>

      <button
        className="btn-ghost"
        disabled={busy}
        onClick={handleBuy}
        style={{
          fontSize: compact ? '0.8rem' : '0.9rem',
          padding: compact ? '0.45rem 1rem' : '0.6rem 1.4rem',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? 'Please wait…' : `☕ Tip the Owl ${selectedTier.label}`}
      </button>
      <button
        onClick={handleRestore}
        disabled={busy}
        style={{
          background: 'none',
          border: 'none',
          cursor: busy ? 'default' : 'pointer',
          fontFamily: 'Kalam, cursive',
          fontSize: '0.7rem',
          color: '#5a4530',
          textDecoration: 'underline',
        }}
      >
        Restore purchase
      </button>
    </div>
  );
}
