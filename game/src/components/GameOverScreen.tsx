import { useGameState } from '../context/GameStateContext';

export const GameOverScreen = () => {
  const { state, dispatch } = useGameState();

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-game-primary text-game-text p-8">
      <div className="bg-game-card border border-red-900/50 p-12 rounded-xl shadow-2xl max-w-xl w-full text-center">
        <h1 className="text-5xl font-bold text-red-500 mb-6">Game Over</h1>
        
        <p className="text-xl text-gray-300 mb-8">
          {state.money < 0 
            ? "You ran out of funding! Quantum error mitigation is expensive." 
            : "You ran out of time! The quantum decoherence was too fast."}
        </p>

        <div className="bg-gray-800 p-6 rounded-lg mb-8 text-left">
          <h3 className="font-bold text-gray-200 mb-2">Final Stats:</h3>
          <ul className="text-gray-400 space-y-2">
            <li>Levels Completed: {state.levelIndex}</li>
            <li>Remaining Funding: ${state.money}</li>
            <li>Time Elapsed: {state.time} hrs</li>
          </ul>
        </div>

        <button 
          onClick={() => dispatch({ type: 'RESTART_GAME' })}
          className="px-8 py-4 bg-game-accent hover:bg-blue-600 text-white font-bold rounded-lg text-lg transition-all transform hover:scale-105"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

