// --- Types mapping to Backend Models ---
export interface Gate {
  name: string;
  qubits: number[];
  column?: number;
  isLevelGate?: boolean;
  isBoundaryGate?: boolean;
  twirl?: boolean;
}

export interface CircuitLayout {
  num_qubits: number;
  layout: Gate[];
}

export interface NoiseModelConfig {
  noise_model: string;
  noise_params: Record<string, unknown>;
}

export interface Level {
  id: number;
  max_time: number;
  max_reward: number;
  recommended_funding: number;
  noise_models?: NoiseModelConfig[];
  circuit: CircuitLayout;
}