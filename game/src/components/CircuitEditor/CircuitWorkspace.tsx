import { Wire } from './Wire';

export const CircuitWorkspace = () => {
  return (
    <div className="bg-game-card/80 border border-gray-700 p-8 rounded-lg shadow-2xl backdrop-blur-sm min-w-[600px] min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">Circuit Layout</h2>
      <Wire />
    </div>
  );
};

