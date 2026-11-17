# Echo Heist development

- Preserve deterministic input recording and Echo replay. Drive gameplay, guards, doors, and timers from the fixed simulation tick.
- Keep simulation independent of rendering, audio, and wall-clock time.
- Keep changes modular and understandable. Justify major architectural changes with a concrete problem in the current design.
- Maintain all existing contracts and their tested escape routes.
- Prefer mechanics that interact with the crew and existing security systems. Add automated tests for each new simulation mechanic.
- Run `npm test` and `npm run build` before finishing development tasks. Use `npm ci` when installing locked dependencies. Commit the generated `game.js` when the build changes so the offline version stays current.
