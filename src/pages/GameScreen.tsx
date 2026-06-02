import { useState, useCallback } from 'react';
import type { GameState, TileType, ActiveContract } from '../game/types';
import {
  emptyGrid,
  scoreGrid,
  calcReward,
  calcRepChange,
  getRevealedTiles,
  checkLoreUnlock,
  buildQueue,
  saveGame,
} from '../game/engine';
import { WORLD_REGIONS } from '../game/worldMap';
import MapGrid from '../components/MapGrid';
import TileSelector from '../components/TileSelector';
import CustomerPanel from '../components/CustomerPanel';
import ShopSidebar from '../components/ShopSidebar';
import NightSummary from '../components/NightSummary';
import UpgradeShop from '../components/UpgradeShop';

interface GameScreenProps {
  state: GameState;
  onStateChange: (state: GameState) => void;
}

export default function GameScreen({ state, onStateChange }: GameScreenProps) {
  const [playerGrid, setPlayerGrid] = useState<TileType[][]>(emptyGrid);
  const [selectedTile, setSelectedTile] = useState<TileType | null>(null);
  const [clueIndex, setClueIndex] = useState(0);
  const [allCluesSeen, setAllCluesSeen] = useState(false);
  const [lockedCells, setLockedCells] = useState<Array<{ x: number; y: number }>>([]);
  const [nightGoldTotal, setNightGoldTotal] = useState(0);
  const [nightRepTotal, setNightRepTotal] = useState(0);

  const hasExtraClue = state.upgrades.some(u => u.id === 'magnifying_glass' && u.purchased);

  const currentCustomer = state.customerQueue[state.currentCustomerIndex] ?? null;

  const totalClues = currentCustomer
    ? hasExtraClue
      ? currentCustomer.clues.length
      : Math.min(currentCustomer.clues.length, 4)
    : 4;

  // ---- Handle next clue ----
  const handleNextClue = useCallback(() => {
    const next = clueIndex + 1;
    setClueIndex(next);
    if (next >= totalClues - 1) {
      setAllCluesSeen(true);
    }
  }, [clueIndex, totalClues]);

  // ---- Begin mapping ----
  const handleBeginMapping = useCallback(() => {
    if (!currentCustomer) return;
    const newGrid = emptyGrid();
    const revealed = getRevealedTiles(currentCustomer.regionId, state.upgrades);
    const locked: Array<{ x: number; y: number }> = [];
    for (const cell of revealed) {
      newGrid[cell.y][cell.x] = cell.type;
      locked.push({ x: cell.x, y: cell.y });
    }
    setPlayerGrid(newGrid);
    setLockedCells(locked);
    onStateChange({
      ...state,
      phase: 'map_drawing',
      currentContract: {
        customer: currentCustomer,
        playerGrid: newGrid,
        accuracy: null,
        goldEarned: null,
        repChange: null,
      },
    });
  }, [currentCustomer, state, onStateChange]);

  // ---- Cell click ----
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (!selectedTile) return;
      setPlayerGrid(prev => {
        const next = prev.map(row => [...row]) as TileType[][];
        if (next[y]![x] === selectedTile) {
          next[y]![x] = 'empty';
        } else {
          next[y]![x] = selectedTile;
        }
        return next;
      });
    },
    [selectedTile]
  );

  // ---- Submit map ----
  const handleSubmit = useCallback(() => {
    if (!currentCustomer || !state.currentContract) return;
    const accuracy = scoreGrid(playerGrid, currentCustomer.regionId, state.upgrades);
    const goldEarned = calcReward(currentCustomer, accuracy, state.upgrades);
    const repChange = calcRepChange(accuracy, state.upgrades);

    const isLastCustomer =
      state.currentCustomerIndex >= state.customerQueue.length - 1;

    const newGoldTotal = nightGoldTotal + goldEarned;
    const newRepTotal = nightRepTotal + repChange;
    setNightGoldTotal(newGoldTotal);
    setNightRepTotal(newRepTotal);

    const newRep = Math.max(0, Math.min(100, state.reputation + repChange));
    const newGold = state.gold + goldEarned;
    const isComplete = accuracy >= 60;

    const updatedContract: ActiveContract = {
      ...state.currentContract,
      playerGrid,
      accuracy,
      goldEarned,
      repChange,
    };

    let nextPhase: GameState['phase'] = 'map_submitted';
    let nightResult = state.nightResult;

    if (isLastCustomer) {
      const lore = checkLoreUnlock(state.day, state.discoveredLore);
      nightResult = {
        day: state.day,
        customersServed: state.customerQueue.length,
        totalGold: newGoldTotal,
        totalRepChange: newRepTotal,
        loreUnlocked: lore,
      };
      nextPhase = 'map_submitted'; // show result first, then night summary on Next
    }

    const newState: GameState = {
      ...state,
      gold: newGold,
      reputation: newRep,
      completedContracts: isComplete
        ? state.completedContracts + 1
        : state.completedContracts,
      failedContracts: !isComplete
        ? state.failedContracts + 1
        : state.failedContracts,
      phase: newRep <= 0 ? 'game_over' : nextPhase,
      currentContract: updatedContract,
      nightResult,
    };

    saveGame(newState);
    onStateChange(newState);
  }, [
    currentCustomer,
    state,
    playerGrid,
    nightGoldTotal,
    nightRepTotal,
    onStateChange,
  ]);

  // ---- Next customer ----
  const handleNextCustomer = useCallback(() => {
    const isLastCustomer =
      state.currentCustomerIndex >= state.customerQueue.length - 1;

    if (isLastCustomer) {
      onStateChange({ ...state, phase: 'night_summary' });
      return;
    }

    const nextIndex = state.currentCustomerIndex + 1;
    const nextCustomer = state.customerQueue[nextIndex]!;
    const newGrid = emptyGrid();
    const revealed = getRevealedTiles(nextCustomer.regionId, state.upgrades);
    const locked: Array<{ x: number; y: number }> = [];
    for (const cell of revealed) {
      newGrid[cell.y][cell.x] = cell.type;
      locked.push({ x: cell.x, y: cell.y });
    }

    setPlayerGrid(newGrid);
    setLockedCells(locked);
    setClueIndex(0);
    setAllCluesSeen(false);
    setSelectedTile(null);

    const newState: GameState = {
      ...state,
      phase: 'night_open',
      currentCustomerIndex: nextIndex,
      currentContract: {
        customer: nextCustomer,
        playerGrid: newGrid,
        accuracy: null,
        goldEarned: null,
        repChange: null,
      },
    };
    saveGame(newState);
    onStateChange(newState);
  }, [state, onStateChange]);

  // ---- Night summary continue ----
  const handleNightContinue = useCallback(() => {
    onStateChange({ ...state, phase: 'upgrade_shop' });
  }, [state, onStateChange]);

  // ---- Buy upgrade ----
  const handleBuyUpgrade = useCallback(
    (upgradeId: string) => {
      const upgrade = state.upgrades.find(u => u.id === upgradeId);
      if (!upgrade || upgrade.purchased || state.gold < upgrade.cost) return;
      const newUpgrades = state.upgrades.map(u =>
        u.id === upgradeId ? { ...u, purchased: true } : u
      );
      const newState: GameState = {
        ...state,
        gold: state.gold - upgrade.cost,
        upgrades: newUpgrades,
      };
      saveGame(newState);
      onStateChange(newState);
    },
    [state, onStateChange]
  );

  // ---- Begin next night ----
  const handleNextNight = useCallback(() => {
    if (state.day >= 30) {
      onStateChange({ ...state, phase: 'game_over' });
      return;
    }
    const nextDay = state.day + 1;
    const queue = buildQueue(nextDay);
    const firstCustomer = queue[0]!;
    const newGrid = emptyGrid();
    const revealed = getRevealedTiles(firstCustomer.regionId, state.upgrades);
    const locked: Array<{ x: number; y: number }> = [];
    for (const cell of revealed) {
      newGrid[cell.y][cell.x] = cell.type;
      locked.push({ x: cell.x, y: cell.y });
    }

    setPlayerGrid(newGrid);
    setLockedCells(locked);
    setClueIndex(0);
    setAllCluesSeen(false);
    setSelectedTile(null);
    setNightGoldTotal(0);
    setNightRepTotal(0);

    const loreForDay = checkLoreUnlock(nextDay, state.discoveredLore);
    const newDiscoveredLore = loreForDay
      ? [...state.discoveredLore, loreForDay]
      : state.discoveredLore;

    const newState: GameState = {
      ...state,
      day: nextDay,
      phase: 'night_open',
      customerQueue: queue,
      currentCustomerIndex: 0,
      nightResult: null,
      discoveredLore: newDiscoveredLore,
      currentContract: {
        customer: firstCustomer,
        playerGrid: newGrid,
        accuracy: null,
        goldEarned: null,
        repChange: null,
      },
    };
    saveGame(newState);
    onStateChange(newState);
  }, [state, onStateChange]);

  // ---- Game over reset ----
  const handleGameOverRetry = useCallback(() => {
    onStateChange({ ...state, phase: 'title' });
  }, [state, onStateChange]);

  // ======== RENDER ========

  if (state.phase === 'upgrade_shop') {
    return (
      <UpgradeShop
        upgrades={state.upgrades}
        gold={state.gold}
        day={state.day + 1}
        onBuy={handleBuyUpgrade}
        onNextNight={handleNextNight}
      />
    );
  }

  if (state.phase === 'game_over') {
    const won = state.day >= 30;
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#1a0e05',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          className="card-shop-raised animate-slide-up"
          style={{
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '48px' }}>{won ? '🌟' : '🕯️'}</div>
          <h2
            style={{
              fontFamily: 'Spectral, serif',
              fontWeight: 700,
              fontSize: '1.6rem',
              color: '#d4a017',
              margin: 0,
            }}
          >
            {won ? 'The Maps Are Finished' : 'The Shop Falls Silent'}
          </h2>
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontStyle: 'italic',
              color: '#c4b49a',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {won
              ? 'Thirty nights of cartography complete. The world is charted. Something beneath it stirs in recognition.'
              : 'Your reputation has crumbled to nothing. The adventurers seek a more reliable cartographer. The shop goes dark.'}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              backgroundColor: '#1a0e05',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: '#a07810', fontFamily: 'Kalam, cursive' }}>Night reached</div>
              <div style={{ fontSize: '1.2rem', color: '#f5e6d0', fontFamily: 'Spectral, serif', fontWeight: 700 }}>{state.day}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#a07810', fontFamily: 'Kalam, cursive' }}>Maps drawn</div>
              <div style={{ fontSize: '1.2rem', color: '#f5e6d0', fontFamily: 'Spectral, serif', fontWeight: 700 }}>{state.completedContracts}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#a07810', fontFamily: 'Kalam, cursive' }}>Gold saved</div>
              <div style={{ fontSize: '1.2rem', color: '#d4a017', fontFamily: 'Spectral, serif', fontWeight: 700 }}>{state.gold}g</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#a07810', fontFamily: 'Kalam, cursive' }}>Lore found</div>
              <div style={{ fontSize: '1.2rem', color: '#f5e6d0', fontFamily: 'Spectral, serif', fontWeight: 700 }}>{state.discoveredLore.length}/8</div>
            </div>
          </div>
          <button
            className="btn-amber"
            style={{ fontSize: '1rem', padding: '0.7rem' }}
            onClick={handleGameOverRetry}
          >
            Return to Title
          </button>
        </div>
      </div>
    );
  }

  const trueGrid = currentCustomer
    ? WORLD_REGIONS.find(r => r.id === currentCustomer.regionId)?.trueTiles
    : undefined;

  const isSubmitted = state.phase === 'map_submitted';
  const isDrawing = state.phase === 'map_drawing';
  const isNightOpen = state.phase === 'night_open';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a0e05',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Main layout */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0,30%) minmax(0,45%) minmax(0,25%)',
          gridTemplateRows: '1fr',
          gap: '12px',
          padding: '12px',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
        }}
        className="desktop-layout"
      >
        {/* Left: Customer panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentCustomer && (isNightOpen || isDrawing || isSubmitted) && (
            <CustomerPanel
              customer={currentCustomer}
              clueIndex={clueIndex}
              hasExtraClue={hasExtraClue}
              onNextClue={handleNextClue}
              onBeginMapping={handleBeginMapping}
              allCluesSeen={allCluesSeen || isDrawing || isSubmitted}
            />
          )}
          {isSubmitted && state.currentContract && (
            <SubmitResultCard
              accuracy={state.currentContract.accuracy ?? 0}
              gold={state.currentContract.goldEarned ?? 0}
              rep={state.currentContract.repChange ?? 0}
              customerName={currentCustomer?.name ?? ''}
              departure={
                (state.currentContract.accuracy ?? 0) >= 60
                  ? (currentCustomer?.departurePositive ?? '')
                  : (currentCustomer?.departureNegative ?? '')
              }
              onNext={handleNextCustomer}
              isLastCustomer={
                state.currentCustomerIndex >= state.customerQueue.length - 1
              }
            />
          )}
        </div>

        {/* Centre: Map grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: '0.82rem',
              color: '#a07810',
              textAlign: 'center',
            }}
          >
            {currentCustomer
              ? WORLD_REGIONS.find(r => r.id === currentCustomer.regionId)?.name ?? ''
              : ''}
          </div>
          <MapGrid
            grid={playerGrid}
            selectedTile={isDrawing ? selectedTile : null}
            lockedCells={lockedCells}
            onCellClick={handleCellClick}
            showAccuracy={isSubmitted}
            trueGrid={isSubmitted ? trueGrid : undefined}
          />
          {isDrawing && (
            <>
              <TileSelector selected={selectedTile} onSelect={tile => setSelectedTile(prev => prev === tile ? null : tile)} />
              <button
                className="btn-amber"
                style={{ width: '100%', maxWidth: '448px', fontSize: '1rem', padding: '0.65rem' }}
                onClick={handleSubmit}
              >
                Submit Map ✓
              </button>
            </>
          )}
          {isNightOpen && (
            <div
              style={{
                fontFamily: 'Kalam, cursive',
                fontSize: '0.8rem',
                color: '#4a3020',
                textAlign: 'center',
              }}
            >
              Listen to the customer's clues, then begin mapping.
            </div>
          )}
        </div>

        {/* Right: Shop sidebar */}
        <ShopSidebar
          gold={state.gold}
          reputation={state.reputation}
          day={state.day}
          completedContracts={state.completedContracts}
          upgrades={state.upgrades}
          customersTonight={state.customerQueue.length}
          customersServedTonight={state.currentCustomerIndex + (isSubmitted ? 1 : 0)}
        />
      </div>

      {/* Mobile overrides via inline style block */}
      <style>{`
        @media (max-width: 700px) {
          .desktop-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
        }
      `}</style>

      {/* Night summary overlay */}
      {state.phase === 'night_summary' && state.nightResult && (
        <NightSummary
          result={state.nightResult}
          lore={state.nightResult.loreUnlocked}
          onContinue={handleNightContinue}
        />
      )}
    </div>
  );
}

