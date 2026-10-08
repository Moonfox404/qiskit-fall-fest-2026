import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useGameState, type SimulationTrial } from '../context/GameStateContext';

type FitType = 'none' | 'polynomial' | 'exponential';

const solveLinearSystem = (matrix: number[][], values: number[]) => {
  const augmented = matrix.map((row, index) => [...row, values[index]]);
  for (let pivotIndex = 0; pivotIndex < augmented.length; pivotIndex += 1) {
    let bestPivotIndex = pivotIndex;
    for (let rowIndex = pivotIndex + 1; rowIndex < augmented.length; rowIndex += 1) {
      if (Math.abs(augmented[rowIndex][pivotIndex]) > Math.abs(augmented[bestPivotIndex][pivotIndex])) {
        bestPivotIndex = rowIndex;
      }
    }
    [augmented[pivotIndex], augmented[bestPivotIndex]] = [augmented[bestPivotIndex], augmented[pivotIndex]];
    const pivot = augmented[pivotIndex][pivotIndex];
    if (Math.abs(pivot) < 1e-12) return null;
    for (let columnIndex = pivotIndex; columnIndex <= augmented.length; columnIndex += 1) {
      augmented[pivotIndex][columnIndex] /= pivot;
    }
    for (let rowIndex = 0; rowIndex < augmented.length; rowIndex += 1) {
      if (rowIndex === pivotIndex) continue;
      const factor = augmented[rowIndex][pivotIndex];
      for (let columnIndex = pivotIndex; columnIndex <= augmented.length; columnIndex += 1) {
        augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex];
      }
    }
  }
  return augmented.map((row) => row[augmented.length]);
};

const formatNumber = (value: number) => Number(value.toPrecision(4)).toString();

