import { GameHUD } from './components/GameHUD';
import { ControlPanel } from './components/ControlPanel';
import { ResultsChart } from './components/ResultsChart';
import { GameStateProvider } from './context/GameStateContext';
import { CircuitWorkspace } from './components/CircuitEditor/CircuitWorkspace';

function App() {
  return (
    <GameStateProvider>
      <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
        <h1>Error Mitigation Game</h1>
        <GameHUD />
        
        <div style={{ marginTop: '20px' }}>
          <CircuitWorkspace />
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <ControlPanel />
          <ResultsChart />
        </div>
      </div>
    </GameStateProvider>
  );
}

export default App;
