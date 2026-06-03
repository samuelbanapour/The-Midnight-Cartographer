import { useEffect, useState } from 'react';
import {
  isAdsRemoved,
  onEntitlementChange,
  purchaseRemoveAds,
  restorePurchases,
} from '../services/monetization';

interface RemoveAdsButtonProps {
  /** Compact variant for tight spots (e.g. the upgrade shop header). */
  compact?: boolean;
}

export default function RemoveAdsButton({ compact = false }: RemoveAdsButtonProps) {
  const [removed, setRemoved] = useState(isAdsRemoved());
  const [busy, setBusy] = useState(false);

  useEffect(() => onEntitlementChange(setRemoved), []);

  const handleBuy = async () => {
    if (busy) return;
    setBusy(true);
    await purchaseRemoveAds();
    setBusy(false);
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    await restorePurchases();
    setBusy(false);
  };

  if (removed) {
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
        ✓ Ad-free — thank you, friend
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
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
        {busy ? 'Please wait…' : '✦ Remove Ads'}
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
