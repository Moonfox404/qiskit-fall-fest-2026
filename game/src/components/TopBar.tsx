import { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import levelsData from '../levels/levels.json';
import { submitEvaluation } from '../services/api';

export const TopBar = () => {
  const { state, dispatch } = useGameState();
  const [loading, setLoading] = useState(false);
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
    <div className="flex justify-between items-center p-4 bg-game-card border-b border-gray-800 shadow-md z-20 relative">
      <div className="flex gap-8">
        <div className="text-xl font-bold">Level {state.levelIndex + 1}</div>
        <div className="text-lg">
          <span className="text-gray-400">Time:</span> {state.time} {currentLevel.max_time ? `/ ${currentLevel.max_time}` : ''} hrs
        </div>
        <div className="text-lg text-green-400 font-bold">
          ${state.money}
        </div>
      </div>
      <div>
        <button 
          onClick={handleSubmit} 
          disabled={loading || !state.lastSimulation}
          className={`px-6 py-2 rounded-md font-bold text-white transition-colors ${state.lastSimulation ? 'bg-game-accent hover:bg-blue-600' : 'bg-gray-600 cursor-not-allowed'}`}
        >
          {loading ? 'Evaluating...' : 'Submit Circuit'}
        </button>
      </div>
    </div>
  );
};
