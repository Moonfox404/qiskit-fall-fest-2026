from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.models.circuit_layout import CircuitLayout
from backend.models.simulation_result import SimulationResult
from backend.models.simulation_request import SimulationRequest
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
    request: SimulationRequest,
    shots: int = 1024,
) -> SimulationResult:
    """
    Simulate the quantum circuit and return the simulation results.
    """

    qiskit_circuits = qiskit_service.construct_circuit(request.circuit)

    # Use default noise if the level does not specify one
    if not request.noise_model:
        noise_model = "depolarizing_error"
        noise_params = {"p": 0.5}
    else:
        noise_model = request.noise_model
        noise_params = request.noise_params

    result = qiskit_service.simulate(
        qiskit_circuits,
        shots=shots,
        error_class=noise_model,
        noise_params=noise_params,
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


@app.post("/inverse", response_model=CircuitLayout)
def get_inverse(circuit: CircuitLayout) -> CircuitLayout:
    """
    Return the inverse circuit layout.
    """
    try:
        return qiskit_service.invert_circuit(circuit)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