const calculateFit = (trials: SimulationTrial[], fitType: FitType) => {
  if (fitType === 'none' || trials.length < 2) return null;
  const sortedTrials = [...trials].sort((left, right) => left.gateCount - right.gateCount);
  const minGateCount = sortedTrials[0].gateCount;
  const maxGateCount = sortedTrials[sortedTrials.length - 1].gateCount;
  const distinctGateCounts = new Set(sortedTrials.map((trial) => trial.gateCount)).size;
  if (distinctGateCounts < 2) return null;
  const xCenter = (minGateCount + maxGateCount) / 2;
  const xScale = Math.max(1, (maxGateCount - minGateCount) / 2);
  const normalizedX = sortedTrials.map((trial) => (trial.gateCount - xCenter) / xScale);
  let evaluate: (gateCount: number) => number;
  let equation: string;

  if (fitType === 'exponential') {
    const estimates = sortedTrials.map((trial) => trial.estimate);
    const minEstimate = Math.min(...estimates);
    const maxEstimate = Math.max(...estimates);
    const estimateScale = Math.max(maxEstimate - minEstimate, Math.abs(minEstimate) * 0.1, 1e-6);
    const minDistance = Math.max(estimateScale * 1e-7, Number.EPSILON * Math.max(1, Math.abs(minEstimate)));
    const maxDistance = estimateScale * 1e5;
    let bestFit: { amplitude: number; slope: number; offset: number; error: number } | null = null;

    const tryOffset = (offset: number) => {
      const shiftedEstimates = estimates.map((estimate) => estimate - offset);
      if (shiftedEstimates.some((estimate) => estimate <= 0)) return;

      const logEstimates = shiftedEstimates.map((estimate) => Math.log(estimate));
      const meanX = normalizedX.reduce((sum, value) => sum + value, 0) / sortedTrials.length;
      const meanLogEstimate = logEstimates.reduce((sum, value) => sum + value, 0) / sortedTrials.length;
      const variance = normalizedX.reduce((sum, value) => sum + (value - meanX) ** 2, 0);
      if (variance === 0) return;
      const slope = normalizedX.reduce(
        (sum, value, index) => sum + (value - meanX) * (logEstimates[index] - meanLogEstimate),
        0,
      ) / variance;
      const amplitude = Math.exp(meanLogEstimate - slope * meanX);
      if (!Number.isFinite(amplitude) || !Number.isFinite(slope)) return;
      const error = normalizedX.reduce((sum, value, index) => {
        const residual = amplitude * Math.exp(slope * value) + offset - estimates[index];
        return sum + residual * residual;
      }, 0);
      if (Number.isFinite(error) && (!bestFit || error < bestFit.error)) {
        bestFit = { amplitude, slope, offset, error };
      }
    };

    if (minEstimate > 0) tryOffset(0);
    for (let step = 0; step <= 256; step += 1) {
      const fraction = step / 256;
      const distance = minDistance * (maxDistance / minDistance) ** fraction;
      tryOffset(minEstimate - distance);
    }

    if (!bestFit) return null;
    const { amplitude, slope, offset } = bestFit;
    evaluate = (gateCount) => amplitude * Math.exp(slope * ((gateCount - xCenter) / xScale)) + offset;
    const offsetTerm = offset < 0
      ? ` - ${formatNumber(Math.abs(offset))}`
      : offset > 0 ? ` + ${formatNumber(offset)}` : '';
    equation = `y = ${formatNumber(amplitude)}e^(${formatNumber(slope)}u)${offsetTerm}, u = (g - ${formatNumber(xCenter)}) / ${formatNumber(xScale)}`;
  } else {
    const degree = Math.min(2, distinctGateCounts - 1);
    const basis = normalizedX.map((value) => Array.from({ length: degree + 1 }, (_, power) => value ** power));
    const matrix = Array.from({ length: degree + 1 }, (_, row) =>
      Array.from({ length: degree + 1 }, (_, column) => basis.reduce((sum, powers) => sum + powers[row] * powers[column], 0)),
    );
    const values = Array.from({ length: degree + 1 }, (_, power) =>
      basis.reduce((sum, powers, index) => sum + powers[power] * sortedTrials[index].estimate, 0),
    );
    const coefficients = solveLinearSystem(matrix, values);
    if (!coefficients) return null;
    evaluate = (gateCount) => {
      const normalizedGateCount = (gateCount - xCenter) / xScale;
      return coefficients.reduce((sum, coefficient, power) => sum + coefficient * normalizedGateCount ** power, 0);
    };
    equation = `y = ${formatNumber(coefficients[0])}`;
    for (let power = 1; power < coefficients.length; power += 1) {
      const coefficient = coefficients[power];
      equation += `${coefficient < 0 ? ' - ' : ' + '}${formatNumber(Math.abs(coefficient))}u${power > 1 ? `^${power}` : ''}`;
    }
    equation += `, u = (g - ${formatNumber(xCenter)}) / ${formatNumber(xScale)}`;
  }

  const forecastEnd = maxGateCount + Math.max(10, Math.ceil((maxGateCount - minGateCount + 1) / 2));
  const steps = Math.max(100, Math.ceil((forecastEnd - minGateCount) * 8));
  return {
    equation,
    minGateCount,
    forecastEnd,
    points: Array.from({ length: steps + 1 }, (_, index) => {
      const gateCount = minGateCount + (forecastEnd - minGateCount) * index / steps;
      return { gateCount, fitEstimate: evaluate(gateCount) };
    }),
  };
};

