import { createContext, useContext, useEffect, useReducer } from 'react';
import type { ReactNode, Dispatch } from 'react';
import { GAME_CONSTANTS } from '../config/constants'; 
import { loadLevel } from '../levels/loadLevel';
import type { Gate, CircuitLayout, Level } from '../types/game';


export interface SimulationTrial {
  trialNumber: number;
  gateCount: number;
  counts: Record<string, number>;
  estimate: number;
}

// --- Game State Types ---
export interface GameState {
  money: number;
  time: number;
  levelId: number;
  currentLevel: Level | null;
  circuit: CircuitLayout;
  circuitBlockCount: number;
  simulationHistory: SimulationTrial[];
  lastSimulation?: {
    counts: Record<string, number>;
    expectation: number;
    state_vector: Array<{ real: number; imag: number }>;
  };
  gameOver: boolean;
  victory: boolean;
  loadingLevel: boolean;
} 

export type GameAction =
  | { type: 'ADD_GATE'; payload: { gate: Gate; cost: number; index?: number; column?: number } }
  | { type: 'TWIRL_GATE'; payload: { index: number; cost: number } }
  | { type: 'UNTWIRL_GATE'; payload: { index: number } }
  | { type: 'REMOVE_GATE'; payload: { index: number } }
  | { type: 'MOVE_GATE'; payload: { fromIndex: number; toIndex: number; fromQubitIndex: number; toQubitIndex: number; toColumnIndex: number } }
  | { type: 'FOLD_GATE'; payload: { index: number; inverseGates: Gate[] } }
  | { type: 'DUPLICATE_CIRCUIT'; payload?: { gates?: Gate[] } }
  | { type: 'REMOVE_CIRCUIT_BLOCK'; payload: { index: number } }| { type: 'RUN_SIMULATION'; payload: { cost: number; timeIncrement: number; result: { counts: Record<string, number>; expectation: number; state_vector: Array<{ real: number; imag: number }> } } }
  | { type: 'ADD_FUNDING'; payload: { amount: number } }
  | { type: 'RETRY_LEVEL' }
  | { type: 'LOAD_LEVEL'; payload: Level }
  | { type: 'SET_LEVEL_LOADING'; payload: boolean }
  | { type: 'VICTORY' }
  | { type: 'RESTART_GAME' };

export interface GameContextType {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  goToNextLevel: () => Promise<void>;
}

export const getCircuitCost = (layout: Gate[]) =>
  layout.reduce((totalCost, gate) => {
    const gateCost = GAME_CONSTANTS.GATE_COSTS[gate.name as keyof typeof GAME_CONSTANTS.GATE_COSTS] ?? 0;
    return totalCost + gateCost;
  }, 0);

export const getCircuitBlockLayout = (layout: Gate[], blockCount: number, blockIndex = 0) => {
  if (blockCount <= 0) return [];
  const gatesPerBlock = Math.floor(layout.length / Math.max(1, blockCount));
  const startIndex = blockIndex * gatesPerBlock;
  return layout.slice(startIndex, startIndex + gatesPerBlock);
};

export const getCircuitColumns = (layout: Gate[]) => {
  const columns: { gate: Gate; index: number }[][] = [];
  const nextAvailableColumn = new Map<number, number>();

  layout.forEach((gate, index) => {
    const earliestColumn = gate.qubits.length > 0
      ? gate.qubits.reduce(
          (earliestColumn, qubitIndex) => Math.max(earliestColumn, nextAvailableColumn.get(qubitIndex) ?? 0),
          0,
        )
      : columns.length;
    const requestedColumn = Number.isInteger(gate.column) ? Math.max(0, gate.column ?? 0) : 0;
    const columnIndex = Math.max(requestedColumn, earliestColumn);

    columns[columnIndex] ??= [];
    columns[columnIndex].push({ gate, index });
    gate.qubits.forEach((qubitIndex) => nextAvailableColumn.set(qubitIndex, columnIndex + 1));
  });

  for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
    columns[columnIndex] ??= [];
  }

  return columns;
};

export const getCircuitBoundaryColumns = (layout: Gate[]) => {
  const columns = getCircuitColumns(layout);
  const levelColumns = columns.flatMap((column, columnIndex) =>
    column.some(({ gate }) => gate.isBoundaryGate ?? gate.isLevelGate) ? [columnIndex] : [],
  );
  return {
    first: levelColumns[0],
    last: levelColumns.at(-1),
  };
};

