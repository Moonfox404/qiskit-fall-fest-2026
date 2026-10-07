import type { CircuitLayout } from '../context/GameStateContext';

const API_BASE = 'http://localhost:8000';

export interface SimulationResult {
  counts: Record<string, number>;
  estimate: number;
}

export interface EvaluationResult {
  fidelity: number;
  kl_divergence: number;
  total_variation_distance: number;
}

export const runSimulation = async (
  circuit: CircuitLayout,
  shots: number,
  noise: number = 0
): Promise<SimulationResult> => {
  const params = new URLSearchParams({ noise: String(noise), shots: String(shots) });
  const res = await fetch(`${API_BASE}/simulation?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(circuit, (key, value) => key === 'isLevelGate' ? undefined : value),
  });
  
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
};

export const submitEvaluation = async (
  circuit: CircuitLayout,
  expectation: number
): Promise<EvaluationResult> => {
  const params = new URLSearchParams({ expectation: String(expectation) });
  const res = await fetch(`${API_BASE}/evaluation?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(circuit, (key, value) => key === 'isLevelGate' ? undefined : value),
  });
  
  if (!res.ok) throw new Error('Evaluation failed');
  return res.json();
};
