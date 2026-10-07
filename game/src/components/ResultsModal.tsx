import { useState, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ResultsModal = ({ onClose }: { onClose: () => void }) => {
  const { state } = useGameState();
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  const scatterData = useMemo(() => {
    if (!state.lastSimulation) return [];
    const data = [];
    let shotCounter = 1;
    for (const [measuredState, count] of Object.entries(state.lastSimulation.counts)) {
      // Create a few representative points for the scatter plot to avoid rendering 8000 points
      const pointsToRender = Math.min(count, 50); // Cap points per state for performance
      for (let i = 0; i < pointsToRender; i++) {
        // Add some jitter for visualization
        const jitterX = shotCounter + (Math.random() * 0.8 - 0.4);
        const jitterY = parseInt(measuredState, 2) + (Math.random() * 0.2 - 0.1);
        data.push({
          id: shotCounter,
          x: jitterX,
          y: jitterY,
          state: measuredState,
          originalCount: count,
          metadata: `Probability amplitude proxy: ${(count / Object.values(state.lastSimulation.counts).reduce((a,b)=>a+b,0)).toFixed(3)}`
        });
        shotCounter++;
      }
    }
    return data;
  }, [state.lastSimulation]);

  if (!state.lastSimulation) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-4">
      <div className="bg-game-card border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-4xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-200">Simulation Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-md border border-gray-700">
          <strong className="text-game-accent">Global Estimate:</strong> {state.lastSimulation.estimate.toFixed(5)}
        </div>

        <div className="h-96 w-full bg-gray-900 rounded-md p-4 border border-gray-800">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" dataKey="x" name="Shot" stroke="#9ca3af" label={{ value: 'Shot Number', position: 'insideBottom', offset: -10, fill: '#9ca3af' }} />
              <YAxis type="number" dataKey="y" name="State Value" stroke="#9ca3af" label={{ value: 'Measured State', angle: -90, position: 'insideLeft', fill: '#9ca3af' }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-game-primary p-3 border border-gray-700 rounded shadow-lg">
                        <p className="text-gray-300"><strong>Shot:</strong> {Math.round(data.id)}</p>
                        <p className="text-game-accent"><strong>State:</strong> |{data.state}⟩</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="Measurements" 
                data={scatterData} 
                fill="#4589FF"
                onClick={(e: any) => setSelectedPoint(e?.payload || e)}
                className="cursor-pointer"
              >
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={selectedPoint?.id === entry.id ? '#f87171' : '#4589FF'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {selectedPoint && (
          <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
            <h4 className="font-bold text-gray-200 mb-2">Selected Point Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <div><strong className="text-gray-300">Shot ID:</strong> {Math.round(selectedPoint.id)}</div>
              <div><strong className="text-gray-300">Measured State:</strong> |{selectedPoint.state}⟩</div>
              <div><strong className="text-gray-300">Total count for this state:</strong> {selectedPoint.originalCount}</div>
              <div><strong className="text-gray-300">Metadata:</strong> {selectedPoint.metadata}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md font-bold transition-colors"
          >
            Close & Continue Adjusting
          </button>
        </div>
      </div>
    </div>
  );
};

