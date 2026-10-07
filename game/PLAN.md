# Error Mitigation Quantum Game Plan

## 1. Overview
A React-based web game where players apply quantum error mitigation strategies to a circuit. Players must balance two resources: **Time** and **Money**, while attempting to get as close to the ideal expectation value as possible without knowing what the ideal value is.

## 2. Core Mechanics & Resources
* **Money**: Spent by adding gates to the circuit and by running simulations (cost scales with the number of `shots`).
* **Time**: The in-game clock advances whenever a player starts a new level or hits the "Run" button to take measurements.
* **Score**: Calculated locally in the game components at the end of each level. It rewards high fidelity and low KL divergence, while penalizing excessive time and money spent.

## 3. UI Layout & Wireframe Mapping
Based on standard quantum circuit editors and game HUDs:
* **Top Bar (HUD)**: Displays current Level, Time, Money, and cumulative Score.
* **Sidebar (Gate Palette)**: Lists available gates (e.g., X, Y, Z, H, CX, etc.) along with their financial cost.
* **Main Canvas (Circuit Editor)**: The grid where players place gates on qubit wires to build/modify their circuit.
* **Control Panel**: 
    * Input field for `shots` (calculates cost dynamically: `shots * cost_per_shot`).
    * **"Run" Button**: Executes the simulation.
    * **"Submit" Button**: Completes the level and evaluates the final circuit.
* **Results View**: A chart (histogram) displaying the `counts` and the final `estimate` returned from the simulation.

## 4. API & Backend Integration
The frontend will communicate with the provided FastAPI backend.

### A. Simulation (`POST /simulation`)
* **Trigger**: When the player clicks "Run".
* **Payload**: `CircuitLayout` (current state of the circuit), `shots` (user input), and `noise` (level-specific configuration).
* **Game State Updates**: 
  * Deduct money (`shots * cost_per_shot`).
  * Increment in-game Time.
  * Update Results View with `counts` (for histogram) and `estimate`.

### B. Evaluation (`POST /evaluation`)
* **Trigger**: When the player clicks "Submit" to end the level.
* **Payload**: `CircuitLayout` (final circuit) and `expectation` (the last `estimate` the player generated, or an explicit value they enter).
* **Game State Updates**:
  * Receive `EvaluationResult` containing `fidelity`, `kl_divergence`, and `total_variation_distance`.
  * Calculate the final score for the level using a game-logic formula.

## 5. React Component Architecture

```text
src/
├── components/
│   ├── GameHUD.tsx          # Top bar with Time, Money, Score
│   ├── CircuitEditor/       # Drag-and-drop circuit interface
│   │   ├── Wire.tsx
│   │   ├── GateElement.tsx
│   │   └── GatePalette.tsx  # Toolbox of available gates
│   ├── ControlPanel.tsx     # Shots input, Run/Submit buttons
│   └── ResultsChart.tsx     # Histogram visualizing simulation counts
├── context/
│   └── GameStateContext.tsx # Central store for Money, Time, Circuit, Level
├── services/
│   └── api.ts               # Axios/Fetch wrappers for /simulation and /evaluation
└── App.tsx                  # Main game loop and view router
```

## 6. Recommended Tech Stack
* **Framework**: React (via Vite) with TypeScript for type-safety (matching backend Pydantic models).
* **State Management**: Zustand or React Context API.
* **Styling**: Tailwind CSS (easy mapping to Figma designs).
* **Data Visualization**: Recharts or Chart.js for the measurement counts histogram.
* **Drag-and-Drop**: `@hello-pangea/dnd` or `dnd-kit` for the circuit editor.

## 7. Step-by-Step Implementation Plan
1. **Initialize Project**: `npm create vite@latest . -- --template react-ts` inside the `game/` folder.
2. **Define Types**: Create TypeScript interfaces matching `CircuitLayout`, `Gate`, `SimulationResult`, and `EvaluationResult`.
3. **Build Basic Layout**: Scaffold the HUD, Circuit Canvas, and Sidebar placeholders.
4. **Implement State**: Create the game context to manage Time and Money tracking.
5. **Circuit Editor**: Implement adding/removing gates from the layout and dynamically updating the money state based on costs.
6. **API Integration**: Wire up the "Run" button to fetch data from `http://localhost:8000/simulation`.
7. **Scoring Logic**: Implement the end-of-level evaluation calculation combining API metrics and remaining resources.

