import { useEffect, useState } from 'react';
import { loadGame, createInitialState, clearSave } from './game/engine';
import { initMonetization } from './services/monetization';
import TitleScreen from './pages/TitleScreen';
import GameScreen from './pages/GameScreen';
import type { GameState } from './game/types';

export default function App() {
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    void initMonetization();
  }, []);

  const handleStart = (fresh: boolean) => {
    if (fresh) {
      clearSave();
      setState(createInitialState());
    } else {
      setState(loadGame() ?? createInitialState());
    }
  };

  if (!state || state.phase === 'title') {
    return <TitleScreen onStart={handleStart} hasSave={!!loadGame()} />;
  }

  return <GameScreen state={state} onStateChange={setState} />;
}
