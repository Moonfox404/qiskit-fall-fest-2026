import { useDraggable } from '@dnd-kit/core';
import { GAME_CONSTANTS } from '../../config/constants';

const DraggableGate = ({ name, cost, color }: { name: string, cost: number, color: string }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${name}`,
    data: { name, cost, color },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 text-white text-center cursor-grab rounded-md font-bold shadow-md hover:brightness-110 transition-all ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      style={{ backgroundColor: color, touchAction: 'none' }}
    >
      <div className="text-xl">{name}</div>
      <div className="text-sm font-normal opacity-80">${cost}</div>
    </div>
  );
};

export const GatePalette = () => {
  const gates = Object.entries(GAME_CONSTANTS.GATE_COSTS).map(([name, cost]) => ({
    name,
    cost,
    color: GAME_CONSTANTS.GATE_COLORS[name as keyof typeof GAME_CONSTANTS.GATE_COLORS]
  }));

  return (
    <div className="flex flex-col gap-3">
      {gates.map((gate) => (
        <DraggableGate key={gate.name} {...gate} />
      ))}
    </div>
  );
};
