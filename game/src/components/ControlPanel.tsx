import { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { runSimulation } from '../services/api';
import { ResultsModal } from './ResultsModal';
import { GAME_CONSTANTS } from '../config/constants';

export const ControlPanel = () => {
  const { state, dispatch } = useGameState();
  const [shots, setShots] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [isExpanded, setIsExpanded] = useState(true); //open or collapsed

  const runCost = Math.max(1, Math.ceil(shots / GAME_CONSTANTS.COST_PER_SHOT_UNIT));

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await runSimulation(state.circuit, shots, 1);
      dispatch({
        type: 'RUN_SIMULATION',
        payload: {
          cost: runCost,
          timeIncrement: GAME_CONSTANTS.TIME_PER_SIMULATION,
          result,
        },
      });
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert('Simulation failed. Make sure the backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={`bg-game-card/90 backdrop-blur-md border border-game-text/15 
        rounded-lg shadow-2xl transition-all duration-300
        ${isExpanded ? 'w-80 p-6' : 'w-auto p-4'}`}
      >
        {/* Clickable header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center justify-between w-full text-game-text
          ${isExpanded ? 'mb-4' : ''}`}
        >
          <h3 className="text-xl font-bold whitespace-nowrap">
            Execution Settings
          </h3>

          <span className="ml-4 text-game-text/60">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>

        {/* Only show settings when expanded */}
        {isExpanded && (
          <>
            <div className="mb-4">
              <label className="flex justify-between text-sm font-bold text-game-text/80 mb-2">
                <span>Shots</span>
                <span>{shots}</span>
              </label>

              <input
                type="range"
                min="100"
                max="8192"
                step="100"
                value={shots}
                onChange={(e) => setShots(Number(e.target.value))}
                className="w-full accent-game-accent cursor-pointer mb-3"
              />

              <input
                type="number"
                min="100"
                max="8192"
                value={shots}
                onChange={(e) => setShots(Number(e.target.value))}
                className="w-full bg-game-primary border border-game-text/15 text-game-text rounded p-2 text-center"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={loading || state.money < runCost}
              className={`w-full py-3 rounded-md font-bold text-white transition-colors ${
                state.money >= runCost
                  ? 'bg-game-accent hover:bg-game-accent/80'
                  : 'bg-game-primary text-game-text/40 cursor-not-allowed'
              }`}
            >
              {loading ? 'Simulating...' : `Run Circuit ($${runCost})`}
            </button>

            {state.money < runCost && (
              <div className="text-game-accent text-sm mt-2 text-center">
                Insufficient funding
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ResultsModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
};