
import { useGameState } from '../../context/GameStateContext';
import { GateElement } from './GateElement';
import { useDroppable } from '@dnd-kit/core';
import { Fragment } from 'react';

const DropZone = ({ id }: { id: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{
        width: '30px', // Drop zone width between gates
        height: '40px',
        background: isOver ? 'rgba(74, 222, 128, 0.4)' : 'transparent',
        borderRadius: '4px',
        zIndex: 5,
        transition: 'background 0.2s',
      }}
    />
  );
};

export const Wire = () => {
  const { state } = useGameState();
  const numCols = state.circuit.layout.length + 1; // +1 to allow inserting at the end

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px', overflowX: 'auto', minHeight: '200px' }}>
      {Array.from({ length: state.circuit.num_qubits }).map((_, qIndex) => {
        return (
          <div
            key={qIndex}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '40px',
              position: 'relative',
            }}
          >
            {/* Qubit Label */}
            <div style={{ width: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2em' }}>
              q[{qIndex}]
            </div>

            {/* Wire Line & Gates Container */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', paddingLeft: '10px' }}>
              
              {/* Background Wire Line */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: '#999', zIndex: 1 }} />
              
              {/* Drop Zones & Gates Interleaved */}
              {Array.from({ length: numCols }).map((__, colIndex) => {
                const gate = colIndex < state.circuit.layout.length ? state.circuit.layout[colIndex] : null;
                const hasGateHere = gate && gate.qubits.includes(qIndex);

                return (
                  <Fragment key={`c-${colIndex}`}>
                    {/* Drop zone for this column on this wire */}
                    <DropZone id={`q-${qIndex}-c-${colIndex}`} />

                    {/* Render the gate or empty space if this column has a gate */}
                    {colIndex < state.circuit.layout.length && (
                      <div style={{ width: '40px', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
                        {hasGateHere ? <GateElement name={gate.name} /> : <div style={{ width: '40px' }} />}
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
