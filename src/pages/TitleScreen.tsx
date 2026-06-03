import { useEffect, useRef } from 'react';
import RemoveAdsButton from '../components/RemoveAdsButton';

interface TitleScreenProps {
  onStart: (fresh: boolean) => void;
  hasSave: boolean;
}

const RAIN_DROPS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  height: `${60 + Math.random() * 80}px`,
  delay: `${Math.random() * 4}s`,
  duration: `${0.6 + Math.random() * 1.2}s`,
  opacity: 0.2 + Math.random() * 0.4,
}));

export default function TitleScreen({ onStart, hasSave }: TitleScreenProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // no-op: rain is pure CSS
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a0e05',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 16px',
        gap: '0',
      }}
    >
      {/* Rain */}
      <div className="rain-container">
        {RAIN_DROPS.map(drop => (
          <div
            key={drop.id}
            className="rain-drop"
            style={{
              left: drop.left,
              height: drop.height,
              animationDelay: drop.delay,
              animationDuration: drop.duration,
              opacity: drop.opacity,
            }}
          />
        ))}
      </div>

      {/* Radial amber glow behind owl */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(212,160,23,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '28px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Owl icon */}
        <div
          className="animate-float"
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: '3px solid #d4a017',
            backgroundColor: '#241408',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '52px',
            boxShadow:
              '0 0 32px rgba(212,160,23,0.35), inset 0 0 20px rgba(212,160,23,0.08)',
            animation: 'float 4s ease-in-out infinite, candleFlicker 3s ease-in-out infinite',
          }}
        >
          🦉
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1
            style={{
              fontFamily: 'Spectral, serif',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 6vw, 2.6rem)',
              color: '#d4a017',
              margin: 0,
              letterSpacing: '-0.01em',
              textShadow: '0 0 30px rgba(212,160,23,0.3)',
              animation: 'fadeIn 0.8s ease-out',
            }}
          >
            The Midnight
            <br />
            Cartographer
          </h1>
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontStyle: 'italic',
              fontSize: '1rem',
              color: '#a07810',
              margin: 0,
              animation: 'fadeIn 1s ease-out 0.2s both',
            }}
          >
            A cozy cartography shop. Open until dawn.
          </p>
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: '100%',
            maxWidth: '240px',
            height: '1px',
            background:
              'linear-gradient(to right, transparent, #8b5e3c, transparent)',
            animation: 'fadeIn 1.2s ease-out 0.4s both',
          }}
        />

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            maxWidth: '260px',
            animation: 'slideUp 0.6s ease-out 0.5s both',
          }}
        >
          <button
            className="btn-amber"
            style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem' }}
            onClick={() => onStart(true)}
          >
            Begin a New Night
          </button>
          {hasSave && (
            <button
              className="btn-ghost"
              style={{ fontSize: '0.95rem', padding: '0.65rem 1.5rem' }}
              onClick={() => onStart(false)}
            >
              Continue Journey
            </button>
          )}
          <RemoveAdsButton />
        </div>

        {/* Flavour text */}
        <p
          style={{
            fontFamily: 'Kalam, cursive',
            fontSize: '0.78rem',
            color: '#4a3020',
            margin: 0,
            animation: 'fadeIn 1.4s ease-out 0.8s both',
          }}
        >
          Adventures arrive. Maps are drawn.
          <br />
          Truth is approximated.
        </p>
      </div>
    </div>
  );
}
