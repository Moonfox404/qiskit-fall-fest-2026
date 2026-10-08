import type { CircuitLayout } from '../context/GameStateContext';

const API_BASE = 'http://localhost:8000';

export interface SimulationResult {
  counts: Record<string, number>;
  expectation: number;
  state_vector: Array<{ real: number; imag: number }>;
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
    body: JSON.stringify(circuit, (key, value) => ['isLevelGate', 'isBoundaryGate'].includes(key) ? undefined : value),
  });
  
  if (!res.ok) throw new Error('Simulation failed');
  return res.json();
};

export const getIdealExpectation = async (circuit: CircuitLayout): Promise<number> => {
  const res = await fetch(`${API_BASE}/ideal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(circuit, (key, value) => ['isLevelGate', 'isBoundaryGate'].includes(key) ? undefined : value),
  });
  
  if (!res.ok) throw new Error('Could not retrieve ideal expectation');
  return res.json();
};