export const TrialHistoryModal = ({
  onClose,
  mode = 'history',
  isSubmitting = false,
  onSubmitResults,
}: {
  onClose: () => void;
  mode?: 'history' | 'submit';
  isSubmitting?: boolean;
  onSubmitResults?: (results: number) => void | Promise<void>;
}) => {
  const { state } = useGameState();
  const [resultsInput, setResultsInput] = useState(() => {
    const estimates = state.simulationHistory.map((trial) => trial.estimate);
    const averageEstimate = estimates.length > 0
      ? estimates.reduce((sum, estimate) => sum + estimate, 0) / estimates.length
      : 0;
    return String(averageEstimate);
  });
  const [selectedTrialNumber, setSelectedTrialNumber] = useState(state.simulationHistory.at(-1)?.trialNumber ?? null);
  const [fitType, setFitType] = useState<FitType>('none');
  const selectedTrialIndex = state.simulationHistory.findIndex((trial) => trial.trialNumber === selectedTrialNumber);
  const selectedTrial = state.simulationHistory.find((trial) => trial.trialNumber === selectedTrialNumber);
  const fitData = useMemo(() => calculateFit(state.simulationHistory, fitType), [fitType, state.simulationHistory]);
  const chartData = fitData?.points ?? state.simulationHistory;
  const isSubmitMode = mode === 'submit';

  return createPortal(
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-history-title"
        className="flex h-[min(90vh,56rem)] w-full max-w-6xl flex-col border border-game-text/15 bg-game-card p-5 text-game-text shadow-2xl sm:p-7"
      >
        <header className="mb-5 flex items-center justify-between border-b border-game-text/15 pb-4">
          <div>
            <h2 id="trial-history-title" className="text-xl font-bold">{isSubmitMode ? 'Submit circuit results' : 'Simulation trials'}</h2>
            <p className="mt-1 text-sm text-game-text/60">{state.simulationHistory.length} runs recorded</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close trial history"
            className="rounded p-2 text-game-text/70 transition-colors hover:bg-game-primary hover:text-game-text"
          >
            <X size={20} />
          </button>
        </header>

        {state.simulationHistory.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-game-text/60">Run the circuit to record its first trial.</div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 md:grid-cols-[minmax(15rem,0.9fr)_minmax(0,2fr)]">
            <section className="flex min-h-[16rem] min-w-0 flex-col border-b border-game-text/15 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">Global estimate by gate count</h3>
                <label className="flex items-center gap-2 text-sm text-game-text/70">
                  <span>Fit</span>
                  <select
                    value={fitType}
                    onChange={(event) => setFitType(event.target.value as FitType)}
                    aria-label="Estimate fit"
                    className="max-w-44 border border-game-text/20 bg-game-primary px-2 py-1 text-game-text"
                  >
                    <option value="none">None</option>
                    <option value="polynomial">Polynomial</option>
                    <option value="exponential">Non-polynomial (exponential)</option>
                  </select>
                </label>
              </div>
              {fitData && (
                <p className="mb-2 break-words font-mono text-xs text-game-text/70" aria-label="Fit equation">
                  {fitData.equation}
                </p>
              )}
              <div className="min-h-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 12, right: 12, bottom: 28, left: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--game-text)" strokeOpacity={0.12} />
                    <XAxis
                      type="number"
                      dataKey="gateCount"
                      name="Gate count"
                      allowDecimals={false}
                      domain={fitData ? [fitData.minGateCount, fitData.forecastEnd] : ['dataMin', 'dataMax']}
                      stroke="var(--game-text)"
                      strokeOpacity={0.6}
                      label={{ value: 'Number of gates', position: 'insideBottom', offset: -18, fill: 'var(--game-text)' }}
                    />
                    <YAxis
                      type="number"
                      dataKey="estimate"
                      name="Global estimate"
                      stroke="var(--game-text)"
                      strokeOpacity={0.6}
                      width={52}
                      label={{ value: 'Global estimate', angle: -90, position: 'insideLeft', fill: 'var(--game-text)' }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        const point = payload?.[0]?.payload;
                        const estimate = point?.estimate ?? point?.fitEstimate;
                        return active && point && estimate !== undefined ? (
                          <div className="border border-game-text/15 bg-game-primary p-3 text-sm shadow-lg">
                            <div>Gate count: {point.gateCount}</div>
                            <div className="text-game-accent">Estimate: {estimate.toFixed(5)}</div>
                          </div>
                        ) : null;
                      }}
                    />
                    <Scatter
                      data={state.simulationHistory}
                      onClick={(point: { trialNumber?: number; payload?: { trialNumber: number } }) => {
                        const trialNumber = point.payload?.trialNumber ?? point.trialNumber;
                        if (trialNumber !== undefined) setSelectedTrialNumber(trialNumber);
                      }}
                      className="cursor-pointer"
                    >
                      {state.simulationHistory.map((trial) => (
                        <Cell key={trial.trialNumber} fill={trial.trialNumber === selectedTrialNumber ? 'var(--game-text)' : 'var(--game-accent)'} />
                      ))}
                    </Scatter>
                    {fitData && (
                      <Line
                        data={fitData.points}
                        type="monotone"
                        dataKey="fitEstimate"
                        name={fitType === 'polynomial' ? 'Polynomial fit' : 'Exponential fit'}
                        stroke="var(--game-text)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              {fitType !== 'none' && !fitData && (
                <p className="mt-2 text-xs text-game-text/50">
                  {state.simulationHistory.length < 2
                    ? 'At least two trials are needed for a fit.'
                    : state.simulationHistory.every((trial) => trial.gateCount === state.simulationHistory[0].gateCount)
                      ? 'At least two different gate counts are needed for a fit.'
                      : fitType === 'exponential'
                        ? 'A shifted exponential fit could not be calculated for these estimates.'
                        : 'A fit could not be calculated for these estimates.'}
                </p>
              )}
              <p className="mt-2 text-xs text-game-text/50">Click a point to view that trial’s results.</p>
            </section>

            <section className="flex min-h-[16rem] min-w-0 flex-col">
              {selectedTrial ? (
                <>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTrialNumber(state.simulationHistory[selectedTrialIndex - 1]?.trialNumber ?? selectedTrialNumber)}
                        disabled={selectedTrialIndex <= 0}
                        aria-label="Previous trial"
                        title="Previous trial"
                        className="rounded border border-game-text/15 p-1 text-game-text transition-colors hover:bg-game-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <h3 className="font-semibold">Trial #{selectedTrial.trialNumber}</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedTrialNumber(state.simulationHistory[selectedTrialIndex + 1]?.trialNumber ?? selectedTrialNumber)}
                        disabled={selectedTrialIndex >= state.simulationHistory.length - 1}
                        aria-label="Next trial"
                        title="Next trial"
                        className="rounded border border-game-text/15 p-1 text-game-text transition-colors hover:bg-game-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <p className="text-sm text-game-text/70">
                      Global estimate: <span className="font-mono text-game-accent">{selectedTrial.estimate.toFixed(5)}</span>
                    </p>
                  </div>
                  <div className="min-h-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(selectedTrial.counts).map(([measuredState, count]) => ({ measuredState, count }))} margin={{ top: 12, right: 12, bottom: 24, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--game-text)" strokeOpacity={0.12} vertical={false} />
                        <XAxis dataKey="measuredState" stroke="var(--game-text)" strokeOpacity={0.6} />
                        <YAxis allowDecimals={false} stroke="var(--game-text)" strokeOpacity={0.6} width={52} />
                        <Tooltip
                          content={({ active, payload }) => {
                            const result = payload?.[0]?.payload;
                            return active && result ? (
                              <div className="border border-game-text/15 bg-game-primary p-3 text-sm shadow-lg">
                                <div>State: |{result.measuredState}⟩</div>
                                <div className="text-game-accent">Count: {result.count}</div>
                              </div>
                            ) : null;
                          }}
                        />
                        <Bar dataKey="count" fill="var(--game-accent)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-center text-xs text-game-text/50">Measured state</p>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-game-text/60">Select a trial to see its graph.</div>
              )}
            </section>
          </div>
        )}
        {isSubmitMode && (
          <form
            className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-game-text/15 pt-5"
            onSubmit={(event) => {
              event.preventDefault();
              const results = Number(resultsInput);
              if (Number.isFinite(results)) void onSubmitResults?.(results);
            }}
          >
            <label className="flex min-w-48 flex-1 flex-col gap-2 text-sm font-semibold text-game-text/80">
              <span>Results:</span>
              <input
                type="number"
                step="any"
                value={resultsInput}
                onChange={(event) => setResultsInput(event.target.value)}
                disabled={isSubmitting}
                className="w-full border border-game-text/20 bg-game-primary px-3 py-2 font-mono text-game-text outline-none focus:border-game-accent"
              />
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="border border-game-text/20 px-4 py-2 text-game-text/80 transition-colors hover:bg-game-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || resultsInput.trim() === '' || !Number.isFinite(Number(resultsInput))}
                className="bg-game-accent px-4 py-2 font-semibold text-game-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? 'Submitting...' : 'Submit results'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
};