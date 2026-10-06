import { useGameState } from '../../context/GameStateContext';
import { GateElement } from './GateElement';
import { useDroppable } from '@dnd-kit/core';
import { Fragment } from 'react';
import { GAME_CONSTANTS } from '../../config/constants';

const DropZone = ({ id }: { id: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={`w-8 h-12 rounded-md z-10 transition-colors duration-200 border border-transparent ${isOver ? 'bg-green-400/40 border-green-400' : 'bg-gray-600/20 hover:bg-gray-600/40'}`}
    />
  );
};

export const Wire = () => {
  const { state, dispatch } = useGameState();
  const numCols = state.circuit.layout.length + 1; // +1 to allow inserting at the end

  const handleRemoveGate = (colIndex: number, gateName: string) => {
    // Full refund logic
    const cost = GAME_CONSTANTS.GATE_COSTS[gateName as keyof typeof GAME_CONSTANTS.GATE_COSTS] || 0;
    dispatch({
      type: 'REMOVE_GATE',
      payload: { index: colIndex, refund: cost }
    });
  };

  return (
    <div className="flex flex-col gap-8 mt-6 overflow-x-auto min-h-[200px] pb-4">
      {Array.from({ length: state.circuit.num_qubits }).map((_, qIndex) => {
        return (
          <div
            key={qIndex}
            className="flex items-center h-12 relative"
          >
            {/* Qubit Label */}
            <div className="w-16 text-center font-mono font-bold text-lg text-gray-300 bg-gray-800 rounded-l-md h-full flex items-center justify-center">
              q[{qIndex}]
            </div>

            {/* Wire Line & Gates Container */}
            <div className="flex-1 relative flex items-center pl-4 bg-gray-800/30 rounded-r-md h-full border-y border-r border-gray-700">
              
              {/* Background Wire Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gray-600 z-0" />
              
              {/* Drop Zones & Gates Interleaved */}
              <div className="flex items-center">
                {Array.from({ length: numCols }).map((__, colIndex) => {
                  const gate = colIndex < state.circuit.layout.length ? state.circuit.layout[colIndex] : null;
                  const hasGateHere = gate && gate.qubits.includes(qIndex);

                  return (
                    <Fragment key={`c-${colIndex}`}>
                      {/* Drop zone for this column on this wire */}
                      <DropZone id={`q-${qIndex}-c-${colIndex}`} />

                      {/* Render the gate or empty space if this column has a gate */}
                      {colIndex < state.circuit.layout.length && (
                        <div className="w-12 z-20 flex justify-center">
                          {hasGateHere ? (
                            <GateElement 
                              name={gate.name} 
                              onRemove={() => handleRemoveGate(colIndex, gate.name)}
                            />
                          ) : (
                            <div className="w-12" />
                          )}
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
