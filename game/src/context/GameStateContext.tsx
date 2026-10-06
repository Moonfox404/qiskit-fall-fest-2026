import { createContext, useContext, useReducer } from 'react';
import type { ReactNode, Dispatch } from 'react';

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
  level: number;
  circuit: CircuitLayout;
  lastSimulation?: {
    counts: Record<string, number>;
    estimate: number;
  };
}

export type GameAction =
  | { type: 'ADD_GATE'; payload: { gate: Gate; cost: number; index?: number } }
  | { type: 'RUN_SIMULATION'; payload: { cost: number; timeIncrement: number; result: { counts: Record<string, number>; estimate: number } } }
  | { type: 'ADD_FUNDING'; payload: { amount: number } }
  | { type: 'NEXT_LEVEL'; payload: { initialCircuit: CircuitLayout } };

export interface GameContextType {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

// --- Initial State ---
const initialState: GameState = {
  money: 1000,
  time: 0,
  level: 1,
  circuit: {
    num_qubits: 3, // Default 3-qubit circuit
    layout: [],
  },
};

// --- Reducer Logic ---
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_GATE': {
      const newLayout = [...state.circuit.layout];
      if (action.payload.index !== undefined) {
        newLayout.splice(action.payload.index, 0, action.payload.gate);
      } else {
        newLayout.push(action.payload.gate);
      }
      return {
        ...state,
        money: state.money - action.payload.cost,
        circuit: {
          ...state.circuit,
          layout: newLayout,
        },
      };
    }
    case 'RUN_SIMULATION':
      return {
        ...state,
        money: state.money - action.payload.cost,
        time: state.time + action.payload.timeIncrement,
        lastSimulation: action.payload.result,
      };
    case 'ADD_FUNDING':
      return {
        ...state,
        money: state.money + action.payload.amount,
      };
    case 'NEXT_LEVEL':
      return {
        ...state,
        level: state.level + 1,
        time: state.time + 1, // Clock increments on new level
        circuit: action.payload.initialCircuit,
      };
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
