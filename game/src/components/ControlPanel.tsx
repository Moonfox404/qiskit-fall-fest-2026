import { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import { runSimulation, submitEvaluation } from '../services/api';

export const ControlPanel = () => {
  const { state, dispatch } = useGameState();
  const [shots, setShots] = useState(1024);
  const [expectation, setExpectation] = useState<string>('');
  const [loadingSim, setLoadingSim] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);

  // Example cost formula: $1 for every 100 shots
  const runCost = Math.max(1, Math.ceil(shots / 100));

  const handleRun = async () => {
    setLoadingSim(true);
    try {
      // Mock noise level as 1. In a real game, this might scale with the level.
      const result = await runSimulation(state.circuit, shots, 1);
      dispatch({
        type: 'RUN_SIMULATION',
        payload: {
          cost: runCost,
          timeIncrement: 1, // Clock advances 1 hr per simulation
          result,
        },
      });
      // Pre-fill expectation with the estimate to help the player
      setExpectation(result.estimate.toString());
    } catch (e) {
      console.error(e);
      alert('Simulation failed. Make sure the backend is running on port 8000!');
    } finally {
      setLoadingSim(false);
    }
  };

  const handleSubmit = async () => {
    if (!expectation) {
      alert("Please enter your final expectation estimate before submitting.");
      return;
    }

    setLoadingEval(true);
    try {
      const expVal = parseFloat(expectation);
      const result = await submitEvaluation(state.circuit, expVal);
      
      // Compute funding reward. E.g., Max $500 if fidelity is 1.0
      const funding = Math.floor(result.fidelity * 500);
      
      alert(
        `Level ${state.level} Completed!\n\n` +
        `Fidelity: ${result.fidelity.toFixed(3)}\n` +
        `KL Divergence: ${result.kl_divergence.toFixed(3)}\n` +
        `TVD: ${result.total_variation_distance.toFixed(3)}\n\n` +
        `Funding Awarded: $${funding}`
      );

      dispatch({ type: 'ADD_FUNDING', payload: { amount: funding } });
      
      // Advance to next level, resetting the circuit
      dispatch({
        type: 'NEXT_LEVEL',
        payload: { initialCircuit: { num_qubits: state.circuit.num_qubits, layout: [] } },
      });
      
      setExpectation('');
    } catch (e) {
      console.error(e);
      alert('Evaluation failed. Make sure the backend is running!');
    } finally {
      setLoadingEval(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '5px', background: '#f9f9f9', width: '300px' }}>
      <h3 style={{ marginTop: 0 }}>Execution Controls</h3>
      
      {/* Simulation Controls */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold' }}>
          <span>Shots:</span>
          <span>{shots}</span>
        </label>
        <input 
          type="range" min="100" max="8192" step="100" 
          value={shots} onChange={(e) => setShots(Number(e.target.value))} 
          style={{ width: '100%', cursor: 'pointer' }}
        />
        
        <button 
          onClick={handleRun} 
          disabled={loadingSim || state.money < runCost}
          style={{
            width: '100%', padding: '10px', marginTop: '15px', 
            background: state.money >= runCost ? '#3b82f6' : '#9ca3af',
            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loadingSim ? 'Simulating...' : `Run Simulation ($${runCost})`}
        </button>
        {state.money < runCost && (
          <div style={{ fontSize: '0.8em', color: '#ef4444', marginTop: '5px', textAlign: 'center' }}>
            Not enough funding
          </div>
        )}
      </div>

      <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      {/* Evaluation Controls */}
      <div>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Final Expectation Estimate:</label>
        <input 
          type="number" step="0.01" 
          value={expectation} onChange={(e) => setExpectation(e.target.value)}
          placeholder="e.g. 0.45"
          style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        
        <button 
          onClick={handleSubmit} 
          disabled={loadingEval || !state.lastSimulation}
          style={{
            width: '100%', padding: '10px', 
            background: state.lastSimulation ? '#10b981' : '#9ca3af',
            color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loadingEval ? 'Evaluating...' : 'Submit & End Level'}
        </button>
        
        {!state.lastSimulation && (
          <div style={{ fontSize: '0.8em', color: '#6b7280', marginTop: '10px', textAlign: 'center' }}>
            Run at least one simulation first
          </div>
        )}
      </div>
    </div>
  );
};
