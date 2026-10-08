from pydantic import BaseModel, Field

from backend.models.circuit_layout import CircuitLayout
from backend.models.noise_model_config import NoiseModelConfig


class SimulationRequest(BaseModel):
    circuit: CircuitLayout
    noise_models: list[NoiseModelConfig] = Field(default_factory=list)