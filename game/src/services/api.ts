import type { CircuitLayout, NoiseModelConfig } from '../types/game';

const API_BASE = 'http://localhost:8000';

export interface SimulationResult {
  counts: Record<string, number>;
  expectation: number;
  state_vector: Array<{ real: number; imag: number }>;
}

export const runSimulation = async (
  circuit: CircuitLayout,
  shots: number,
  noiseModels?: NoiseModelConfig[] | null
): Promise<SimulationResult> => {
  const params = new URLSearchParams({
    shots: String(shots),
  });

  const payload = {
    circuit,
    noise_models: noiseModels?.length
      ? noiseModels
      : [{ noise_model: 'depolarizing_error', noise_params: { p: 0.5 } }],
  };

  const res = await fetch(`${API_BASE}/simulation?${params.toString()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify(
      payload,
      (key, value) =>
        ['isLevelGate', 'isBoundaryGate'].includes(key)
          ? undefined
          : value
    ),
  });

  if (!res.ok) throw new Error('Simulation failed');

  return res.json();
};

export const getIdealExpectation = async (
  circuit: CircuitLayout
): Promise<number> => {
  const res = await fetch(`${API_BASE}/ideal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify(
      circuit,
      (key, value) =>
        ['isLevelGate', 'isBoundaryGate'].includes(key)
          ? undefined
          : value
    ),
  });

  if (!res.ok) throw new Error('Failed to get ideal expectation');

  return res.json();
};

export const getInverseCircuit = async (circuit: CircuitLayout): Promise<CircuitLayout> => {
  const res = await fetch(`${API_BASE}/inverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(circuit, (key, value) => ['isLevelGate', 'isBoundaryGate'].includes(key) ? undefined : value),
  });

  if (!res.ok) throw new Error('Could not retrieve inverse circuit');
  return res.json();
};
