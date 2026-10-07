from pydantic import BaseModel


class SimulationResult(BaseModel):
    """
    A class to represent the result of a quantum circuit simulation.
    """

    counts: dict[str, int]
    expectation: float
    state_vector: list[dict[str, float]]
