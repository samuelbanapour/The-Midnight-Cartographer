import { useState, useEffect, useRef } from 'react';
import type { Customer } from '../game/types';

interface CustomerPanelProps {
  customer: Customer;
  clueIndex: number;
  hasExtraClue: boolean;
  onNextClue: () => void;
  onPrevClue: () => void;
  /** Supporters can flip back through clues they've already seen. */
  canReviewClues: boolean;
  onBeginMapping: () => void;
  allCluesSeen: boolean;
}

export default function CustomerPanel({
  customer,
  clueIndex,
  hasExtraClue,
  onNextClue,
  onPrevClue,
  canReviewClues,
  onBeginMapping,
  allCluesSeen,
}: CustomerPanelProps) {
  const totalClues = hasExtraClue
    ? customer.clues.length
    : Math.min(customer.clues.length, 4);
  const currentClue = customer.clues[clueIndex];
  const clueText = currentClue?.text ?? '';

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText('');
    charIndexRef.current = 0;
    setIsTyping(true);

    intervalRef.current = setInterval(() => {
      charIndexRef.current += 1;
      setDisplayedText(clueText.slice(0, charIndexRef.current));
      if (charIndexRef.current >= clueText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [clueText, clueIndex]);

  const skipTyping = () => {
    if (isTyping) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(clueText);
      setIsTyping(false);
    }
  };

  const isLastClue = clueIndex >= totalClues - 1;

  return (
    <div
      className="card-shop animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}
    >
      {/* Customer header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: '2px solid #d4a017',
            backgroundColor: '#2e1a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(212,160,23,0.3)',
          }}
        >
          {customer.emoji}
        </div>
        <div>
          <div
            style={{
              fontFamily: 'Spectral, serif',
              fontWeight: 700,
              fontSize: '1rem',
              color: '#d4a017',
              lineHeight: 1.2,
            }}
          >
            {customer.name}
          </div>
          <div
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: '0.75rem',
              color: '#c4b49a',
              textTransform: 'capitalize',
            }}
          >
            {customer.type}
          </div>
        </div>
      </div>

      {/* Greeting (first time) or clue */}
      {clueIndex === 0 && displayedText === '' ? (
        <div className="dialogue-bubble" style={{ fontSize: '0.88rem', minHeight: '80px' }}>
          <span style={{ visibility: 'hidden' }}>placeholder</span>
          <p style={{ margin: 0 }}>{customer.greeting}</p>
        </div>
      ) : null}

      {/* Clue bubble */}
      <div
        className="dialogue-bubble"
        style={{ fontSize: '0.88rem', minHeight: '80px', cursor: isTyping ? 'pointer' : 'default', flex: 1 }}
        onClick={skipTyping}
        title={isTyping ? 'Click to skip' : undefined}
      >
        <p style={{ margin: 0 }}>{displayedText}<span style={{ opacity: isTyping ? 1 : 0 }}>|</span></p>
      </div>

      {/* Clue indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'Kalam, cursive',
            fontSize: '0.78rem',
            color: '#a07810',
          }}
        >
          Clue {clueIndex + 1} of {totalClues}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: totalClues }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: i <= clueIndex ? '#d4a017' : '#4a3020',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Clue-review hint for non-supporters (only once they're past clue 1) */}
      {!canReviewClues && clueIndex > 0 && (
        <div
          style={{
            fontFamily: 'Kalam, cursive',
            fontSize: '0.7rem',
            color: '#5a4530',
            textAlign: 'center',
          }}
        >
          🔒 Tip the Owl to revisit earlier clues
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        {canReviewClues && clueIndex > 0 && (
          <button
            className="btn-ghost"
            style={{ flex: 1 }}
            onClick={onPrevClue}
            disabled={isTyping}
            title="Re-read the previous clue"
          >
            ← Previous
          </button>
        )}
        {!isLastClue && (
          <button
            className="btn-ghost"
            style={{ flex: 1 }}
            onClick={onNextClue}
            disabled={isTyping}
          >
            Next Clue →
          </button>
        )}
        <button
          className="btn-amber"
          style={{ flex: isLastClue ? 1 : undefined }}
          onClick={onBeginMapping}
          disabled={!allCluesSeen}
          title={!allCluesSeen ? 'Read all clues first' : 'Begin drawing the map'}
        >
          {allCluesSeen ? 'Begin Mapping 🗺' : `Read All Clues (${clueIndex + 1}/${totalClues})`}
        </button>
      </div>
    </div>
  );
}
