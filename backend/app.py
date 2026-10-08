from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.models.circuit_layout import CircuitLayout
from backend.models.simulation_result import SimulationResult
from backend.services import qiskit_service

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/simulation")
def simulate(
    circuit: CircuitLayout, noise: int = 0, shots: int = 1024
) -> SimulationResult:
    """
    Simulate the quantum circuit and return the simulation results.
    """

    qiskit_circuits = qiskit_service.construct_circuit(circuit)

    result = qiskit_service.simulate(
        qiskit_circuits,
        shots=shots,
        error_class="depolarizing_error",
        noise_params={"p": noise},
    )
    return result


@app.post("/ideal")
def get_ideal(circuit: CircuitLayout) -> float:
    """
    Get the ideal results.
    """

    qiskit_circuit = qiskit_service.construct_circuit(circuit)[0]

    result = qiskit_service.get_ideal(qiskit_circuit)
    return result
