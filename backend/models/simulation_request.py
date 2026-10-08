from typing import Any

from pydantic import BaseModel

from backend.models.circuit_layout import CircuitLayout


class SimulationRequest(BaseModel):
    circuit: CircuitLayout
    noise_model: str | None = None
    noise_params: dict[str, Any] | None = None