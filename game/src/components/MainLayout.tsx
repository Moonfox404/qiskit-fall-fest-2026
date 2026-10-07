import { useState } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { CircuitWorkspace } from './CircuitEditor/CircuitWorkspace';
import { ControlPanel } from './ControlPanel';
import { GameOverScreen } from './GameOverScreen';
import { VictoryScreen } from './VictoryScreen';
import { useGameState } from '../context/GameStateContext';
import { GateElement } from './CircuitEditor/GateElement';

export const MainLayout = () => {
  const { state, dispatch } = useGameState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeGate, setActiveGate] = useState<any>(null);

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
        const gateData = active.data.current;

        if (gateData) {
          dispatch({
            type: 'ADD_GATE',
            payload: {
              gate: { name: gateData.name, qubits: [qubitIndex] },
              cost: gateData.cost,
              index: colIndex
            }
          });
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
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 flex justify-center items-center p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <CircuitWorkspace />
          </main>
          <div className="absolute bottom-4 right-4 z-10">
            <ControlPanel />
          </div>
        </div>
      </div>
      
      <DragOverlay dropAnimation={null} style={{ zIndex: 9999 }}>
        {activeGate ? (
          <div className="scale-110 cursor-grabbing shadow-xl">
            <GateElement name={activeGate.name} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

