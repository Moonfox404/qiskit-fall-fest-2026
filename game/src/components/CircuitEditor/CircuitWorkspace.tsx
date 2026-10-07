import { Wire } from './Wire';
import { getCircuitBlockLayout, getCircuitCost, useGameState } from '../../context/GameStateContext';
import { ClipboardPaste, Copy, Trash2 } from 'lucide-react';

export const CircuitWorkspace = ({
  showBlockDiagram,
  selectedBlockIndex,
  onSelectBlock,
  onDeleteBlock,
  selectedGateIndex,
  canCopyGate,
  canPasteGate,
  onSelectGate,
  onCopyGate,
  onPasteGate,
}: {
  showBlockDiagram: boolean;
  selectedBlockIndex: number | null;
  onSelectBlock: (index: number | null) => void;
  onDeleteBlock: (index: number) => void;
  selectedGateIndex: number | null;
  canCopyGate: boolean;
  canPasteGate: boolean;
  onSelectGate: (index: number | null) => void;
  onCopyGate: () => void;
  onPasteGate: () => void;
}) => {
  const { state } = useGameState();
  const blockCount = Math.max(0, state.circuitBlockCount ?? 1);
  const blockRefund = getCircuitCost(getCircuitBlockLayout(state.circuit.layout, blockCount));

  return (
    <div className="w-full h-full min-w-0 min-h-0 bg-game-card/80 border border-game-text/15 p-6 rounded-lg shadow-2xl backdrop-blur-sm">
      <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-center text-game-text">
          {showBlockDiagram ? 'Circuit Block Diagram' : 'Circuit Layout'}
        </h2>
        {!showBlockDiagram && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopyGate}
              disabled={!canCopyGate}
              aria-label="Copy selected gate"
              title="Copy selected gate (Ctrl+C)"
              className="rounded-md border border-game-text/15 bg-game-primary p-2 text-game-text transition-colors hover:bg-game-accent/20 disabled:cursor-not-allowed disabled:text-game-text/30"
            >
              <Copy size={18} />
            </button>
            <button
              type="button"
              onClick={onPasteGate}
              disabled={!canPasteGate}
              aria-label="Paste copied gate"
              title="Paste copied gate (Ctrl+V)"
              className="rounded-md border border-game-text/15 bg-game-primary p-2 text-game-text transition-colors hover:bg-game-accent/20 disabled:cursor-not-allowed disabled:text-game-text/30"
            >
              <ClipboardPaste size={18} />
            </button>
          </div>
        )}
      </div>
      {showBlockDiagram ? (
        <div className="flex h-[calc(100%-3.5rem)] min-h-[200px] items-center justify-center overflow-auto">
          <div className="flex min-w-max items-center gap-6 px-4">
            {blockCount === 0 ? (
              <p className="text-game-text/60">No circuit blocks</p>
            ) : (
              Array.from({ length: blockCount }, (_, blockIndex) => (
                <div key={blockIndex} className="flex items-center gap-6">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => onSelectBlock(blockIndex)}
                      aria-pressed={selectedBlockIndex === blockIndex}
                      title={`Select circuit block ${blockIndex + 1}`}
                      className={`flex min-h-48 w-[min(90vw,36rem)] flex-col justify-center rounded-lg border-2 bg-game-primary/90 px-10 py-10 text-center shadow-lg transition-colors ${selectedBlockIndex === blockIndex ? 'border-game-text ring-2 ring-game-accent' : 'border-game-accent hover:bg-game-primary'}`}
                    >
                      <h3 className="text-xl font-bold text-game-text">
                        {blockCount > 1 ? `Circuit block ${blockIndex + 1}` : 'Quantum circuit'}
                      </h3>
                      <p className="mt-2 text-sm text-game-text/60">
                        {state.circuit.layout.length / blockCount} gates across {state.circuit.num_qubits} qubits
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={blockIndex === 0}
                      aria-label={`Delete circuit block ${blockIndex + 1}`}
                      title={blockIndex === 0 ? 'The first circuit block cannot be deleted' : `Delete circuit block ${blockIndex + 1} and refund $${blockRefund}`}
                      onClick={() => onDeleteBlock(blockIndex)}
                      className="absolute right-3 top-3 z-10 rounded p-2 text-game-text/60 transition-colors hover:bg-game-card hover:text-game-text disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {blockIndex < blockCount - 1 && (
                    <div aria-hidden="true" className="h-1 w-6 bg-game-accent/60" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <Wire selectedGateIndex={selectedGateIndex} onSelectGate={onSelectGate} />
      )}
    </div>
  );
};

