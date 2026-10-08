import type { SimulationTrial } from './context/GameStateContext';

const ERROR_TOLERANCE = 0.2;
const UNCERTAINTY_WEIGHT = 100;

export const calculateExpectationDistance = (estimate: number, idealExpectation: number): number =>
  Math.abs(estimate - idealExpectation);

export const calculateExpectationAccuracy = (estimate: number, idealExpectation: number): number =>
  Math.max(0, 1 - calculateExpectationDistance(estimate, idealExpectation) / 2);

export const calculateUncertainty = (trials: readonly SimulationTrial[]): number => {
  if (trials.length === 0) return 0;

  const standardDeviations = trials.map((trial) => {
    const outcomes = Object.entries(trial.counts).map(([state, count]) => ({
      value: Math.pow(-1, state.replaceAll(' ', '').split('1').length - 1),
      count,
    }));
    const totalShots = outcomes.reduce((total, outcome) => total + outcome.count, 0);
    if (totalShots <= 1) return 0;

    const mean = outcomes.reduce((total, outcome) => total + outcome.value * outcome.count, 0) / totalShots;
    const variance = outcomes.reduce(
      (total, outcome) => total + outcome.count * (outcome.value - mean) ** 2,
      0,
    ) / (totalShots - 1);

    return Math.sqrt(variance);
  });

  return standardDeviations.reduce((total, standardDeviation) => total + standardDeviation, 0)
    / standardDeviations.length;
};

export const calculateFunding = (distance: number, uncertainty: number, maxReward: number): number =>
  Math.max(0, maxReward * Math.exp(-distance / ERROR_TOLERANCE) - UNCERTAINTY_WEIGHT * uncertainty);
