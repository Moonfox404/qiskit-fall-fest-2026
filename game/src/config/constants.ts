export const GAME_CONSTANTS = {
  STARTING_MONEY: 1000,
  STARTING_TIME: 0,
  TIME_PER_LEVEL_START: 1, // hours
  TIME_PER_SIMULATION: 1, // hours
  COST_PER_SHOT_UNIT: 100, // shots per $1
  GATE_COSTS: {
    X: 10,
    Y: 15,
    Z: 10,
    H: 50,
    CNOT: 100,
    P: 25,
  },
  GATE_QUBIT_COUNTS: {
    CNOT: 2,
  },
  GATE_STYLES: {
    X: 'bg-game-accent text-game-text',
    Y: 'bg-game-accent/80 text-game-text',
    Z: 'bg-game-accent/60 text-game-text',
    H: 'bg-game-text text-game-primary',
    CNOT: 'bg-game-accent/40 text-game-text',
    P: 'bg-emerald-500 text-game-primary',
  },
};

