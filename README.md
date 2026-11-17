# ECHO HEIST

_You are your own getaway crew._

## Play on a Mac

Double-click **index.html** in Finder. The checked-in **game.js** is the playable build. The game runs offline and the clock waits for your first move.

For a stable local browser address, run `npm start` in the project directory and open [the local arcade](http://127.0.0.1:8417). This command uses Python 3’s static file server. Saved medals and the last selected contract belong to the browser and address you play from.

## Your first job

Walk onto the purple pad. When the door opens, press **R**. Move again and your Echo will repeat the route and hold the pad. Collect the gold core and reach the green extraction pad before the clock runs out.

| Control                   | Action                                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| WASD or arrow keys        | Move. Two directions together move diagonally.                           |
| Click or tap a floor tile | Walk there. Clicking loot, intel or a relay also interacts upon arrival. |
| E                         | Collect nearby loot or intel, or send a relay pulse.                     |
| R                         | Record this take as an Echo and rewind.                                  |
| Z                         | Remove the newest Echo and return the remaining crew to the start.       |
| T                         | Retry this loop with the recorded crew.                                  |
| X                         | Restart the whole contract. Saved results survive.                       |
| Space                     | Start a fresh loop while standing still.                                 |
| P or Escape               | Pause or resume. Changing tabs or losing focus pauses an active run.     |
| H / M                     | Open the controls / toggle sound.                                        |

The timeline shows movement as low bars and time spent at a device as tall bars. The dotted extension shows a hold after a tape ends. **Paths** shows where the crew walked during its original recordings. All five contracts are available from the start.

## The rules of time

- The simulation runs at 60 ticks per second. A full tape holds 1,800 input commands. Every actor starts at the same spawn and plays the command for the current tick.
- Commands move bodies through the current world. Echoes can pass through other runners. Walls, crates, machinery and closed doors stop everyone. If a door opens at a different time, the same command can produce a different position. Echoes resume from that position.
- Each tick moves the crew against the previous door state, updates the sentry, evaluates switches and relay pulses, resolves live-player pickups and extraction, then advances the clock.
- An Echo stays where its tape ends. Each uncaught runner can hold a plate, operate a relay or ring the floor buzzer. A door stays open while a runner overlaps its threshold. A relay pulse lasts 150 ticks.
- A sentry patrols on the simulation clock. Its visible detection area respects walls and closed gates. The buzzer draws it to its intercom and suspends scanning while occupied. A caught Echo stops operating devices. A caught live runner can retry, undo or keep the tape.
- Only the live runner takes valuables and extracts them. Rewinding restores the loot, actors, security, clock and mechanisms. Previously recorded input tapes survive. Pause freezes the simulation. Visual effects and synthesized music use separate clocks.
- The loop counter identifies the current crew timeline. The result counts takes used, including discarded active retries. Total completion time counts simulated seconds across all takes. Planning before a take and pausing cost no time.

## Mastery

Contract Select shows your fastest clear for each job and the selected contract’s Bronze, Silver and Gold targets. Match or beat a target to earn that medal. A slower escape still counts as a clear. Times include all active loops. Equal times favor fewer loops, then collected bonus intel. Existing saved runs receive the medal for their recorded time.

## Build and verify

Use Node.js 22.6 or later with npm. Run the following in this folder.

```sh
npm ci
npm test
npm run build
```

The TypeScript build uses esbuild to produce a classic browser script. The runtime uses a local Canvas 2D pixel-rendering library, a fixed-step integer simulation, and Web Audio synthesis. Art, sound and the soundtrack are generated locally. Reduced-motion preferences suppress rewind flashes and celebratory particles.

| Source                                       | Responsibility                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| src/sim.ts                                   | Fixed-step clock, input tapes, crew, collision, guards and security mechanisms           |
| src/levels.ts                                | Authored geometry, devices, targets and scoring budgets for five facilities              |
| src/input.ts                                 | Pointer routing into the same simulation commands as keyboard input                      |
| src/render.ts, src/pixels.ts, src/skyline.ts | Pixel-art facility feed, characters, effects and skyline                                 |
| src/audio.ts                                 | Synthesized effects and ambient sequencer                                                |
| src/ui.ts, src/main.ts                       | Timeline, input handling, HUD, menus and browser integration                             |
| src/save.ts                                  | Versioned local progress and medal ranking                                               |
| tests/                                       | Replay, reset, pause, door divergence, distraction, pulse timing, saving and full heists |

The suite includes a four-person finale, gold runs for every contract and identical state comparisons under different render frame schedules.