const sortGatesByColumn = (layout: Gate[]) => layout
  .map((gate, index) => ({ gate, index }))
  .sort((left, right) =>
    (left.gate.column ?? 0) - (right.gate.column ?? 0) || left.index - right.index,
  )
  .map(({ gate }) => gate);

export const isGateInBoundaryColumn = (layout: Gate[], gateIndex: number) => {
  if (gateIndex < 0 || gateIndex >= layout.length) return false;
  if (layout[gateIndex].isBoundaryGate) return true;
  const columns = getCircuitColumns(layout);
  const gateColumn = columns.findIndex((column) => column.some(({ index }) => index === gateIndex));
  const boundaryColumns = getCircuitBoundaryColumns(layout);
  return gateColumn === boundaryColumns.first || gateColumn === boundaryColumns.last;
};

export const getCircuitColumnInsertionIndex = (layout: Gate[], columnIndex: number) => {
  const columns = getCircuitColumns(layout);
  const column = columns[columnIndex];
  if (column?.length) return Math.min(...column.map(({ index }) => index));

  const nextColumn = columns.slice(columnIndex + 1).find((candidateColumn) => candidateColumn.length > 0);
  return nextColumn ? Math.min(...nextColumn.map(({ index }) => index)) : layout.length;
};

const shiftCircuitColumnsForInsertion = (
  layout: Gate[],
  startColumn: number,
  qubits: number[],
) => {
  const columns = getCircuitColumns(layout);
  const boundaryColumns = getCircuitBoundaryColumns(layout);
  const columnByGateIndex = new Map<number, number>();
  columns.forEach((column, columnIndex) => {
    column.forEach(({ index }) => columnByGateIndex.set(index, columnIndex));
  });
  const shiftedGateIndexes = new Set<number>();
  const affectedQubits = new Set(qubits);
  const isBoundaryGate = (gate: Gate) => gate.isBoundaryGate ?? gate.isLevelGate ?? false;

  if (startColumn === boundaryColumns.last) {
    columns[startColumn]?.forEach(({ gate, index }) => {
      if (isBoundaryGate(gate)) shiftedGateIndexes.add(index);
    });
  }

  let expanded = true;
  while (expanded) {
    expanded = false;
    layout.forEach((gate, index) => {
      const column = columnByGateIndex.get(index) ?? startColumn;
      if (column < startColumn || shiftedGateIndexes.has(index)) return;
      if (!gate.qubits.some((qubitIndex) => affectedQubits.has(qubitIndex))) return;

      shiftedGateIndexes.add(index);
      gate.qubits.forEach((qubitIndex) => {
        if (!affectedQubits.has(qubitIndex)) {
          affectedQubits.add(qubitIndex);
          expanded = true;
        }
      });

      if (column === boundaryColumns.last && isBoundaryGate(gate)) {
        columns[column].forEach(({ gate: alignedGate, index: alignedIndex }) => {
          if (isBoundaryGate(alignedGate) && !shiftedGateIndexes.has(alignedIndex)) {
            shiftedGateIndexes.add(alignedIndex);
            expanded = true;
          }
        });
      }

      expanded = true;
    });
  }

  return layout.map((gate, index) => {
    const column = columnByGateIndex.get(index) ?? startColumn;
    return { ...gate, column: column + (shiftedGateIndexes.has(index) ? 1 : 0) };
  });
};

const createLevelCircuit = (circuit: CircuitLayout): CircuitLayout => {
  const starterLayout = circuit.layout.map((gate) => ({
    ...gate,
    qubits: [...gate.qubits],
    isLevelGate: true,
    twirl: false,
  }));

  const starterColumns = getCircuitColumns(starterLayout);
  const columnByGateIndex = new Map<number, number>();

  starterColumns.forEach((column, columnIndex) => {
    column.forEach(({ index }) =>
      columnByGateIndex.set(index, columnIndex)
    );
  });

  const firstStarterColumn = starterColumns.findIndex(
    (column) => column.length > 0
  );

  const lastStarterColumn = starterColumns.findLastIndex(
    (column) => column.length > 0
  );

  const boundaryGateIndexes = new Set([
    ...(starterColumns[firstStarterColumn] ?? []).map(({ index }) => index),
    ...(starterColumns[lastStarterColumn] ?? []).map(({ index }) => index),
  ]);

  return {
    ...circuit,
    layout: sortGatesByColumn(
      starterLayout.map((gate, index) => ({
        ...gate,
        column: columnByGateIndex.get(index) ?? 0,
        isBoundaryGate: boundaryGateIndexes.has(index),
      }))
    ),
  };
};

