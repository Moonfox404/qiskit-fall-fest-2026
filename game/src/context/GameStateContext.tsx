import { createContext, useContext, useReducer } from 'react';
import type { ReactNode, Dispatch } from 'react';
import { GAME_CONSTANTS } from '../config/constants';
import levelsData from '../levels/levels.json';

// --- Types mapping to Backend Models ---
export interface Gate {
  name: string;
  qubits: number[];
}

export interface CircuitLayout {
  num_qubits: number;
  layout: Gate[];
}

// --- Game State Types ---
export interface GameState {
  money: number;
  time: number;
  levelIndex: number; // 0-indexed index into levelsData
  circuit: CircuitLayout;
  lastSimulation?: {
    counts: Record<string, number>;
    estimate: number;
  };
  gameOver: boolean;
  victory: boolean;
}

export type GameAction =
  | { type: 'ADD_GATE'; payload: { gate: Gate; cost: number; index?: number } }
  | { type: 'REMOVE_GATE'; payload: { index: number; refund: number } }
  | { type: 'RUN_SIMULATION'; payload: { cost: number; timeIncrement: number; result: { counts: Record<string, number>; estimate: number } } }
  | { type: 'ADD_FUNDING'; payload: { amount: number } }
  | { type: 'NEXT_LEVEL' }
  | { type: 'RESTART_GAME' };

export interface GameContextType {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

// --- Initial State ---
const initialState: GameState = {
  money: GAME_CONSTANTS.STARTING_MONEY,
  time: GAME_CONSTANTS.STARTING_TIME,
  levelIndex: 0,
  circuit: levelsData[0].circuit,
  gameOver: false,
  victory: false,
};

// --- Reducer Logic ---
function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.gameOver || state.victory) {
    if (action.type === 'RESTART_GAME') return { ...initialState };
    return state;
  }

  const currentLevel = levelsData[state.levelIndex];

  switch (action.type) {
    case 'ADD_GATE': {
      const newLayout = [...state.circuit.layout];
      if (action.payload.index !== undefined) {
        newLayout.splice(action.payload.index, 0, action.payload.gate);
      } else {
        newLayout.push(action.payload.gate);
      }
      
      const newMoney = state.money - action.payload.cost;
      return {
        ...state,
        money: newMoney,
        circuit: {
          ...state.circuit,
          layout: newLayout,
        },
        gameOver: newMoney < 0
      };
    }
    case 'REMOVE_GATE': {
      const newLayout = [...state.circuit.layout];
      newLayout.splice(action.payload.index, 1);
      return {
        ...state,
        money: state.money + action.payload.refund,
        circuit: {
          ...state.circuit,
          layout: newLayout
        }
      };
    }
    case 'RUN_SIMULATION': {
      const newMoney = state.money - action.payload.cost;
      const newTime = state.time + action.payload.timeIncrement;
      return {
        ...state,
        money: newMoney,
        time: newTime,
        lastSimulation: action.payload.result,
        gameOver: newMoney < 0 || (currentLevel.max_time !== undefined && newTime >= currentLevel.max_time)
      };
    }
    case 'ADD_FUNDING':
      return {
        ...state,
        money: state.money + action.payload.amount,
      };
    case 'NEXT_LEVEL': {
      const nextIndex = state.levelIndex + 1;
      if (nextIndex >= levelsData.length) {
        return { ...state, victory: true };
      }
      const newTime = state.time + GAME_CONSTANTS.TIME_PER_LEVEL_START;
      const nextLevel = levelsData[nextIndex];
      return {
        ...state,
        levelIndex: nextIndex,
        time: newTime,
        circuit: nextLevel.circuit,
        lastSimulation: undefined,
        gameOver: nextLevel.max_time !== undefined && newTime >= nextLevel.max_time
      };
    }
    case 'RESTART_GAME':
      return { ...initialState };
    default:
      return state;
  }
}

// --- Context & Provider ---
export const GameStateContext = createContext<GameContextType | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
};

// --- Custom Hook ---
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
