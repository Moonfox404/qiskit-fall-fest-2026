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
  twirl,
  isLocked,
  isSelected,
  onSelect,
  onRemove,
  onRemoveTwirl,
}: {
  index: number;
  qubitIndex: number;
  name: string;
  twirl?: boolean;
  isLocked: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRemoveTwirl: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `circuit-gate-${index}-q-${qubitIndex}`,
    data: { type: 'circuit-gate', sourceIndex: index, sourceQubitIndex: qubitIndex, name },
    disabled: isLocked,
  });
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: `gate-target-${index}`,
    data: { type: 'gate-target', gateIndex: index },
  });

  return (
    <div
      ref={setDropNodeRef}
      className="group relative h-12 w-20"
    >
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Translate.toString(transform) }}
        className={`absolute left-4 top-0 h-12 w-12 ${isDragging ? 'opacity-30' : ''}`}
      >
        <div {...attributes} {...listeners} className={isLocked ? 'cursor-default' : 'touch-none cursor-grab'}>
          <GateElement name={name} isSelected={isSelected} onSelect={onSelect} />
        </div>
      </div>
      {twirl && <TwirlMarker side="left" onRemove={onRemoveTwirl} />}
      {twirl && <TwirlMarker side="right" onRemove={onRemoveTwirl} />}
      {!isLocked && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name} gate`}
          title={`Remove ${name} gate and refund $${GAME_CONSTANTS.GATE_COSTS[name as keyof typeof GAME_CONSTANTS.GATE_COSTS] ?? 0}`}
          className="absolute -right-2 -top-2 z-30 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-game-text text-xs text-game-primary opacity-0 transition-opacity group-hover:opacity-100"
        >
          ×
        </button>
      )}
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

  const handleRemoveTwirl = (index: number) => {
    dispatch({ type: 'UNTWIRL_GATE', payload: { index } });
  };

  const multiQubitGates = columns.flatMap((column, columnIndex) => column
    .filter(({ gate }) => gate.qubits.length > 1)
    .map(({ gate, index }) => ({ gate, index, columnIndex })));

  return (
    <div className="mt-6 min-h-[200px] min-w-0 flex-1 overflow-auto pb-4">
      <div
        className="grid min-w-full"
        style={{
          gridTemplateColumns: `4rem repeat(${numCols - 1}, 5rem) minmax(5rem, 1fr)`,
          gridTemplateRows: `repeat(${state.circuit.num_qubits}, 3rem)`,
          width: `max(100%, ${4 + numCols * 5}rem)`,
          justifyContent: 'start',
          columnGap: 0,
          rowGap: '2rem',
          minWidth: 'max(100%, 9rem)',
        }}
      >
        {Array.from({ length: state.circuit.num_qubits }, (_, qubitIndex) => (
          <Fragment key={`wire-${qubitIndex}`}>
            <div
              className="z-10 flex h-12 items-center justify-center rounded-l-md bg-game-primary font-mono text-lg font-bold text-game-text/80"
              style={{ gridColumn: 1, gridRow: qubitIndex + 1 }}
            >
              q[{qubitIndex}]
            </div>
            <div
              className="relative z-0 h-12 rounded-r-md border-y border-r border-game-text/15 bg-game-primary/30"
              style={{ gridColumn: '2 / -1', gridRow: qubitIndex + 1, width: '100%' }}
            >
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-game-text/30" />
            </div>
            {Array.from({ length: numCols }, (_, columnIndex) => {
              const positionedGate = columnIndex < columns.length
                ? columns[columnIndex].find(({ gate }) => gate.qubits.length === 1 && gate.qubits[0] === qubitIndex)
                : undefined;
              return (
                <Fragment key={`q-${qubitIndex}-c-${columnIndex}`}>
                  <div className="z-10 flex h-12 items-center justify-start pl-1" style={{ gridColumn: columnIndex + 2, gridRow: qubitIndex + 1 }}>
                    <DropZone id={`q-${qubitIndex}-c-${columnIndex}`} />
                  </div>
                  {positionedGate && (
                    <div className="z-20 flex h-12 w-20 items-center justify-center" style={{ gridColumn: columnIndex + 2, gridRow: qubitIndex + 1 }}>
                      <CircuitGate
                        index={positionedGate.index}
                        qubitIndex={qubitIndex}
                        name={positionedGate.gate.name}
                        twirl={positionedGate.gate.twirl}
                        isLocked={positionedGate.gate.isLevelGate ?? false}
                        isSelected={selectedGateIndex === positionedGate.index}
                        onSelect={() => onSelectGate(positionedGate.index)}
                        onRemove={() => handleRemoveGate(positionedGate.index)}
                        onRemoveTwirl={() => handleRemoveTwirl(positionedGate.index)}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </Fragment>
        ))}
        {multiQubitGates.map(({ gate, index, columnIndex }) => (
          <SpanningCircuitGate
            key={`multi-gate-${index}`}
            gate={gate}
            columnIndex={columnIndex}
            index={index}
            numQubits={state.circuit.num_qubits}
            isLocked={gate.isLevelGate ?? false}
            twirl={gate.twirl}
            isSelected={selectedGateIndex === index}
            onSelect={() => onSelectGate(index)}
            onRemove={() => handleRemoveGate(index)}
            onRemoveTwirl={() => handleRemoveTwirl(index)}
          />
        ))}
      </div>
    </div>
  );
};

const SpanningCircuitGate = ({
  gate,
  columnIndex,
  index,
  numQubits,
  isLocked,
  twirl,
  isSelected,
  onSelect,
  onRemove,
  onRemoveTwirl,
}: {
  gate: { name: string; qubits: number[] };
  columnIndex: number;
  index: number;
  numQubits: number;
  isLocked: boolean;
  twirl?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRemoveTwirl: () => void;
}) => {
  const firstQubit = Math.min(...gate.qubits);
  const lastQubit = Math.max(...gate.qubits);
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `circuit-gate-${index}-q-${gate.qubits[0]}`,
    data: {
      type: 'circuit-gate',
      sourceIndex: index,
      sourceQubitIndex: gate.qubits[0],
      sourceColumnIndex: columnIndex,
      isMultiQubit: true,
      name: gate.name,
    },
    disabled: isLocked,
  });
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: `gate-target-${index}`,
    data: { type: 'gate-target', gateIndex: index },
  });

  return (
    <div
      ref={setDropNodeRef}
      style={{
        gridColumn: columnIndex + 2,
        gridRow: `1 / ${numQubits + 1}`,
        gridTemplateRows: `repeat(${numQubits}, 3rem)`,
        rowGap: '2rem',
      }}
      className="pointer-events-none relative z-30 grid"
    >
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={onSelect}
        style={{
          gridRow: '1 / -1',
          gridTemplateRows: `repeat(${numQubits}, 3rem)`,
          rowGap: '2rem',
        }}
        className={`group pointer-events-none relative z-30 grid ${isSelected ? 'ring-2 ring-game-text' : ''}`}
      >
      {lastQubit > firstQubit && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-auto absolute z-0 w-4 -translate-x-1/2 bg-transparent"
            style={{
              left: '50%',
              top: `calc(1.5rem + ${firstQubit * 5}rem)`,
              height: `${(lastQubit - firstQubit) * 5}rem`,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-0 w-[2px] -translate-x-1/2 rounded-full bg-game-text shadow-[0_0_6px_rgba(255,255,255,0.65)]"
            style={{
              left: '50%',
              top: `calc(1.5rem + ${firstQubit * 5}rem)`,
              height: `${(lastQubit - firstQubit) * 5}rem`,
            }}
          />
        </>
      )}
      {Array.from({ length: numQubits }, (_, qubitIndex) => {
        const isInput = gate.qubits.includes(qubitIndex);
        const isControl = gate.qubits[0] === qubitIndex;
        return (
          <div
            key={qubitIndex}
            style={{ gridRow: qubitIndex + 1 }}
            className={`relative z-10 flex h-12 w-20 items-center justify-center ${isInput ? 'pointer-events-auto border-y border-game-accent/40 bg-game-primary/20' : 'pointer-events-none'}`}
          >
            {isInput && (
              <span
                aria-label={`CNOT ${isControl ? 'control' : 'target'} on qubit ${qubitIndex}`}
                className="relative flex h-12 w-20 items-center justify-center"
              >
                {twirl && qubitIndex === gate.qubits[0] && <TwirlMarker side="left" onRemove={onRemoveTwirl} />}
                {isControl ? (
                  <span className="block h-3 w-3 rounded-full bg-game-text drop-shadow-[0_0_6px_rgba(52,211,153,0.95)]" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-game-text bg-game-primary text-game-text drop-shadow-[0_0_6px_rgba(253,224,71,0.95)]">
                    <span className="-translate-y-px text-lg font-bold leading-none">+</span>
                  </span>
                )}
                {twirl && qubitIndex === gate.qubits[gate.qubits.length - 1] && <TwirlMarker side="right" onRemove={onRemoveTwirl} />}
                {isControl && !isLocked && (
                  <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => { event.stopPropagation(); onRemove(); }}
                    aria-label={`Remove ${gate.name} gate`}
                    title={`Remove ${gate.name} gate and refund $${GAME_CONSTANTS.GATE_COSTS[gate.name as keyof typeof GAME_CONSTANTS.GATE_COSTS] ?? 0}`}
                    className="absolute -right-2 -top-1 z-40 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-game-text text-xs text-game-primary opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    ×
                  </button>
                )}
              </span>
            )}
          </div>
        );
      })}
      </div>
    </div>
  );
};

const TwirlMarker = ({ side, onRemove }: { side: 'left' | 'right'; onRemove: () => void }) => (
  <button
    type="button"
    aria-label="Remove Pauli twirl"
    title={`Remove Pauli twirl and refund $${GAME_CONSTANTS.GATE_COSTS.P}`}
    onPointerDown={(event) => event.stopPropagation()}
    onClick={(event) => { event.stopPropagation(); onRemove(); }}
    className={`group absolute top-1/2 ${side === 'left' ? 'left-0' : 'right-0'} z-20 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-sm bg-emerald-500 text-[10px] font-bold leading-none text-game-primary shadow-sm transition-colors hover:bg-game-primary hover:text-game-text`}
  >
    <span className="group-hover:hidden">P</span>
    <span className="hidden group-hover:inline">×</span>
  </button>
);
