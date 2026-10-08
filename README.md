# Q-tastrophe
Prompt: Quantum error game -> error mitigation track

Approach/solution -> puzzle game where the player attempts to mitigate the errors in various circuits using known/provided algorithms

React + Tailwind game that teaches quantum error mitigation through interactive circuit editing.

Running the game:
`docker compose up`

Game concept
- The player is presented with a sequence of levels, each containing a different quantum circuit challenge.
- Each level gives the player a backend-supplied starting circuit and a goal: improve the circuit’s behavior using error mitigation strategies by adding, removing, or reordering gates.
- The player must balance resource management with circuit optimization to complete each level successfully.

Gameplay loop
- Each level loads a new backend circuit into the main working area.
- The player can drag and drop gate elements from the sidebar into the circuit.
- Gate insertion costs money.
- Running the circuit costs money based on the number of shots selected.
- Time is tracked via an in-game clock.
- Each time the player enters a new level or runs the circuit, time increases by a certain amount.
- During each level, the player may experiment freely with modifications and reruns as long as they do not:
  - run out of money
  - exceed the time limit

Resource systems
- Two currencies/resources:
  - Money: used to purchase gates and pay for circuit execution.
  - Time: used as a strategic constraint that pressures the player to optimize efficiently.
- Both resources is visible in the top bar at all times.

Backend integration
- Circuits are fetched from the backend and rendered in the center panel.
- Results are displayed in a pop-up modal
- Results will be shown in an interactive scatter plot
- Clicking individual points will reveal details such as:
  - trial #
  - measured value
  - associated metadata
- Before final submission, the player will be able to review the current results from their circuit modifications.

Submission and grading
- Player's results will be evaluated in the back-end based on accuracy and uncertainty 
- If the player passes the level:
  - additional money will be rewarded
  - advanced to the next level
- If the player fails:
  - allow retry attempts within the remaining time and money constraints
- The player can continue adjusting and re-running the circuit as long as they still have resources.