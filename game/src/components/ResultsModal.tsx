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
      <div className="bg-game-card border border-game-text/15 rounded-lg shadow-2xl p-6 w-full max-w-4xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-game-text">Simulation Results</h2>
          <button onClick={onClose} className="text-game-text/60 hover:text-game-text text-2xl">&times;</button>
        </div>

        <div className="bg-game-primary/60 p-4 rounded-md border border-game-text/15">
          <strong className="text-game-accent">Global Estimate:</strong> {state.lastSimulation.expectation.toFixed(5)}
        </div>

        <div className="h-96 w-full bg-game-primary rounded-md p-4 border border-game-text/10">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--game-text)" strokeOpacity={0.12} />
              <XAxis type="number" dataKey="x" name="Shot" stroke="var(--game-text)" strokeOpacity={0.6} label={{ value: 'Shot Number', position: 'insideBottom', offset: -10, fill: 'var(--game-text)' }} />
              <YAxis type="number" dataKey="y" name="State Value" stroke="var(--game-text)" strokeOpacity={0.6} label={{ value: 'Measured State', angle: -90, position: 'insideLeft', fill: 'var(--game-text)' }} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-game-primary p-3 border border-game-text/15 rounded shadow-lg">
                        <p className="text-game-text/80"><strong>Shot:</strong> {Math.round(data.id)}</p>
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
                fill="var(--game-accent)"
                onClick={(e: any) => setSelectedPoint(e?.payload || e)}
                className="cursor-pointer"
              >
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={selectedPoint?.id === entry.id ? 'var(--game-text)' : 'var(--game-accent)'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {selectedPoint && (
          <div className="bg-game-primary p-4 rounded-md border border-game-text/15">
            <h4 className="font-bold text-game-text mb-2">Selected Point Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-game-text/60">
              <div><strong className="text-game-text/80">Shot ID:</strong> {Math.round(selectedPoint.id)}</div>
              <div><strong className="text-game-text/80">Measured State:</strong> |{selectedPoint.state}⟩</div>
              <div><strong className="text-game-text/80">Total count for this state:</strong> {selectedPoint.originalCount}</div>
              <div><strong className="text-game-text/80">Metadata:</strong> {selectedPoint.metadata}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-game-accent hover:bg-game-accent/80 text-game-text rounded-md font-bold transition-colors"
          >
            Close & Continue Adjusting
          </button>
        </div>
      </div>
    </div>
  );
};

