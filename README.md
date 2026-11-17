# ECHO HEIST

_You are your own getaway crew._

## Play Echo Heist

All seven completed contracts are available in Contract Select. In **06 The Lockdown**, stealing the core opens a new route for a recorded Echo. In **07 The Window**, time the theft between your Echo crossing a shutter and stamping a relay. [Play Echo Heist](https://deanlefor.com/echo-heist/).

## Play on a Mac

Double-click **index.html** in Finder. The checked-in **game.js** is the playable build. The game runs offline and the clock waits for your first move.

For a stable local browser address, run `npm start` in the project directory and open [the local arcade](http://127.0.0.1:8417). This command uses Python 3’s static file server. Saved medals and the last selected contract belong to the browser and address you play from.

## Your first job

Walk onto the purple pad. When the door opens, press **R**. Move again and your Echo will repeat the route and hold the pad. Collect the gold core and reach the green extraction pad before the clock runs out.

| Control                   | Action                                                                   |
| ------------------------- | ------------------------------------------------------------------------ |
| WASD or arrow keys        | Move. Two directions together move diagonally.                           |
| Click or tap a floor tile | Walk there. Click devices to interact. At the Midnight Postmark, click to approach, then click again to steal. |
| E                         | Collect nearby loot or intel, or send a relay pulse.                     |
| R                         | Record this take as an Echo and rewind.                                  |
| Z                         | Remove the newest Echo and return the remaining crew to the start.       |
| T                         | Retry this loop with the recorded crew.                                  |
| X                         | Restart the whole contract. Saved results survive.                       |
| Space                     | Start a fresh loop while standing still.                                 |
| P or Escape               | Pause or resume. Changing tabs or losing focus pauses an active run.     |
| H / M                     | Open the controls / toggle sound.                                        |

The timeline shows movement commands (including pushing against a door) as low bars and time spent at a device as tall bars. The dotted extension shows a hold after a tape ends. **Paths** shows where the crew walked during its original recordings. A gold mark identifies a recorded emergency stamp. All seven contracts are available from the start.

## The rules of time

- The simulation runs at 60 ticks per second. A full tape holds 1,800 input commands. Every actor starts at the same spawn and plays the command for the current tick.
- Commands move bodies through the current world. Echoes can pass through other runners. Walls, crates, machinery and closed doors stop everyone. If a door opens at a different time, the same command can produce a different position. Echoes resume from that position.
- Each tick moves the crew against the previous door state, updates the sentry, and checks whether the live runner is taking the target. A phase-changing theft sets the new security phase for that tick’s doors and plates. A phase-gated relay accepts USE only if its required phase was already active at tick start and remains active during door resolution. Pickups and extraction finish the tick. The next movement step uses the resulting doors.
- An Echo stays where its tape ends. Each uncaught runner can hold a plate, operate a relay or ring the floor buzzer. A door stays open while a runner overlaps its threshold. A relay pulse lasts 150 ticks.
- A sentry patrols on the simulation clock. Its visible detection area respects walls and closed gates. The buzzer draws it to its intercom and suspends scanning while occupied. A caught Echo stops operating devices. A caught live runner can retry, undo or keep the tape.
- Only the live runner takes valuables and extracts them. Rewinding restores the loot, actors, security, clock and mechanisms. Previously recorded input tapes survive. Pause freezes the simulation. Visual effects and synthesized music use separate clocks.
- The loop counter identifies the current crew timeline. The result counts takes used, including discarded active retries. Total completion time counts simulated seconds across all takes. Planning before a take and pausing cost no time.

## Vesper Reserve

Stealing the Aegis Core seals the upper entrance A and vault shutter B. It releases the western hatch H and enables the pressure control for the lower maintenance gate C. A runner in a closing doorway has time to clear the threshold. Rewinds and retries restore normal security, including the open vault shutter.

For a hatch recording, start at spawn and hold Right against H (or click the hatch itself). Keep recording until 20 seconds remain, then rewind. Give a second Echo the west entrance plate. Head directly to the core on the third take. Your first Echo’s remaining Right inputs carry it through H to the wall on pad C. Return along the southern passage. For a conventional crew, record the entrance plate first, then reach C by the gallery stair and rewind there. The guard watches the optional intel in the east bay.

## Meridian Dead Letter Office

The Midnight Postmark sits just inside gate A. The dispatch relay is across shutter S in the north wing. The exit and optional intel share the east dispatch bay beyond gate R.

1. Stand on pad A and rewind.
2. Cross the open shutter S. Press **E** at the offline relay R and rewind. Clicking the relay also records the stamp.
3. Walk through A to the postmark and wait. When your clerk clears S, press **E** or click the postmark again. Move east around the sorting crates. The recorded stamp opens gate R for 2.5 seconds. Once across, collect the optional intel and extract.

On the direct pointer route you reach the postmark at 1.35 seconds. The clerk clears S at about 3.65 seconds and stamps at 6.13 seconds. These are elapsed times within the final loop. The HUD says when the clerk has cleared S, so you can play by watching the crew. Taking the postmark on the same tick as the stamp is too late. Press **T** to retry with both recordings. For a smaller crew, record a single operator holding A long enough for you to enter, then walking to R to stamp.

## Mastery

Contract Select shows your fastest clear for each job and the selected contract’s Bronze, Silver and Gold targets. Match or beat a target to earn that medal. A slower escape still counts as a clear. Times include all active loops. Equal times favor fewer loops, then collected bonus intel. Existing saved runs receive the medal for their recorded time.

## Build and verify

Use Node.js 22.6 or later with npm. Run the following in this folder.

```sh
npm ci
npm test
npm run build
```

For a fresh checkout, clone [the Echo Heist repository](https://github.com/deanlefor/echo-heist) and run the commands above from its root. Open `index.html` to play offline or run `npm start` for the local server.

On every push to `main`, GitHub Actions runs the locked install, tests, and production build using Node.js 24. A successful build publishes `index.html`, `style.css`, and the newly compiled `game.js` to GitHub Pages. The project inherits the account site's domain. Relative asset paths allow the same build to work under `/echo-heist/` and locally.

The TypeScript build uses esbuild to produce a classic browser script. The runtime uses a local Canvas 2D pixel-rendering library, a fixed-step integer simulation, and Web Audio synthesis. Art, sound and the soundtrack are generated locally. Reduced-motion preferences suppress rewind flashes and celebratory particles.

| Source                                       | Responsibility                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| src/sim.ts                                   | Fixed-step clock, input tapes, crew, collision, guards and security mechanisms           |
| src/levels.ts                                | Authored geometry, devices, targets and scoring budgets for seven facilities              |
| src/input.ts                                 | Pointer routing into the same simulation commands as keyboard input                      |
| src/render.ts, src/pixels.ts, src/skyline.ts | Pixel-art facility feed, characters, effects and skyline                                 |
| src/audio.ts                                 | Synthesized effects and ambient sequencer                                                |
| src/ui.ts, src/main.ts                       | Timeline, input handling, HUD, menus and browser integration                             |
| src/save.ts                                  | Versioned local progress and medal ranking                                               |
| tests/                                       | Replay, reset, pause, door divergence, distraction, pulse timing, saving and full heists |

The suite includes a four-person treasury heist, both Vesper escapes, early and late Meridian thefts, a two-loop dispatch run, gold runs for every contract and identical state comparisons under different render frame schedules.
