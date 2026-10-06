from fastapi import FastApi

from models.circuit_layout import CircuitLayout
from services import qiskit_service

app = FastApi()

@app.post("/measurement")
def measure_circuit(circuit: CircuitLayout):
    """
    Measure the quantum circuit and return the measurement results.
    """

    qiskit_circuit = qiskit_service.construct_circuit(circuit)
