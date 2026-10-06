
import { useDraggable } from '@dnd-kit/core';

const AVAILABLE_GATES = [
  { name: 'X', cost: 10, color: '#4ade80' },
  { name: 'Y', cost: 15, color: '#60a5fa' },
  { name: 'Z', cost: 10, color: '#f87171' },
  { name: 'H', cost: 50, color: '#c084fc' },
];

const DraggableGate = ({ gate }: { gate: any }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${gate.name}`,
    data: gate,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px',
        background: gate.color,
        color: '#fff',
        textAlign: 'center',
        cursor: 'grab',
        borderRadius: '4px',
        fontWeight: 'bold',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {gate.name}
      <div style={{ fontSize: '0.8em', fontWeight: 'normal' }}>${gate.cost}</div>
    </div>
  );
};

export const GatePalette = () => {
  return (
    <div style={{ width: '150px', border: '1px solid #ddd', padding: '15px', background: '#f9f9f9', borderRadius: '5px' }}>
      <h3 style={{ marginTop: 0 }}>Gates</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {AVAILABLE_GATES.map((gate) => (
          <DraggableGate key={gate.name} gate={gate} />
        ))}
      </div>
    </div>
  );
};