// --- Initial State ---
const initialState: GameState = {
  money: GAME_CONSTANTS.STARTING_MONEY,
  time: GAME_CONSTANTS.STARTING_TIME,
  levelId: 1,
  currentLevel: null,
  circuit: {
    num_qubits: 0,
    layout: [],
  },
  circuitBlockCount: 1,
  simulationHistory: [],
  gameOver: false,
  victory: false,
  loadingLevel: true,
};

// --- Reducer Logic ---
function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.gameOver || state.victory) {
    if (action.type === 'RESTART_GAME') return { ...initialState };
    return state;
  }

  switch (action.type) {
    case 'ADD_GATE': {
      const existingColumns = getCircuitColumns(state.circuit.layout);
      const insertionColumn = action.payload.column ?? action.payload.gate.column ?? existingColumns.length;
      const boundaryColumns = getCircuitBoundaryColumns(state.circuit.layout);
      if (
        boundaryColumns.first !== undefined &&
        boundaryColumns.last !== undefined &&
        (insertionColumn <= boundaryColumns.first || insertionColumn > boundaryColumns.last)
      ) return state;

      const insertionIndex = action.payload.index ?? getCircuitColumnInsertionIndex(state.circuit.layout, insertionColumn);
      const newLayout = shiftCircuitColumnsForInsertion(
        state.circuit.layout,
        insertionColumn,
        action.payload.gate.qubits,
      );
      const newGate = {
        ...action.payload.gate,
        isLevelGate: false,
        isBoundaryGate: false,
        twirl: action.payload.gate.twirl ?? false,
        column: insertionColumn,
      };
      newLayout.splice(insertionIndex, 0, newGate);
      const sortedLayout = sortGatesByColumn(newLayout);
      
      const newMoney = state.money - action.payload.cost;
      return {
        ...state,
        money: newMoney,
        circuit: {
          ...state.circuit,
          layout: sortedLayout,
        },
        circuitBlockCount: 1,
        gameOver: newMoney < 0
      };
    }
    case 'TWIRL_GATE': {
      if (action.payload.index < 0 || action.payload.index >= state.circuit.layout.length) return state;
      if (state.circuit.layout[action.payload.index].twirl || state.circuit.layout[action.payload.index].isBoundaryGate) return state;
      const columns = getCircuitColumns(state.circuit.layout);
      const boundaryColumns = getCircuitBoundaryColumns(state.circuit.layout);
      const gateColumn = columns.findIndex((column) => column.some(({ index }) => index === action.payload.index));
      if (gateColumn === boundaryColumns.first || gateColumn === boundaryColumns.last) return state;

      const newMoney = state.money - action.payload.cost;
      const newLayout = [...state.circuit.layout];
      newLayout[action.payload.index] = { ...newLayout[action.payload.index], twirl: true };
      return {
        ...state,
        money: newMoney,
        circuit: { ...state.circuit, layout: newLayout },
        circuitBlockCount: 1,
        lastSimulation: undefined,
        gameOver: newMoney < 0,
      };
    }
    case 'UNTWIRL_GATE': {
      if (action.payload.index < 0 || action.payload.index >= state.circuit.layout.length) return state;
      if (!state.circuit.layout[action.payload.index].twirl) return state;

      const newLayout = [...state.circuit.layout];
      newLayout[action.payload.index] = { ...newLayout[action.payload.index], twirl: false };
      return {
        ...state,
        money: state.money + GAME_CONSTANTS.GATE_COSTS.P,
        circuit: { ...state.circuit, layout: newLayout },
        circuitBlockCount: 1,
        lastSimulation: undefined,
      };
    }
    case 'REMOVE_GATE': {
      if (action.payload.index < 0 || action.payload.index >= state.circuit.layout.length) return state;
      if (isGateInBoundaryColumn(state.circuit.layout, action.payload.index)) return state;
      const newLayout = [...state.circuit.layout];
      const [removedGate] = newLayout.splice(action.payload.index, 1);
      if (removedGate.isLevelGate) return state;
      return {
        ...state,
        money: state.money + getCircuitCost([removedGate]),
        circuit: {
          ...state.circuit,
          layout: newLayout,
        },
        circuitBlockCount: 1,
        lastSimulation: undefined,
      };
    }
    case 'MOVE_GATE': {
      const { fromIndex, toIndex } = action.payload;
      if (
        fromIndex < 0 ||
        fromIndex >= state.circuit.layout.length ||
        toIndex < 0 ||
        toIndex > state.circuit.layout.length
      ) return state;
      if (state.circuit.layout[fromIndex].isLevelGate || isGateInBoundaryColumn(state.circuit.layout, fromIndex)) return state;

      const targetColumn = action.payload.toColumnIndex;
      const boundaryColumns = getCircuitBoundaryColumns(state.circuit.layout);
      if (
        boundaryColumns.first !== undefined &&
        boundaryColumns.last !== undefined &&
        (targetColumn <= boundaryColumns.first || targetColumn > boundaryColumns.last)
      ) return state;

      const movedGate = state.circuit.layout[fromIndex];
      const qubitOffset = action.payload.toQubitIndex - action.payload.fromQubitIndex;
      const movedQubits = movedGate.qubits.map((qubitIndex) => qubitIndex + qubitOffset);
      if (movedQubits.some((qubitIndex) => qubitIndex < 0 || qubitIndex >= state.circuit.num_qubits)) return state;

      const sourceColumn = getCircuitColumns(state.circuit.layout).findIndex((column) =>
        column.some(({ index }) => index === fromIndex),
      );
      if (sourceColumn === targetColumn && qubitOffset === 0) return state;

      const originalInsertionIndex = getCircuitColumnInsertionIndex(state.circuit.layout, targetColumn);
      const insertionIndex = originalInsertionIndex > fromIndex ? originalInsertionIndex - 1 : originalInsertionIndex;
      const layoutWithoutMovedGate = state.circuit.layout.filter((_, index) => index !== fromIndex);
      const newLayout = shiftCircuitColumnsForInsertion(
        layoutWithoutMovedGate,
        targetColumn,
        movedQubits,
      );
      newLayout.splice(insertionIndex, 0, {
        ...movedGate,
        qubits: movedQubits,
        column: targetColumn,
      });
      const sortedLayout = sortGatesByColumn(newLayout);

      return {
        ...state,
        circuit: {
          ...state.circuit,
          layout: sortedLayout,
        },
        circuitBlockCount: 1,
        lastSimulation: undefined,
      };
    }
    case 'FOLD_GATE': {
      if (action.payload.index < 0 || action.payload.index >= state.circuit.layout.length) return state;

      const originalGate = state.circuit.layout[action.payload.index];
      if (action.payload.inverseGates.length === 0) return state;

      const columns = getCircuitColumns(state.circuit.layout);
      const selectedColumn = columns.findIndex((column) =>
        column.some(({ index }) => index === action.payload.index),
      );
      const boundaryColumns = getCircuitBoundaryColumns(state.circuit.layout);
      const insertBeforeGate = selectedColumn === boundaryColumns.last;
      const firstInsertedColumn = insertBeforeGate ? selectedColumn : selectedColumn + 1;
      const addedGates = [
        ...action.payload.inverseGates,
        { ...originalGate, isLevelGate: false, isBoundaryGate: false },
      ].map((gate) => ({
        ...gate,
        qubits: [...gate.qubits],
        isLevelGate: false,
        isBoundaryGate: false,
      }));
      const foldCost = getCircuitCost(addedGates);
      const newMoney = state.money - foldCost;
      if (newMoney < 0) return state;

      let newLayout = state.circuit.layout;
      for (let offset = 0; offset < addedGates.length; offset += 1) {
        newLayout = shiftCircuitColumnsForInsertion(
          newLayout,
          firstInsertedColumn + offset,
          originalGate.qubits,
        );
      }

      const newGates = addedGates.map((gate, offset) => ({
        ...gate,
        column: firstInsertedColumn + offset,
      }));
      const insertionIndex = getCircuitColumnInsertionIndex(newLayout, firstInsertedColumn);
      newLayout.splice(insertionIndex, 0, ...newGates);

      return {
        ...state,
        money: newMoney,
        circuit: {
          ...state.circuit,
          layout: sortGatesByColumn(newLayout),
        },
        circuitBlockCount: 1,
        lastSimulation: undefined,
        gameOver: false,
      };
    }
    case 'DUPLICATE_CIRCUIT': {
      const blockCount = Math.max(0, state.circuitBlockCount ?? 1);
      if (blockCount === 0) return state;
      const circuitBlock = action.payload?.gates ?? getCircuitBlockLayout(state.circuit.layout, blockCount);
      if (circuitBlock.length === 0) return state;

      const sourceColumnByIndex = new Map<number, number>();
      const sourceColumns = getCircuitColumns(circuitBlock);
      const firstSourceColumn = sourceColumns.findIndex((column) => column.length > 0);
      sourceColumns.forEach((column, columnIndex) => {
        column.forEach(({ index }) => sourceColumnByIndex.set(index, columnIndex - firstSourceColumn));
      });
      const columnOffset = getCircuitColumns(state.circuit.layout).length;
      const duplicateLayout = circuitBlock.map((gate, index) => ({
        ...gate,
        qubits: [...gate.qubits],
        isLevelGate: false,
        isBoundaryGate: false,
        column: columnOffset + (sourceColumnByIndex.get(index) ?? 0),
      }));
      const newMoney = state.money - getCircuitCost(duplicateLayout);

      return {
        ...state,
        money: newMoney,
        circuit: {
          ...state.circuit,
          layout: [...state.circuit.layout, ...duplicateLayout],
        },
        circuitBlockCount: blockCount + 1,
        lastSimulation: undefined,
        gameOver: newMoney < 0,
      };
    }
    case 'REMOVE_CIRCUIT_BLOCK': {
      const blockCount = Math.max(0, state.circuitBlockCount ?? 1);
      const circuitBlock = getCircuitBlockLayout(state.circuit.layout, blockCount);
      if (action.payload.index <= 0 || action.payload.index >= blockCount || circuitBlock.length === 0) return state;

      const newLayout = [...state.circuit.layout];
      const removedGates = newLayout.splice(action.payload.index * circuitBlock.length, circuitBlock.length);

      return {
        ...state,
        money: state.money + getCircuitCost(removedGates),
        circuit: {
          ...state.circuit,
          layout: newLayout,
        },
        circuitBlockCount: blockCount - 1,
        lastSimulation: undefined,
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
        simulationHistory: [
          ...state.simulationHistory,
          {
            trialNumber: state.simulationHistory.length + 1,
            gateCount: state.circuit.layout.length,
            counts: { ...action.payload.result.counts },
            estimate: action.payload.result.expectation,
          },
        ],
        gameOver:
          newMoney < 0 ||
          (
            state.currentLevel?.max_time !== undefined &&
            newTime >= state.currentLevel.max_time
          )      
        };
    }
    case 'ADD_FUNDING':
      return {
        ...state,
        money: state.money + action.payload.amount,
      };
    case 'RETRY_LEVEL':
      if (!state.currentLevel) return state;
      return {
        ...state,
        circuit: createLevelCircuit(state.currentLevel.circuit),
        circuitBlockCount: 1,
        simulationHistory: [],
        lastSimulation: undefined,
      };
    case 'SET_LEVEL_LOADING':
      return {
        ...state,
        loadingLevel: action.payload,
      };

    case 'LOAD_LEVEL':
      return {
        ...state,
        levelId: action.payload.id,
        currentLevel: action.payload,
        circuit: createLevelCircuit(action.payload.circuit),
        circuitBlockCount: 1,
        simulationHistory: [],
        lastSimulation: undefined,
        loadingLevel: false,
      };

    case 'VICTORY':
      return {
        ...state,
        victory: true,
        loadingLevel: false,
      };
    case 'RESTART_GAME':
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

// --- Context & Provider ---
export const GameStateContext = createContext<GameContextType | undefined>(undefined);

export const GameStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Load the current level when the game starts or restarts.
  useEffect(() => {
    if (state.currentLevel || state.victory || state.gameOver) return;

    const loadInitialLevel = async () => {
      dispatch({ type: 'SET_LEVEL_LOADING', payload: true });
      try {
        const level = await loadLevel(state.levelId);

        if (!level) {
          console.error(`Level ${state.levelId} could not be loaded.`);
          dispatch({ type: 'SET_LEVEL_LOADING', payload: false });
          return;
        }

        dispatch({ type: 'LOAD_LEVEL', payload: level });
      } catch (error) {
        console.error(`Level ${state.levelId} could not be loaded.`, error);
        dispatch({ type: 'SET_LEVEL_LOADING', payload: false });
      }
    };

    void loadInitialLevel();
  }, [state.currentLevel, state.gameOver, state.levelId, state.victory]);

  // Load the next level when the player completes the current level
  const goToNextLevel = async () => {
    dispatch({
      type: 'SET_LEVEL_LOADING',
      payload: true,
    });

    const nextLevel = await loadLevel(state.levelId + 1);

    // No next level = player completed all available levels
    if (!nextLevel) {
      dispatch({ type: 'VICTORY' });
      return;
    }

    dispatch({
      type: 'LOAD_LEVEL',
      payload: nextLevel,
    });
  };

  return (
    <GameStateContext.Provider
      value={{
        state,
        dispatch,
        goToNextLevel,
      }}
    >
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
