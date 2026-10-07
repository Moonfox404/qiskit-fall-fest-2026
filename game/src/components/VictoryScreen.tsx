import { useGameState } from '../context/GameStateContext';

export const VictoryScreen = () => {
  const { state, dispatch } = useGameState();

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-game-primary text-game-text p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-game-accent rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-game-text rounded-full blur-[120px] opacity-10"></div>

      <div className="bg-game-card/80 backdrop-blur-xl border border-game-accent/30 p-12 rounded-xl shadow-2xl max-w-2xl w-full text-center z-10">
        <h1 className="text-6xl font-bold text-game-accent mb-6">
          Victory!
        </h1>
        
        <p className="text-2xl text-game-text mb-8 font-light">
          You have successfully mitigated the quantum noise and optimized all circuits.
        </p>

        <div className="bg-game-primary/60 p-8 rounded-lg mb-8 text-left border border-game-text/15">
          <h3 className="font-bold text-game-text mb-4 text-xl border-b border-game-text/15 pb-2">Final Mission Report</h3>
          <ul className="text-game-text/80 space-y-3 text-lg">
            <li className="flex justify-between">
              <span>Remaining Funding:</span> 
              <span className="text-game-accent font-bold">${state.money}</span>
            </li>
            <li className="flex justify-between">
              <span>Time Elapsed:</span> 
              <span className="font-mono">{state.time} hrs</span>
            </li>
            <li className="flex justify-between">
              <span>Levels Cleared:</span> 
              <span>{state.levelIndex}</span>
            </li>
          </ul>
        </div>

        <button 
          onClick={() => dispatch({ type: 'RESTART_GAME' })}
          className="px-10 py-4 bg-game-accent hover:bg-game-accent/80 text-game-text font-bold rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

