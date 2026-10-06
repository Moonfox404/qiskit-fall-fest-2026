
import { useGameState } from '../context/GameStateContext';

export const ResultsChart = () => {
  const { state } = useGameState();

  if (!state.lastSimulation) {
    return (
      <div style={{ flex: 1, padding: '40px', border: '1px dashed #ccc', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', background: '#fafafa' }}>
        Configure your circuit and run a simulation to view measurement results.
      </div>
    );
  }

  const { counts, estimate } = state.lastSimulation;
  
  // Find max count to scale the bar chart properly
  const maxCount = Math.max(...Object.values(counts), 1); // fallback to 1 to avoid div by zero

  return (
    <div style={{ flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '5px', background: '#fff' }}>
      <h3 style={{ marginTop: 0 }}>Simulation Results</h3>
      
      <div style={{ padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '20px' }}>
        <strong>Current Estimate:</strong> {estimate.toFixed(5)}
      </div>
      
      <div>
        <h4 style={{ marginBottom: '10px' }}>Measurement Counts</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(counts).map(([stateKey, count]) => (
            <div key={stateKey} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              <div style={{ width: '40px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                |{stateKey}⟩
              </div>
              
              <div style={{ flex: 1, background: '#f1f5f9', height: '24px', borderRadius: '3px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${(count / maxCount) * 100}%`, 
                    background: '#60a5fa', 
                    height: '100%',
                    transition: 'width 0.3s ease-out'
                  }} 
                />
              </div>
              
              <div style={{ width: '50px', textAlign: 'right', fontSize: '0.9em', color: '#475569' }}>
                {count}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
