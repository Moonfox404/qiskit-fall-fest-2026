from pydantic import BaseModel


class Gate(BaseModel):
    """
    A gate in the quantum circuit.
    """
    name: str
    qubits: list[int]
