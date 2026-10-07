import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GatePalette } from './CircuitEditor/GatePalette';

export const Sidebar = ({ open, setOpen }: { open: boolean, setOpen: (o: boolean) => void }) => {
  return (
    <>
      <div 
        className={`absolute top-0 left-0 h-full w-64 bg-game-card/90 backdrop-blur-md border-r border-gray-800 transition-transform duration-300 z-10 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <h2 className="text-xl font-bold mb-4 text-gray-200">Toolbox</h2>
          <GatePalette />
        </div>
      </div>
      
      {/* Toggle Button */}
      <button 
        onClick={() => setOpen(!open)}
        className={`absolute top-1/2 -translate-y-1/2 z-20 bg-game-card border border-gray-700 p-1 rounded-r-md transition-all duration-300 ${open ? 'left-64' : 'left-0'}`}
      >
        {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  );
};

