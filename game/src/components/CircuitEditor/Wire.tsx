import { getCircuitColumns, useGameState } from '../../context/GameStateContext';
import { GateElement } from './GateElement';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Fragment } from 'react';
import { GAME_CONSTANTS } from '../../config/constants';

const DropZone = ({ id }: { id: string }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={`w-8 h-12 rounded-md z-10 transition-colors duration-200 border border-transparent ${isOver ? 'bg-game-accent/30 border-game-accent' : 'bg-game-primary/60 hover:bg-game-accent/10'}`}
    />
  );
};

const CircuitGate = ({
  index,
  qubitIndex,
  name,
  isSelected,
  onSelect,
  onRemove,
}: {
  index: number;
  qubitIndex: number;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `circuit-gate-${index}-q-${qubitIndex}`,
    data: { type: 'circuit-gate', sourceIndex: index, sourceQubitIndex: qubitIndex, name },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`relative w-12 group ${isDragging ? 'opacity-30' : ''}`}
    >
      <div {...attributes} {...listeners} className="touch-none cursor-grab">
        <GateElement name={name} isSelected={isSelected} onSelect={onSelect} />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name} gate`}
        title={`Remove ${name} gate and refund $${GAME_CONSTANTS.GATE_COSTS[name as keyof typeof GAME_CONSTANTS.GATE_COSTS] ?? 0}`}
        className="absolute -right-2 -top-2 z-30 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-game-text text-xs text-game-primary opacity-0 transition-opacity group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
};

export const Wire = ({
  selectedGateIndex,
  onSelectGate,
}: {
  selectedGateIndex: number | null;
  onSelectGate: (index: number | null) => void;
}) => {
  const { state, dispatch } = useGameState();
  const columns = getCircuitColumns(state.circuit.layout);
  const numCols = columns.length + 1; // +1 to allow inserting at the end

  const handleRemoveGate = (index: number) => {
    dispatch({ type: 'REMOVE_GATE', payload: { index } });
    onSelectGate(null);
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
            <div className="w-16 text-center font-mono font-bold text-lg text-game-text/80 bg-game-primary rounded-l-md h-full flex items-center justify-center">
              q[{qIndex}]
            </div>

            {/* Wire Line & Gates Container */}
            <div className="flex-1 relative flex items-center pl-4 bg-game-primary/30 rounded-r-md h-full border-y border-r border-game-text/15">
              
              {/* Background Wire Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-game-text/30 z-0" />
              
              {/* Drop Zones & Gates Interleaved */}
              <div className="flex items-center">
                {Array.from({ length: numCols }).map((__, colIndex) => {
                  const positionedGate = colIndex < columns.length
                    ? columns[colIndex].find(({ gate }) => gate.qubits.includes(qIndex))
                    : undefined;
                  const gate = positionedGate?.gate;

                  return (
                    <Fragment key={`c-${colIndex}`}>
                      {/* Drop zone for this column on this wire */}
                      <DropZone id={`q-${qIndex}-c-${colIndex}`} />

                      {/* Render the gate or empty space if this column has a gate */}
                      {colIndex < columns.length && (
                        <div className="w-12 z-20 flex justify-center">
                          {positionedGate ? (
                            <CircuitGate
                              index={positionedGate.index}
                              qubitIndex={qIndex}
                              name={positionedGate.gate.name}
                              isSelected={selectedGateIndex === positionedGate.index}
                              onSelect={() => onSelectGate(positionedGate.index)}
                              onRemove={() => handleRemoveGate(positionedGate.index)}
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
