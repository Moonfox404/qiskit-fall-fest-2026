import { useGameState } from '../context/GameStateContext';

export const GameHUD = () => {
  const { state } = useGameState();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '5px' }}>
      <div><strong>Level:</strong> {state.level}</div>
      <div><strong>Time Elapsed:</strong> {state.time} hrs</div>
      <div><strong>Funding:</strong> ${state.money}</div>
    </div>
  );
};
