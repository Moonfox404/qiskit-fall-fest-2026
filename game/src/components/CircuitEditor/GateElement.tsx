import { GAME_CONSTANTS } from '../../config/constants';

export const GateElement = ({ name, onRemove }: { name: string, onRemove?: () => void }) => {
  const color = GAME_CONSTANTS.GATE_COLORS[name as keyof typeof GAME_CONSTANTS.GATE_COLORS] || '#94a3b8';

  return (
    <div
      onClick={onRemove}
      className={`w-12 h-12 flex items-center justify-center text-white font-bold rounded-md shadow-md cursor-pointer hover:ring-2 hover:ring-white/50 transition-all z-10 relative group`}
      style={{ backgroundColor: color }}
    >
      {name}
      {onRemove && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          ×
        </div>
      )}
    </div>
  );
};
