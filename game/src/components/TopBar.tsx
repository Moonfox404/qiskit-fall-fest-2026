import { useState } from 'react';
import { createPortal } from 'react-dom';
import { History, RotateCcw } from 'lucide-react';
import { getCircuitCost, useGameState } from '../context/GameStateContext';
import { GAME_CONSTANTS } from '../config/constants';
import { getIdealExpectation } from '../services/api';
import { calculateExpectationAccuracy, calculateExpectationDistance, calculateFunding, calculateUncertainty } from '../scoring';
import { LevelClearedScreen, type LevelClearMetrics } from './LevelClearedScreen';
import { TrialHistoryModal } from './TrialHistoryModal';

export const TopBar = () => {
  const { state, dispatch, goToNextLevel } = useGameState();
  const [loading, setLoading] = useState(false);
  const [showTrialHistory, setShowTrialHistory] = useState(false);
  const [showSubmitScreen, setShowSubmitScreen] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [levelClearMetrics, setLevelClearMetrics] = useState<LevelClearMetrics | null>(null);
  const currentLevel = state.currentLevel;
  const playerAddedGates = state.circuit.layout.filter((gate) => !gate.isLevelGate);
  const removableTwirlCount = state.circuit.layout.filter((gate) => gate.twirl).length;
  const refundAllAmount = getCircuitCost(playerAddedGates)
    + removableTwirlCount * GAME_CONSTANTS.GATE_COSTS.P;
  const hasPlayerChanges = playerAddedGates.length > 0 || removableTwirlCount > 0;

  if (!currentLevel) {
    return (
      <div className="flex items-center p-4 bg-game-card border-b border-game-text/10">
        Loading level...
      </div>
    );
  }

  const handleSubmit = async (interpretedResults: number) => {
    if (!state.lastSimulation) {
      alert('Run a simulation first to get an estimate!');
      return;
    }
    setLoading(true);
    try {
      const idealExpectation = await getIdealExpectation(currentLevel.circuit);
      const uncertainty = calculateUncertainty(state.simulationHistory);
      const accuracy = calculateExpectationAccuracy(interpretedResults, idealExpectation);
      const distance = calculateExpectationDistance(interpretedResults, idealExpectation);
      const funding = Math.floor(calculateFunding(distance, uncertainty, currentLevel.max_reward));

      dispatch({ type: 'ADD_FUNDING', payload: { amount: funding } });
      setShowSubmitScreen(false);
      setLevelClearMetrics({
        estimate: interpretedResults,
        idealExpectation,
        accuracy,
        distance,
        uncertainty,
        funding,
        recommendedFunding: currentLevel.recommended_funding,
      });
    } catch (e) {
      console.error(e);
      alert('Evaluation failed. Backend error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundAll = () => {
    if (!hasPlayerChanges) return;
    dispatch({ type: 'REFUND_ALL_PLAYER_GATES' });
    setShowRefundModal(false);
  };

  return (
    <div className="flex justify-between items-center p-4 bg-game-card border-b border-game-text/10 shadow-md z-20 relative">
      <div className="flex gap-8">
        <div className="text-xl font-bold">Level {state.levelId}</div>
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
          onClick={() => setShowRefundModal(true)}
          disabled={!hasPlayerChanges}
          aria-label={`Refund all player-added circuit elements for $${refundAllAmount}`}
          title={`Remove all player-added gates and twirls and refund $${refundAllAmount}`}
          className="flex items-center gap-2 rounded-md border border-game-text/15 bg-game-primary px-3 py-2 font-semibold text-game-text transition-colors hover:bg-game-accent/20 disabled:cursor-not-allowed disabled:text-game-text/30"
        >
          <RotateCcw size={18} />
          <span>Refund all</span>
        </button>
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
          onClick={() => setShowSubmitScreen(true)}
          disabled={loading || !state.lastSimulation}
          className={`px-6 py-2 rounded-md font-bold text-game-text transition-colors ${state.lastSimulation ? 'bg-game-accent hover:bg-game-accent/80' : 'bg-game-primary text-game-text/40 cursor-not-allowed'}`}
        >
          {loading ? 'Evaluating...' : 'Submit Circuit'}
        </button>
      </div>
      {showTrialHistory && <TrialHistoryModal onClose={() => setShowTrialHistory(false)} />}
      {showSubmitScreen && (
        <TrialHistoryModal
          mode="submit"
          isSubmitting={loading}
          onSubmitResults={handleSubmit}
          onClose={() => setShowSubmitScreen(false)}
        />
      )}
      {showRefundModal && createPortal(
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/80 p-4 text-game-text"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowRefundModal(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-all-title"
            className="w-full max-w-md rounded-xl border border-game-text/20 bg-game-card p-6 shadow-2xl"
          >
            <h2 id="refund-all-title" className="text-xl font-bold">Refund all additions?</h2>
            <p className="mt-3 text-sm text-game-text/70">
              Remove all player-added gates and Pauli twirls. The level’s original gates will remain.
            </p>
            <p className="mt-4 rounded-md bg-game-primary p-3 font-semibold">
              Funding to refund: <span className="text-game-accent">${refundAllAmount}</span>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="rounded-md border border-game-text/20 px-4 py-2 font-semibold text-game-text transition-colors hover:bg-game-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefundAll}
                className="rounded-md bg-game-accent px-4 py-2 font-semibold text-game-primary transition-colors hover:bg-game-accent/80"
              >
                Refund all
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
      {levelClearMetrics && (
        <LevelClearedScreen
          levelNumber={state.levelId}
          metrics={levelClearMetrics}
          onRetry={() => {
            setLevelClearMetrics(null);
            dispatch({ type: 'RETRY_LEVEL' });
          }}
          onContinue={() => {
            setLevelClearMetrics(null);
            void goToNextLevel();
          }}
        />
      )}
    </div>
  );
};
