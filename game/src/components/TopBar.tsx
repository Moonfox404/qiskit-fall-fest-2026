import { useState } from 'react';
import { History } from 'lucide-react';
import { useGameState } from '../context/GameStateContext';
import levelsData from '../levels/levels.json';
import { submitEvaluation } from '../services/api';
import { TrialHistoryModal } from './TrialHistoryModal';

export const TopBar = () => {
  const { state, dispatch } = useGameState();
  const [loading, setLoading] = useState(false);
  const [showTrialHistory, setShowTrialHistory] = useState(false);
  const currentLevel = levelsData[state.levelIndex];

  const handleSubmit = async () => {
    if (!state.lastSimulation) {
      alert("Run a simulation first to get an estimate!");
      return;
    }
    setLoading(true);
    try {
      const result = await submitEvaluation(state.circuit, state.lastSimulation.estimate);
      
      if (result.fidelity >= 0.8) {
        const funding = Math.floor(result.fidelity * currentLevel.max_reward);
        alert(
          `Success! Level ${state.levelIndex + 1} Cleared!\n\n` +
          `Fidelity: ${result.fidelity.toFixed(3)}\n` +
          `KL Divergence: ${result.kl_divergence.toFixed(3)}\n\n` +
          `Funding Awarded: $${funding}`
        );
        dispatch({ type: 'ADD_FUNDING', payload: { amount: funding } });
        dispatch({ type: 'NEXT_LEVEL' });
      } else {
        alert(
          `Level Failed!\n\n` +
          `Fidelity: ${result.fidelity.toFixed(3)} (Needs >= 0.8)\n` +
          `Keep trying! Adjust your mitigation strategy.`
        );
      }
    } catch (e) {
      console.error(e);
      alert('Evaluation failed. Backend error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center p-4 bg-game-card border-b border-game-text/10 shadow-md z-20 relative">
      <div className="flex gap-8">
        <div className="text-xl font-bold">Level {state.levelIndex + 1}</div>
        <div className="text-lg">
          <span className="text-game-text/60">Time:</span> {state.time} {currentLevel.max_time ? `/ ${currentLevel.max_time}` : ''} hrs
        </div>
        <div className="text-lg text-game-accent font-bold">
          ${state.money}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTrialHistory(true)}
          aria-label="View previous simulation trials"
          title="View previous simulation trials"
          className="flex items-center gap-2 rounded-md border border-game-text/15 bg-game-primary px-3 py-2 font-semibold text-game-text transition-colors hover:bg-game-accent/20"
        >
          <History size={18} />
          <span>Trials ({state.simulationHistory.length})</span>
        </button>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !state.lastSimulation}
          className={`px-6 py-2 rounded-md font-bold text-game-text transition-colors ${state.lastSimulation ? 'bg-game-accent hover:bg-game-accent/80' : 'bg-game-primary text-game-text/40 cursor-not-allowed'}`}
        >
          {loading ? 'Evaluating...' : 'Submit Circuit'}
        </button>
      </div>
      {showTrialHistory && <TrialHistoryModal onClose={() => setShowTrialHistory(false)} />}
    </div>
  );
};
