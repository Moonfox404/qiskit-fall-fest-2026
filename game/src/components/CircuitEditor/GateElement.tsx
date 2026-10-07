import { GAME_CONSTANTS } from '../../config/constants';

export const GateElement = ({
  name,
  onSelect,
  isSelected = false,
}: {
  name: string;
  onSelect?: () => void;
  isSelected?: boolean;
}) => {
  const gateStyle = GAME_CONSTANTS.GATE_STYLES[name as keyof typeof GAME_CONSTANTS.GATE_STYLES] || 'bg-game-accent text-game-text';

  return (
    <div className="relative z-10 h-12 w-12 group">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select ${name} gate`}
        aria-pressed={isSelected}
        className={`flex h-12 w-12 items-center justify-center ${gateStyle} font-bold rounded-md shadow-md cursor-pointer transition-all ${isSelected ? 'ring-2 ring-game-text' : 'hover:ring-2 hover:ring-game-text/50'}`}
      >
        {name}
      </button>
    </div>
  );
};
