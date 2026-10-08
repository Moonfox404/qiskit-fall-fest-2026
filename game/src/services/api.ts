import type { CircuitLayout } from '../types/game';

const API_BASE = 'http://localhost:8000';

export interface SimulationResult {
  counts: Record<string, number>;
  expectation: number;
  state_vector: Array<{ real: number; imag: number }>;
}

export const runSimulation = async (
  circuit: CircuitLayout,
  shots: number,
  noiseModel?: string | null,
  noiseParams?: Record<string, unknown> | null
): Promise<SimulationResult> => {
  const params = new URLSearchParams({
    shots: String(shots),
  });

  const normalizedNoiseModel = typeof noiseModel === 'string' && noiseModel.trim()
    ? noiseModel.trim()
    : 'depolarizing_error';

  const normalizedNoiseParams =
    noiseParams && typeof noiseParams === 'object' && !Array.isArray(noiseParams) && Object.keys(noiseParams).length > 0
      ? noiseParams
      : { p: 0.5 };

  const payload = {
    circuit,
    noise_model: normalizedNoiseModel,
    noise_params: normalizedNoiseParams,
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