// ---- Inline result card after submission ----
function SubmitResultCard({
  accuracy,
  gold,
  rep,
  customerName,
  departure,
  onNext,
  isLastCustomer,
}: {
  accuracy: number;
  gold: number;
  rep: number;
  customerName: string;
  departure: string;
  onNext: () => void;
  isLastCustomer: boolean;
}) {
  const repSign = rep >= 0 ? '+' : '';
  const repColor = rep >= 0 ? '#4caf50' : '#e53935';
  const grade =
    accuracy >= 80
      ? 'Excellent'
      : accuracy >= 60
      ? 'Acceptable'
      : accuracy >= 40
      ? 'Poor'
      : 'Terrible';

  return (
    <div className="card-shop animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          fontFamily: 'Spectral, serif',
          fontWeight: 700,
          fontSize: '1rem',
          color: accuracy >= 60 ? '#4caf50' : '#e53935',
        }}
      >
        {grade} Map — {accuracy}% Accuracy
      </div>
      <p
        style={{
          fontFamily: 'Spectral, serif',
          fontStyle: 'italic',
          fontSize: '0.82rem',
          color: '#c4b49a',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        "{departure}"
        <span style={{ color: '#a07810', fontStyle: 'normal' }}>
          {' '}— {customerName}
        </span>
      </p>
      <div style={{ display: 'flex', gap: '8px' }}>
        <span style={{ color: '#d4a017', fontFamily: 'Spectral, serif', fontSize: '0.9rem' }}>
          +{gold}g
        </span>
        <span style={{ color: repColor, fontFamily: 'Spectral, serif', fontSize: '0.9rem' }}>
          {repSign}{rep} rep
        </span>
      </div>
      <button
        className="btn-amber"
        onClick={onNext}
        style={{ fontSize: '0.9rem', padding: '0.5rem' }}
      >
        {isLastCustomer ? 'End Night 🌙' : 'Next Customer →'}
      </button>
    </div>
  );
}
