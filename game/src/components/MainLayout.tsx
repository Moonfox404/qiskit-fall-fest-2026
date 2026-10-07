import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { CircuitWorkspace } from './CircuitEditor/CircuitWorkspace';
import { ControlPanel } from './ControlPanel';
import { GameOverScreen } from './GameOverScreen';
import { VictoryScreen } from './VictoryScreen';
import { getCircuitBlockLayout, getCircuitColumnInsertionIndex, getCircuitCost, useGameState, type Gate } from '../context/GameStateContext';
import { GateElement } from './CircuitEditor/GateElement';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { GAME_CONSTANTS } from '../config/constants';

export const MainLayout = () => {
  const { state, dispatch } = useGameState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeGate, setActiveGate] = useState<any>(null);
  const [showBlockDiagram, setShowBlockDiagram] = useState(false);
  const [selectedGateIndex, setSelectedGateIndex] = useState<number | null>(null);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [clipboardGate, setClipboardGate] = useState<Gate | null>(null);
  const [clipboardBlock, setClipboardBlock] = useState<Gate[] | null>(null);
  const selectedGate = selectedGateIndex === null ? undefined : state.circuit.layout[selectedGateIndex];
  const circuitBlockCount = Math.max(0, state.circuitBlockCount ?? 1);
  const selectedBlock = selectedBlockIndex === null
    ? undefined
    : getCircuitBlockLayout(state.circuit.layout, circuitBlockCount, selectedBlockIndex);
  const clipboardCost = clipboardGate
    ? GAME_CONSTANTS.GATE_COSTS[clipboardGate.name as keyof typeof GAME_CONSTANTS.GATE_COSTS] ?? 0
    : 0;
  const clipboardBlockCost = clipboardBlock ? getCircuitCost(clipboardBlock) : 0;
  const canPasteGate = clipboardGate !== null && state.money >= clipboardCost;
  const canPasteBlock = clipboardBlock !== null && clipboardBlock.length > 0 && state.money >= clipboardBlockCost;

  const copySelectedGate = () => {
    if (selectedGate) {
      setClipboardGate({ ...selectedGate, qubits: [...selectedGate.qubits] });
    }
  };

  const pasteGate = () => {
    if (!clipboardGate || !canPasteGate) return;
    dispatch({
      type: 'ADD_GATE',
      payload: {
        gate: { ...clipboardGate, qubits: [...clipboardGate.qubits] },
        cost: clipboardCost,
      },
    });
  };

  const deleteCircuitBlock = (index: number) => {
    if (index <= 0 || index >= circuitBlockCount) return;
    dispatch({ type: 'REMOVE_CIRCUIT_BLOCK', payload: { index } });
    setSelectedBlockIndex((selectedIndex) => {
      if (selectedIndex === null) return null;
      if (selectedIndex === index) return Math.max(0, index - 1);
      return selectedIndex > index ? selectedIndex - 1 : selectedIndex;
    });
  };

  const pasteBlock = () => {
    if (!clipboardBlock || !canPasteBlock) return;
    dispatch({
      type: 'DUPLICATE_CIRCUIT',
      payload: { gates: clipboardBlock.map((gate) => ({ ...gate, qubits: [...gate.qubits] })) },
    });
    setSelectedBlockIndex(circuitBlockCount);
  };

  useEffect(() => {
    const handleCopyPaste = (event: KeyboardEvent) => {
      const target = event.target;
      const isFormTarget = target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (isFormTarget) return;

      const hasModifier = event.ctrlKey || event.metaKey;
      if (showBlockDiagram) {
        if (hasModifier && event.key.toLowerCase() === 'c' && selectedBlock?.length) {
          event.preventDefault();
          setClipboardBlock(selectedBlock.map((gate) => ({ ...gate, qubits: [...gate.qubits] })));
        } else if (hasModifier && event.key.toLowerCase() === 'v' && canPasteBlock) {
          event.preventDefault();
          pasteBlock();
        } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedBlockIndex !== null) {
          event.preventDefault();
          deleteCircuitBlock(selectedBlockIndex);
        }
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedGate) {
        event.preventDefault();
        dispatch({ type: 'REMOVE_GATE', payload: { index: selectedGateIndex! } });
        setSelectedGateIndex(null);
        return;
      }

      if (!hasModifier) return;

      if (event.key.toLowerCase() === 'c' && selectedGate) {
        event.preventDefault();
        setClipboardGate({ ...selectedGate, qubits: [...selectedGate.qubits] });
      } else if (event.key.toLowerCase() === 'v' && canPasteGate && clipboardGate) {
        event.preventDefault();
        dispatch({
          type: 'ADD_GATE',
          payload: {
            gate: { ...clipboardGate, qubits: [...clipboardGate.qubits] },
            cost: clipboardCost,
          },
        });
      }
    };

    window.addEventListener('keydown', handleCopyPaste);
    return () => window.removeEventListener('keydown', handleCopyPaste);
  }, [canPasteBlock, canPasteGate, clipboardBlock, clipboardCost, clipboardGate, dispatch, deleteCircuitBlock, pasteBlock, selectedBlock, selectedBlockIndex, selectedGate, showBlockDiagram]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveGate(e.active.data.current);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveGate(null);
    const { active, over } = e;
    
    if (over && over.id) {
      // Decode the id format: q-{qubitIndex}-c-{colIndex}
      const match = String(over.id).match(/q-(\d+)-c-(\d+)/);
      if (match) {
        const qubitIndex = parseInt(match[1], 10);
        const colIndex = parseInt(match[2], 10);
        const insertionIndex = getCircuitColumnInsertionIndex(state.circuit.layout, colIndex);
        const gateData = active.data.current;

        if (gateData) {
          if (gateData.type === 'circuit-gate' && typeof gateData.sourceIndex === 'number') {
            dispatch({
              type: 'MOVE_GATE',
              payload: {
                fromIndex: gateData.sourceIndex,
                  toIndex: insertionIndex,
                fromQubitIndex: gateData.sourceQubitIndex,
                toQubitIndex: qubitIndex,
                toColumnIndex: colIndex,
              },
            });
          } else {
            dispatch({
              type: 'ADD_GATE',
              payload: {
                gate: { name: gateData.name, qubits: [qubitIndex] },
                cost: gateData.cost,
                index: insertionIndex,
                column: colIndex,
              }
            });
          }
          setSelectedGateIndex(null);
        }
      }
    }
  };

  if (state.victory) return <VictoryScreen />;
  if (state.gameOver) return <GameOverScreen />;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen w-screen flex flex-col bg-game-primary text-game-text overflow-hidden relative">
        <TopBar />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} showBlockDiagram={showBlockDiagram} />
          <main className={`flex-1 min-w-0 flex items-stretch p-4 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <CircuitWorkspace
              showBlockDiagram={showBlockDiagram}
              selectedBlockIndex={selectedBlockIndex}
              onSelectBlock={setSelectedBlockIndex}
              onDeleteBlock={deleteCircuitBlock}
              selectedGateIndex={selectedGateIndex}
              canCopyGate={selectedGate !== undefined}
              canPasteGate={canPasteGate}
              onSelectGate={setSelectedGateIndex}
              onCopyGate={copySelectedGate}
              onPasteGate={pasteGate}
            />
          </main>
          <div className="absolute bottom-4 right-4 z-10 flex flex-col items-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedGateIndex(null);
                setShowBlockDiagram((showing) => {
                  setSelectedBlockIndex(showing ? null : 0);
                  return !showing;
                });
              }}
              aria-pressed={showBlockDiagram}
              className="flex items-center gap-2 rounded-md border border-game-text/15 bg-game-card/95 px-4 py-3 font-semibold text-game-text shadow-xl backdrop-blur-sm transition-colors hover:bg-game-primary"
            >
              {showBlockDiagram ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
              {showBlockDiagram ? 'View individual gates' : 'View block diagram'}
            </button>
            <ControlPanel />
          </div>
        </div>
      </div>
      
      <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={null} style={{ zIndex: 9999 }}>
        {activeGate?.type === 'circuit-gate' ? (
          <div className="cursor-grabbing shadow-xl">
            <GateElement name={activeGate.name} />
          </div>
        ) : activeGate?.type === 'palette-gate' ? (
          <div className={`cursor-grabbing rounded-md p-3 text-center font-bold shadow-xl ${GAME_CONSTANTS.GATE_STYLES[activeGate.name as keyof typeof GAME_CONSTANTS.GATE_STYLES]}`}>
            <div className="text-xl">{activeGate.name}</div>
            <div className="text-sm font-normal opacity-80">${activeGate.cost}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

