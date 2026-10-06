import { GameHUD } from './components/GameHUD';
import { GatePalette } from './components/CircuitEditor/GatePalette';
import { Wire } from './components/CircuitEditor/Wire';
import { ControlPanel } from './components/ControlPanel';
import { ResultsChart } from './components/ResultsChart';

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Error Mitigation Game</h1>
      <GameHUD />
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <GatePalette />
        <div style={{ flex: 1, border: '1px dashed #ccc', padding: '20px' }}>
          <h2>Circuit Editor</h2>
          <Wire />
        </div>
        <div>
          <ControlPanel />
          <ResultsChart />
        </div>
      </div>
    </div>
  );
}

export default App;
