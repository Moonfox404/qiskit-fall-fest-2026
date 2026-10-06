from qiskit import QuantumCircuit

from models.circuit_layout import CircuitLayout


def construct_circuit(circuit_layout: CircuitLayout):
    """
    Construct a quantum circuit from the given circuit layout.
    """
    # Create a quantum circuit with the specified number of qubits
    circuit = QuantumCircuit(circuit_layout.num_qubits)

    # Add gates to the circuit based on the layout
    for gate in circuit_layout.layout:
        circuit.append(gate.name, gate.qubits)

    return circuit
