import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { GatePalette } from './CircuitEditor/GatePalette';
import { getCircuitBlockLayout, getCircuitCost, useGameState } from '../context/GameStateContext';

export const Sidebar = ({ open, setOpen, showBlockDiagram }: { open: boolean, setOpen: (o: boolean) => void, showBlockDiagram: boolean }) => {
  const { state, dispatch } = useGameState();
  const blockCount = Math.max(0, state.circuitBlockCount ?? 1);
  const circuitBlock = getCircuitBlockLayout(state.circuit.layout, blockCount);
  const duplicationCost = getCircuitCost(circuitBlock);
  const canDuplicate = circuitBlock.length > 0 && state.money >= duplicationCost;

  return (
    <>
      <div 
        className={`absolute top-0 left-0 h-full w-64 bg-game-card/90 backdrop-blur-md border-r border-game-text/10 transition-transform duration-300 z-10 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-game-text">
            {showBlockDiagram ? 'Circuit blocks' : 'Toolbox'}
          </h2>
          {showBlockDiagram ? (
            <div className="space-y-3">
              <button
                type="button"
                disabled={!canDuplicate}
                onClick={() => dispatch({ type: 'DUPLICATE_CIRCUIT' })}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-game-accent px-3 py-3 font-bold text-game-text transition-colors hover:bg-game-accent/80 disabled:cursor-not-allowed disabled:bg-game-primary disabled:text-game-text/40"
              >
                <Copy size={18} />
                Add circuit block
              </button>
              <p className="text-center text-sm text-game-text/60">
                {circuitBlock.length > 0 ? `Cost: $${duplicationCost}` : 'No circuit blocks to duplicate'}
              </p>
            </div>
          ) : (
            <GatePalette />
          )}
        </div>
      </div>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setOpen(!open)}
        className={`absolute top-1/2 -translate-y-1/2 z-20 bg-game-card border border-game-text/15 p-1 rounded-r-md transition-all duration-300 ${open ? 'left-64' : 'left-0'}`}
      >
        {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  );
};

