import { useEffect, useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { CircuitWorkspace } from './CircuitEditor/CircuitWorkspace';
import { ControlPanel } from './ControlPanel';
import { GameOverScreen } from './GameOverScreen';
import { VictoryScreen } from './VictoryScreen';
import { getCircuitBlockLayout, getCircuitBoundaryColumns, getCircuitColumnInsertionIndex, getCircuitColumns, getCircuitCost, useGameState, type Gate } from '../context/GameStateContext';
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
  const [pendingGate, setPendingGate] = useState<{ name: string; cost: number; index?: number; column?: number; qubits: number[] } | null>(null);
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
        gate: { ...clipboardGate, qubits: [...clipboardGate.qubits], column: undefined, isLevelGate: false },
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
        pasteGate();
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
    const columns = getCircuitColumns(state.circuit.layout);
    const boundaryColumns = getCircuitBoundaryColumns(state.circuit.layout);
    
    if (over && over.id) {
      // Decode the id format: q-{qubitIndex}-c-{colIndex}
      const match = String(over.id).match(/q-(\d+)-c-(\d+)/);
      if (match) {
        const qubitIndex = parseInt(match[1], 10);
        const colIndex = parseInt(match[2], 10);
        const insertionIndex = getCircuitColumnInsertionIndex(state.circuit.layout, colIndex);
        const gateData = active.data.current;

        if (gateData) {
          if (
            boundaryColumns.first !== undefined &&
            boundaryColumns.last !== undefined &&
            (colIndex <= boundaryColumns.first || colIndex > boundaryColumns.last)
          ) return;
          if (gateData.type === 'palette-gate' && gateData.name === 'P') return;
          if (gateData.type === 'circuit-gate' && typeof gateData.sourceIndex === 'number') {
            if (gateData.isMultiQubit && colIndex >= columns.length) return;
            dispatch({
              type: 'MOVE_GATE',
              payload: {
                fromIndex: gateData.sourceIndex,
                toIndex: insertionIndex,
                fromQubitIndex: gateData.sourceQubitIndex,
                toQubitIndex: gateData.isMultiQubit ? gateData.sourceQubitIndex : qubitIndex,
                toColumnIndex: colIndex,
              },
            });
          } else {
            const requiredQubits = GAME_CONSTANTS.GATE_QUBIT_COUNTS[gateData.name as keyof typeof GAME_CONSTANTS.GATE_QUBIT_COUNTS] ?? 1;
            if (requiredQubits > 1) {
              setPendingGate({
                name: gateData.name,
                cost: gateData.cost,
                index: insertionIndex,
                column: colIndex,
                qubits: [qubitIndex],
              });
            } else {
              dispatch({
                type: 'ADD_GATE',
                payload: {
                      gate: { name: gateData.name, qubits: [qubitIndex], twirl: false },
                  cost: gateData.cost,
                  index: insertionIndex,
                  column: colIndex,
                }
              });
            }
          }
          setSelectedGateIndex(null);
        }
      }
    }

    const gateTarget = over?.data.current;
    const draggedGate = active.data.current;
    if (
      gateTarget?.type === 'gate-target' &&
      gateTarget.gateIndex !== undefined &&
      draggedGate?.type === 'palette-gate' &&
      draggedGate.name === 'P'
    ) {
      dispatch({
        type: 'TWIRL_GATE',
        payload: { index: gateTarget.gateIndex, cost: draggedGate.cost },
      });
      setSelectedGateIndex(null);
    }
  };

  if (state.victory) return <VictoryScreen />;
  if (state.gameOver) return <GameOverScreen />;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={(args) => {
        const collisions = pointerWithin(args);
        if (args.active.data.current?.type !== 'palette-gate' || args.active.data.current.name !== 'P') return collisions;
        const targetCollision = collisions.find(({ id }) =>
          args.droppableContainers.find((container) => container.id === id)?.data.current?.type === 'gate-target',
        );
        return targetCollision ? [targetCollision] : collisions;
      }}
      modifiers={[({ active, transform }) => active?.data.current?.isMultiQubit ? { ...transform, y: 0 } : transform]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

      {pendingGate && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPendingGate(null);
        }}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-qubit-dialog-title"
            className="w-full max-w-md rounded-lg border border-game-text/20 bg-game-card p-6 text-game-text shadow-2xl"
          >
            <h2 id="gate-qubit-dialog-title" className="text-xl font-bold">Choose {pendingGate.name} inputs</h2>
            <p className="mt-2 text-sm text-game-text/70">Select {GAME_CONSTANTS.GATE_QUBIT_COUNTS[pendingGate.name as keyof typeof GAME_CONSTANTS.GATE_QUBIT_COUNTS]} qubits in order: first is the control, second is the target.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {Array.from({ length: state.circuit.num_qubits }, (_, qubitIndex) => {
                const isSelected = pendingGate.qubits.includes(qubitIndex);
                const maximumInputs = GAME_CONSTANTS.GATE_QUBIT_COUNTS[pendingGate.name as keyof typeof GAME_CONSTANTS.GATE_QUBIT_COUNTS];
                return (
                  <label key={qubitIndex} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors ${isSelected ? 'border-game-accent bg-game-accent/20' : 'border-game-text/15 bg-game-primary hover:bg-game-primary/70'}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!isSelected && pendingGate.qubits.length >= maximumInputs}
                      onChange={() => setPendingGate((current) => {
                        if (!current) return current;
                        return {
                          ...current,
                          qubits: isSelected
                            ? current.qubits.filter((selectedQubit) => selectedQubit !== qubitIndex)
                            : [...current.qubits, qubitIndex],
                        };
                      })}
                      className="h-4 w-4 accent-game-accent"
                    />
                    <span className="font-mono">q[{qubitIndex}]</span>
                    {isSelected && <span className="ml-auto text-xs text-game-text/60">{pendingGate.qubits.indexOf(qubitIndex) === 0 ? 'Control' : 'Target'}</span>}
                  </label>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setPendingGate(null)} className="rounded-md border border-game-text/20 px-4 py-2 hover:bg-game-primary">Cancel</button>
              <button
                type="button"
                disabled={pendingGate.qubits.length !== GAME_CONSTANTS.GATE_QUBIT_COUNTS[pendingGate.name as keyof typeof GAME_CONSTANTS.GATE_QUBIT_COUNTS]}
                onClick={() => {
                  dispatch({
                    type: 'ADD_GATE',
                    payload: {
                      gate: { name: pendingGate.name, qubits: pendingGate.qubits, twirl: false },
                      cost: pendingGate.cost,
                      index: pendingGate.index,
                      column: pendingGate.column,
                    },
                  });
                  setPendingGate(null);
                }}
                className="rounded-md bg-game-accent px-4 py-2 font-semibold text-game-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add gate
              </button>
            </div>
          </section>
        </div>
      )}
      
      <DragOverlay
        modifiers={[({ transform, activatorEvent, activeNodeRect, overlayNodeRect }) => {
          if (!(activatorEvent instanceof MouseEvent) || !activeNodeRect || !overlayNodeRect) return transform;
          return {
            ...transform,
            x: transform.x + activatorEvent.clientX - activeNodeRect.left - overlayNodeRect.width / 2,
            y: transform.y + activatorEvent.clientY - activeNodeRect.top - overlayNodeRect.height / 2,
          };
        }]}
        dropAnimation={null}
        style={{ zIndex: 9999 }}
      >
        {activeGate?.type === 'circuit-gate' ? (
          <div className="h-12 w-12 cursor-grabbing">
            <GateElement name={activeGate.name} />
          </div>
        ) : activeGate?.type === 'palette-gate' ? (
          <div className="h-12 w-12 cursor-grabbing">
            <GateElement name={activeGate.name} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

