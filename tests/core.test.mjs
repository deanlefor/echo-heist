import test from "node:test";
import assert from "node:assert/strict";
import {
  Heist,
  Clock,
  LEFT,
  RIGHT,
  DOWN,
  UP,
  USE,
  LIMIT,
  center,
  near,
} from "../src/sim.ts";
import { company } from "../src/levels.ts";
const run = (s, cmd, ticks) => {
  for (let i = 0; i < ticks; i++) s.step(cmd);
};
const walk = (s, cmd, tiles) => run(s, cmd, 16 * tiles);
function crew(s) {
  walk(s, RIGHT, 2);
  walk(s, UP, 3);
  s.rewind();
  walk(s, RIGHT, 10);
  walk(s, DOWN, 2);
  s.rewind();
}
test("two past runners open successive doors and the live runner escapes", () => {
  const s = new Heist(company);
  crew(s);
  walk(s, RIGHT, 17);
  assert.deepEqual(s.doors, [true, true]);
  assert.ok(company.gates.every((g, i) => near(s.actors[i], g.source, 112)));
  s.step(USE);
  assert.equal(s.loot, true);
  walk(s, LEFT, 18);
  walk(s, DOWN, 1);
  assert.ok(s.won);
});
test("rewind restores all actors, doors, loot and clock; undo preserves earlier tapes", () => {
  const s = new Heist(company);
  crew(s);
  const first = structuredClone(s.tracks[0]);
  walk(s, RIGHT, 17);
  s.step(USE);
  s.rewind();
  assert.equal(s.tick, 0);
  assert.equal(s.loot, false);
  assert.deepEqual(s.doors, [false, false]);
  assert.ok(
    s.actors.every(
      (a) => a.x === center(company.start).x && a.y === center(company.start).y,
    ),
  );
  s.undo();
  s.undo();
  assert.deepEqual(s.tracks, [first]);
  assert.equal(s.actors.length, 2);
});
test("same inputs and variable frame schedules produce identical worlds", () => {
  function play(frames) {
    const s = new Heist(company);
    crew(s);
    const c = new Clock();
    frames.forEach((dt) =>
      c.advance(dt, () => s.step(s.tick < 272 ? RIGHT : USE)),
    );
    return s;
  }
  assert.deepEqual(
    play(Array(180).fill(1 / 30)),
    play(Array(864).fill(1 / 144)),
  );
});
test("pause freezes all state, expiry stores exactly 1800 commands, idle echoes hold", () => {
  const s = new Heist(company);
  walk(s, RIGHT, 2);
  walk(s, UP, 3);
  s.paused = true;
  const before = structuredClone(s);
  run(s, DOWN, 60);
  assert.deepEqual(structuredClone(s), before);
  s.paused = false;
  run(s, 0, LIMIT - s.tick);
  assert.equal(s.tracks[0].commands.length, LIMIT);
  assert.equal(s.tick, 0);
  walk(s, LEFT, 1);
  run(s, 0, 100);
  assert.equal(s.doors[0], true);
});
test("closed doors stop live runners and echoes identically", () => {
  const s = new Heist(company);
  walk(s, RIGHT, 12);
  const x = s.player.x;
  assert.ok(x < 8 * 240);
  s.rewind();
  walk(s, RIGHT, 12);
  assert.equal(s.player.x, x);
  assert.equal(s.actors[0].x, x);
});
