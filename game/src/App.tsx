import { GameStateProvider } from './context/GameStateContext';
import { MainLayout } from './components/MainLayout';

function App() {
  return (
    <GameStateProvider>
      <MainLayout />
    </GameStateProvider>
  );
}

export default App;
