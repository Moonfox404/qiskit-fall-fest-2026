from fastapi import FastApi

from models.circuit_layout import CircuitLayout
from services import qiskit_service

app = FastApi()

@app.post("/simulation")
def simulate(circuit: CircuitLayout, noise: int = 0, shots: int = 1024):
    """
    Simulate the quantum circuit and return the simulation results.
    """

    qiskit_circuit = qiskit_service.construct_circuit(circuit)

    result = qiskit_service.simulate(qiskit_circuit, noise=noise, shots=shots)
    return result


@app.post("/evaluation")
def compare_with_ideal(circuit: CircuitLayout, expectation: list[float]):
    """
    Compare the simulation results with the ideal results and return the evaluation metrics.
    """

    qiskit_circuit = qiskit_service.construct_circuit(circuit)

    result = qiskit_service.evaluate(qiskit_circuit, expectation=expectation)
    return result
