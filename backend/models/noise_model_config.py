from typing import Any

from pydantic import BaseModel, Field


class NoiseModelConfig(BaseModel):
    noise_model: str
    noise_params: dict[str, Any] = Field(default_factory=dict)
