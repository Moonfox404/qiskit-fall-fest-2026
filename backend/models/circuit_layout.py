from pydantic import BaseModel

from backend.models.gate import Gate


class CircuitLayout(BaseModel):
    """
    The circuit layout for the quantum circuit.
    """
    num_qubits: int
    layout: list[Gate]
