from qiskit import QuantumCircuit
from qiskit.quantum_info import (
    Clifford,
    Pauli,
    SparsePauliOp,
    Statevector,
    random_pauli,
)
from qiskit.transpiler import generate_preset_pass_manager
from qiskit_aer import AerSimulator
from qiskit_aer.noise import (
    NoiseModel,
    coherent_unitary_error,
    depolarizing_error,
    thermal_relaxation_error,
)

from backend.models.circuit_layout import CircuitLayout
from backend.models.gate import Gate

OPTIMISATION_LEVEL = 0
NUM_PAULI_VARIANTS = 32


def construct_circuit(
    circuit_layout: CircuitLayout, num_variants: int = NUM_PAULI_VARIANTS
) -> list[QuantumCircuit]:
    """
    Construct randomized Pauli-twirled circuit variants from the given layout.
    """
    if num_variants < 1:
        raise ValueError("num_variants must be at least 1")

    twirled_gates = [gate for gate in circuit_layout.layout if gate.twirl]
    if not twirled_gates:
        return [_build_circuit(circuit_layout)]

    return [_build_circuit(circuit_layout, twirl=True) for _ in range(num_variants)]


def invert_circuit(circuit_layout: CircuitLayout) -> CircuitLayout:
    """
    Return a layout for the inverse of a circuit built from the given layout.
    """
    circuit = construct_circuit(circuit_layout, num_variants=1)[0]
    inverse_circuit = circuit.inverse()
    inverse_layout = [
        Gate(
            name="CX" if instruction.operation.name == "cx" else instruction.operation.name.upper(),
            qubits=[inverse_circuit.find_bit(qubit).index for qubit in instruction.qubits],
        )
        for instruction in inverse_circuit.data
    ]

    return CircuitLayout(num_qubits=circuit_layout.num_qubits, layout=inverse_layout)


def _build_circuit(circuit_layout: CircuitLayout, twirl: bool = False):
    circuit = QuantumCircuit(circuit_layout.num_qubits)

    for gate in circuit_layout.layout:
        gate_name = gate.name.lower()
        _validate_gate(gate_name, gate.qubits, gate.name)

        if twirl and gate.twirl:
            random_pauli_gate = random_pauli(len(gate.qubits))
            local_circuit = QuantumCircuit(len(gate.qubits))
            _append_gate(local_circuit, gate_name, list(range(len(gate.qubits))))
            conjugated_pauli = random_pauli_gate.evolve(
                Clifford(local_circuit), frame="s"
            )

            _append_pauli(circuit, random_pauli_gate, gate.qubits)
            _append_gate(circuit, gate_name, gate.qubits)
            _append_pauli(circuit, conjugated_pauli, gate.qubits)
        else:
            _append_gate(circuit, gate_name, gate.qubits)

    return circuit


def _validate_gate(gate_name: str, qubits: list[int], original_name: str):
    gate_widths = {"x": 1, "y": 1, "z": 1, "h": 1, "cx": 2}
    if gate_name not in gate_widths:
        raise ValueError(f"Unsupported quantum gate: {original_name}")
    if len(qubits) != gate_widths[gate_name]:
        raise ValueError(
            f"Gate {original_name} must target exactly {gate_widths[gate_name]} qubit(s)"
        )


def _append_gate(circuit: QuantumCircuit, gate_name: str, qubits: list[int]):
    getattr(circuit, gate_name)(*qubits)


def _append_pauli(circuit: QuantumCircuit, pauli: Pauli, qubits: list[int]):
    for index, qubit in enumerate(qubits):
        has_x = bool(pauli.x[index])
        has_z = bool(pauli.z[index])
        if has_x and has_z:
            circuit.y(qubit)
        elif has_x:
            circuit.x(qubit)
        elif has_z:
            circuit.z(qubit)


