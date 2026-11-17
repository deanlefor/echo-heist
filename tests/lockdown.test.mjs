import test from "node:test";
import assert from "node:assert/strict";
import { levels, lockdown } from "../src/levels.ts";
import {
  Clock,
  Heist,
  RIGHT,
  USE,
  UNIT,
  center,
  near,
  atControl,
  tile,
} from "../src/sim.ts";
import { PointerRoute } from "../src/input.ts";
import { readSave, writeSave, result } from "../src/save.ts";

const [A, B, C, H] = lockdown.gates;
function run(s, command, ticks) {
  for (let i = 0; i < ticks; i++) s.step(command);
}
function go(s, target) {
  const route = new PointerRoute();
  assert.ok(route.plan(lockdown, s.player, target, s.phase));
  for (let i = 0; i < 900 && route.target && !s.won && !s.player.caught; i++)
    s.step(route.next(s));
  assert.ok(
    !s.player.caught && (s.won || (!route.target && near(s.player, target))),
    JSON.stringify(target),
  );
}
function hatchCrew() {
  const s = new Heist(lockdown);
  run(s, RIGHT, 480);
  assert.ok(s.player.x < H.x * UNIT);
  assert.ok(s.commands.every((command) => command === RIGHT));
  s.rewind();
  go(s, A.source);
  s.rewind();
  return s;
}
test("the live theft changes security on that tick; the blocked tape moves on the next", () => {
  const s = hatchCrew(),
    tapes = structuredClone(s.tracks);
  go(s, lockdown.loot);
  assert.equal(s.phase, "lockdown");
  assert.deepEqual(s.doors, [false, false, false, true]);
  assert.equal(s.cues.filter((c) => c === "lockdown").length, 1);
  const blockedX = s.actors[0].x;
  assert.ok(blockedX < H.x * UNIT);
  s.step(USE);
  assert.ok(s.actors[0].x > blockedX);
  assert.equal(s.cues.filter((c) => c === "lockdown").length, 1);
  run(s, 0, 120);
  assert.ok(atControl(s.actors[0], C));
  assert.ok(atControl(s.actors[1], A));
  assert.deepEqual(s.doors, [false, false, true, true]);
  go(s, lockdown.exit);
  assert.ok(s.won);
  assert.deepEqual(s.tracks, tapes);
});
test("the conventional crew takes the gallery stair and arms C before the theft", () => {
  const s = new Heist(lockdown);
  go(s, A.source);
  s.rewind();
  go(s, C.source);
  assert.ok(atControl(s.player, C));
  assert.ok(s.trace.some((p) => tile(p).x === 12 && tile(p).y === 8));
  assert.equal(s.phase, "normal");
  assert.deepEqual(s.doors, [true, true, false, false]);
  s.rewind();
  go(s, { x: 17, y: 3 });
  run(s, 0, 240);
  assert.ok(atControl(s.actors[1], C));
  assert.equal(s.doors[2], false);
  go(s, lockdown.loot);
  assert.deepEqual(s.doors, [false, false, true, true]);
  go(s, lockdown.exit);
  assert.ok(s.won);
  assert.equal(s.attempts, 3);
});
test("the core, the live player, and both sealing door interlocks resolve in one tick", () => {
  const s = new Heist(lockdown);
  const actor = (p) => ({ ...s.player, ...center(p) });
  s.actors = [actor(A.source), actor(A), actor(B), actor(lockdown.loot)];
  s.tracks = s.actors
    .slice(0, -1)
    .map(() => ({ commands: [], activity: [], trace: [] }));
  s.started = true;
  s.step(0);
  assert.deepEqual(s.doors, [true, true, false, false]);
  s.step(USE);
  assert.equal(s.phase, "lockdown");
  assert.deepEqual(s.doors, [true, true, false, true]);
  Object.assign(s.actors[1], center(lockdown.start));
  Object.assign(s.actors[2], center(lockdown.start));
  Object.assign(s.player, center(C.source));
  s.step(0);
  assert.deepEqual(s.doors, [false, false, true, true]);
  Object.assign(s.player, center(lockdown.exit));
  s.step(0);
  assert.equal(s.doors[2], false);
});
test("retry, rewind, undo and restart restore normal doors; a replayed pickup cannot trigger lockdown", () => {
  const s = hatchCrew();
  go(s, lockdown.loot);
  const pickupTick = s.tick;
  s.rewind();
  const archived = structuredClone(s.tracks);
  for (const method of ["retry", "undo"]) {
    assert.equal(s.phase, "normal");
    assert.deepEqual(s.doors, [false, true, false, false]);
    s.started = true;
    run(s, 0, pickupTick);
    assert.equal(s.phase, "normal");
    assert.equal(s.loot, false);
    assert.ok(near(s.actors[2], lockdown.loot, 205));
    assert.deepEqual(s.tracks, archived);
    go(s, lockdown.loot);
    assert.equal(s.phase, "lockdown");
    s[method]();
  }
  assert.equal(s.tracks.length, 2);
  for (const clean of [s, new Heist(lockdown)]) {
    assert.deepEqual(clean.doors, [false, true, false, false]);
    assert.equal(clean.phase, "normal");
    assert.equal(clean.tick, 0);
  }
});
test("Vesper has no unguarded bypass around either vault passage", () => {
  function connected(from, to, closed) {
    const seen = new Set(),
      todo = [from];
    for (let next = 0; next < todo.length; next++) {
      const p = todo[next],
        id = p.x + "," + p.y;
      if (
        seen.has(id) ||
        lockdown.tiles[p.y]?.[p.x] !== "." ||
        closed.some((g) => g.x === p.x && g.y === p.y)
      )
        continue;
      if (p.x === to.x && p.y === to.y) return true;
      seen.add(id);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        todo.push({ x: p.x + dx, y: p.y + dy });
    }
    return false;
  }
  assert.equal(connected(lockdown.start, lockdown.loot, [A, C, H]), false);
  assert.equal(connected(lockdown.start, lockdown.loot, [B, C, H]), false);
  assert.equal(connected(lockdown.loot, lockdown.exit, [A, B, C]), false);
  assert.ok(connected(lockdown.start, C.source, [H, C]));
  assert.ok(connected(lockdown.loot, lockdown.exit, [A, B]));
});
test("a complete lockdown heist replays identically at 30 and 144 rendering frames per second", () => {
  const guide = hatchCrew();
  go(guide, lockdown.loot);
  go(guide, lockdown.exit);
  const takes = [...guide.tracks.map((t) => t.commands), guide.commands];
  function replay(fps) {
    const s = new Heist(lockdown),
      clock = new Clock(),
      transitions = [];
    let loop = 0;
    for (
      let frame = 0;
      frame < Math.ceil((guide.elapsed * fps) / 60) + 2 && !s.won;
      frame++
    ) {
      clock.advance(1 / fps, () => {
        if (s.won) return;
        const before = s.doors.join();
        s.step(takes[loop][s.tick]);
        if (before !== s.doors.join())
          transitions.push([s.elapsed, s.phase, ...s.doors]);
        if (!s.won && s.tick === takes[loop].length) {
          s.rewind();
          loop++;
        }
      });
    }
    assert.ok(s.won);
    return { s, transitions };
  }
  const slow = replay(30);
  assert.deepEqual(slow, replay(144));
  assert.deepEqual(slow.s, guide);
});
test("sixth selection and record persist alongside the original contract IDs", () => {
  assert.equal(levels.length, 6);
  const slot = levels.indexOf(lockdown);
  assert.equal(slot, 5);
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => data.get(k),
    setItem: (k, v) => data.set(k, v),
  };
  try {
    const s = hatchCrew();
    go(s, lockdown.loot);
    go(s, lockdown.exit);
    const save = readSave();
    save.selected = slot;
    save.records[slot] = result(s);
    save.records[0] = { ticks: 600, medal: 3, loops: 2, bonus: false };
    writeSave(save);
    assert.deepEqual(readSave(), save);
  } finally {
    delete globalThis.localStorage;
  }
});
