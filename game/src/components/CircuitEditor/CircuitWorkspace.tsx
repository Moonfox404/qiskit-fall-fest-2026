import React, { useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { GatePalette } from './GatePalette';
import { Wire } from './Wire';
import { useGameState } from '../../context/GameStateContext';
import { GateElement } from './GateElement';

export const CircuitWorkspace = () => {
  const { dispatch } = useGameState();
  const [activeGate, setActiveGate] = useState<any>(null);

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

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '20px' }}>
        <GatePalette />
        <div style={{ flex: 1, border: '1px dashed #ccc', padding: '20px', overflowX: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Circuit Editor</h2>
          <Wire />
        </div>
      </div>
      
      {/* DragOverlay shows the gate floating while being dragged */}
      <DragOverlay dropAnimation={null}>
        {activeGate ? (
          <div style={{ transform: 'scale(1.1)', cursor: 'grabbing' }}>
            <GateElement name={activeGate.name} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