def simulate(
    circuits: list[QuantumCircuit],
    shots: int = 1024,
    error_class: str = "depolarizing_error",
    noise_params: dict | None = None,
):
    """
    Simulate a noisy circuit and return its measurement and statevector results.
    """
    if not circuits:
        raise ValueError("At least one circuit is required")
    if shots < len(circuits):
        raise ValueError("shots must be at least the number of circuits")

    noise_model = NoiseModel()
    params = noise_params or {}
    if error_class not in {
        "depolarizing_error",
        "thermal_relaxation_error",
        "coherent_unitary_error",
    }:
        raise ValueError(f"Unsupported noise error class: {error_class}")

    gate_widths: dict[str, int] = {}
    for circuit in circuits:
        for instruction in circuit.data:
            if instruction.operation.name not in {"barrier", "measure", "reset"}:
                gate_widths[instruction.operation.name] = (
                    instruction.operation.num_qubits
                )

    configured_gate_names = params.get("gate_names")
    if configured_gate_names is None:
        noisy_gate_names = set(gate_widths)
    else:
        if (
            not isinstance(configured_gate_names, (list, tuple))
            or not configured_gate_names
            or not all(isinstance(name, str) for name in configured_gate_names)
        ):
            raise ValueError(
                "noise parameter 'gate_names' must be a non-empty list of names"
            )
        noisy_gate_names = {name.lower() for name in configured_gate_names}
        unknown_gate_names = noisy_gate_names - gate_widths.keys()
        if unknown_gate_names:
            raise ValueError(
                "Noise gate names not present in the circuit: "
                + ", ".join(sorted(unknown_gate_names))
            )

    for gate_name, num_qubits in gate_widths.items():
        if gate_name not in noisy_gate_names:
            continue
        error = _get_quantum_error(error_class, params, num_qubits)
        noise_model.add_all_qubit_quantum_error(error, gate_name)

    simulator = AerSimulator(method="statevector", noise_model=noise_model)
    pass_manager = generate_preset_pass_manager(OPTIMISATION_LEVEL, simulator)
    transpiled_circuits = []
    for circuit in circuits:
        transpiled_circuit = pass_manager.run(circuit.copy())
        transpiled_circuit.save_statevector()
        transpiled_circuit.measure_all()
        transpiled_circuits.append(transpiled_circuit)

    base_shots, extra_shots = divmod(shots, len(transpiled_circuits))
    shots_per_circuit = [
        base_shots + (index < extra_shots) for index in range(len(transpiled_circuits))
    ]
    grouped_circuits: dict[int, list[tuple[int, QuantumCircuit]]] = {}
    for index, (circuit, circuit_shots) in enumerate(
        zip(transpiled_circuits, shots_per_circuit)
    ):
        grouped_circuits.setdefault(circuit_shots, []).append((index, circuit))

    circuit_counts: list[dict[str, int] | None] = [None] * len(circuits)
    statevector = None
    for circuit_shots, indexed_circuits in grouped_circuits.items():
        result = simulator.run(
            [circuit for _, circuit in indexed_circuits],
            shots=circuit_shots,
        ).result()
        for result_index, (circuit_index, _) in enumerate(indexed_circuits):
            circuit_counts[circuit_index] = result.get_counts(result_index)
            if circuit_index == 0:
                statevector = result.data(result_index)["statevector"].data

    counts: dict[str, int] = {}
    for counts_for_circuit in circuit_counts:
        if counts_for_circuit is None:
            raise RuntimeError("Simulator did not return results for every circuit")
        for bitstring, count in counts_for_circuit.items():
            counts[bitstring] = counts.get(bitstring, 0) + count

    expectation = (
        sum(
            (-1) ** bitstring.replace(" ", "").count("1") * count
            for bitstring, count in counts.items()
        )
        / shots
    )

    if statevector is None:
        raise RuntimeError("Simulator did not return a state vector")

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
        error = thermal_relaxation_error(params["t1"], params["t2"], params["time"])
        for _ in range(num_qubits - 1):
            error = error.tensor(
                thermal_relaxation_error(params["t1"], params["t2"], params["time"])
            )
        return error

    if error_class == "coherent_unitary_error":
        if "unitary" not in params:
            raise ValueError(
                "coherent_unitary_error requires a 'unitary' noise parameter"
            )
        return coherent_unitary_error(params["unitary"])

    raise ValueError(f"Unsupported noise error class: {error_class}")


def get_ideal(circuit: QuantumCircuit):
    """
    Get the ideal circuit result.
    """

    observable = SparsePauliOp("Z" * circuit.num_qubits)
    ideal_expectation = float(
        Statevector.from_instruction(circuit).expectation_value(observable).real
    )
    ideal_expectation = min(1.0, max(-1.0, ideal_expectation))

    return ideal_expectation
