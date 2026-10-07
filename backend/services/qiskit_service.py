from qiskit import QuantumCircuit
from qiskit.transpiler import generate_preset_pass_manager
from qiskit_aer import AerSimulator
from qiskit_aer.noise import (
    NoiseModel,
    coherent_unitary_error,
    depolarizing_error,
    thermal_relaxation_error,
)

from backend.models.circuit_layout import CircuitLayout

OPTIMISATION_LEVEL = 3


def construct_circuit(circuit_layout: CircuitLayout):
    """
    Construct a quantum circuit from the given circuit layout.
    """
    # Create a quantum circuit with the specified number of qubits
    circuit = QuantumCircuit(circuit_layout.num_qubits)

    # Add gates to the circuit based on the layout
    for gate in circuit_layout.layout:
        gate_name = gate.name.lower()
        if gate_name not in {"x", "y", "z", "h"}:
            raise ValueError(f"Unsupported quantum gate: {gate.name}")
        getattr(circuit, gate_name)(*gate.qubits)

    return circuit


def simulate(
    circuit: QuantumCircuit,
    shots: int = 1024,
    error_class: str = "depolarizing_error",
    noise_params: dict | None = None,
):
    """
    Simulate a noisy circuit and return its measurement and statevector results.
    """
    noise_model = NoiseModel()
    params = noise_params or {}
    if error_class not in {
        "depolarizing_error",
        "thermal_relaxation_error",
        "coherent_unitary_error",
    }:
        raise ValueError(f"Unsupported noise error class: {error_class}")

    gate_widths: dict[str, int] = {}
    for instruction in circuit.data:
        if instruction.operation.name not in {"barrier", "measure", "reset"}:
            gate_widths[instruction.operation.name] = instruction.operation.num_qubits

    for gate_name, num_qubits in gate_widths.items():
        error = _get_quantum_error(error_class, params, num_qubits)
        noise_model.add_all_qubit_quantum_error(error, gate_name)

    simulator = AerSimulator(method="statevector", noise_model=noise_model)
    pass_manager = generate_preset_pass_manager(OPTIMISATION_LEVEL, simulator)
    transpiled_circuit = pass_manager.run(circuit.copy())
    transpiled_circuit.save_statevector()

    transpiled_circuit.measure_all()

    result = simulator.run(transpiled_circuit, shots=shots).result()
    counts = result.get_counts()
    statevector = result.data(0)["statevector"].data
    expectation = sum(
        (-1) ** bitstring.replace(" ", "").count("1") * count
        for bitstring, count in counts.items()
    ) / shots

    return {
        "counts": counts,
        "expectation": expectation,
        "state_vector": [
            {"real": float(amplitude.real), "imag": float(amplitude.imag)}
            for amplitude in statevector
        ],
    }


def _get_quantum_error(error_class: str, params: dict, num_qubits: int):
    if error_class == "depolarizing_error":
        return depolarizing_error(params.get("p", 0.0), num_qubits)

    if error_class == "thermal_relaxation_error":
        required_params = {"t1", "t2", "time"}
        missing_params = required_params - params.keys()
        if missing_params:
            raise ValueError(
                "thermal_relaxation_error requires noise parameters: "
                + ", ".join(sorted(missing_params))
            )
        error = thermal_relaxation_error(
            params["t1"], params["t2"], params["time"]
        )
        for _ in range(num_qubits - 1):
            error = error.tensor(
                thermal_relaxation_error(
                    params["t1"], params["t2"], params["time"]
                )
            )
        return error

    if error_class == "coherent_unitary_error":
        if "unitary" not in params:
            raise ValueError(
                "coherent_unitary_error requires a 'unitary' noise parameter"
            )
        return coherent_unitary_error(params["unitary"])

    raise ValueError(f"Unsupported noise error class: {error_class}")


def evaluate(circuit: QuantumCircuit, expectation: float):
    """
    Compare the simulation results with the ideal results and return the evaluation metrics.
    """
    # stub implementation for evaluation
    return {
        "fidelity": 0.95,  # Placeholder fidelity
        "kl_divergence": 0.05,  # Placeholder error rate
        "total_variation_distance": 0.1,  # Placeholder total variation distance
    }
