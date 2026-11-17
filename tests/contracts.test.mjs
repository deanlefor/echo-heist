import test from "node:test";
import assert from "node:assert/strict";
import { Heist, RIGHT, LEFT, DOWN, UP, USE, center, UNIT } from "../src/sim.ts";
import { first, distraction, timing, score, levels } from "../src/levels.ts";
import { result, better, readSave, writeSave, timeMedal } from "../src/save.ts";
const run = (s, cmd, count) => {
  for (let i = 0; i < count; i++) s.step(cmd);
};
function axis(s, key, target) {
  const n = (target + 0.5) * UNIT;
  for (
    let i = 0;
    i < 600 && s.player[key] !== n && !s.won && !s.player.caught;
    i++
  ) {
    s.step(
      key === "x"
        ? s.player.x < n
          ? RIGHT
          : LEFT
        : s.player.y < n
          ? DOWN
          : UP,
    );
  }
  assert.ok(
    s.won || s.player[key] === n,
    "Blocked approaching " +
      key +
      "=" +
      target +
      " at " +
      JSON.stringify(s.player),
  );
}
function go(s, x, y) {
  axis(s, "x", x);
  axis(s, "y", y);
}
test("all facility geometry and interactive objects are on valid tiles", () => {
  for (const l of levels) {
    assert.equal(l.tiles.length, 12, l.title);
    assert.ok(
      l.tiles.every((row) => row.length === 23),
      l.title,
    );
    for (const a of [
      l.start,
      l.exit,
      l.loot,
      l.bonus,
      ...l.gates,
      ...l.gates.flatMap(g => g.source ? [g.source] : []),
      ...(l.patrol ? [l.patrol.from, l.patrol.to, l.patrol.bell] : []),
    ])
      assert.equal(l.tiles[a.y][a.x], ".", l.title + " " + JSON.stringify(a));
  }
});
test("First Echo offers a complete two-loop gold run including bonus intel", () => {
  const s = new Heist(first);
  go(s, 7, 3);
  s.rewind();
  go(s, 18, 5);
  s.step(USE);
  axis(s, "y", 2);
  axis(s, "x", 19);
  s.step(USE);
  axis(s, "x", 18);
  axis(s, "y", 6);
  go(s, 3, 8);
  assert.ok(s.won);
  assert.equal(result(s).medal, 3);
});
test("a guard catches a lone runner; a persistent echo diversion protects the same route", () => {
  const s = new Heist(distraction);
  run(s, RIGHT, 240);
  assert.ok(s.player.caught);
  s.retry();
  go(s, 6, 3);
  s.rewind();
  go(s, 19, 6);
  axis(s, "y", 5);
  s.step(USE);
  axis(s, "y", 6);
  go(s, 2, 7);
  assert.ok(s.distracted);
  assert.ok(s.won);
});
test("timed doors close on schedule and an Echo can replay a pulse for a second runner", () => {
  const s = new Heist(timing);
  go(s, 4, 2);
  s.step(USE);
  assert.ok(s.doors[0]);
  run(s, 0, 149);
  assert.ok(s.doors[0]);
  s.step(0);
  assert.equal(s.doors[0], false);
  s.rewind();
  go(s, 16, 3);
  axis(s, "x", 18);
  s.step(USE);
  go(s, 20, 8);
  assert.ok(s.won);
});
test("the finale supports a four-person relay, diversion, timed entry and escape", () => {
  const s = new Heist(score);
  go(s, 5, 3);
  s.rewind();
  go(s, 10, 8);
  s.rewind();
  go(s, 10, 2);
  s.step(USE);
  s.rewind();
  go(s, 18, 3);
  axis(s, "x", 20);
  s.step(USE);
  axis(s, "x", 18);
  axis(s, "y", 8);
  axis(s, "x", 20);
  assert.ok(s.won);
  assert.equal(s.tracks.length, 3);
  assert.ok(s.distracted);
});
test("an Echo uses current collisions when a previously closed route opens", () => {
  const s = new Heist(first);
  run(s, RIGHT, 220);
  const originalEnd = s.player.x;
  s.rewind();
  go(s, 7, 3);
  run(s, 0, 220);
  assert.ok(s.actors[0].x > originalEnd + UNIT * 3);
});
test("medal cutoffs include the exact tick for every contract", () => {
  for (const level of levels) {
    const {gold, silver, bronze} = level.medalTimes;
    for (const [seconds, medal] of [[gold, 3], [silver, 2], [bronze, 1]]) {
      assert.equal(timeMedal(level, seconds * 60), medal);
      assert.equal(timeMedal(level, seconds * 60 + 1), medal - 1);
    }
  }
});
test("best clears rank time first, then loops and intel on a tie", () => {
  const r = { medal: 2, loops: 3, ticks: 900, bonus: false };
  assert.ok(better({ ...r, ticks: 899, loops: 4 }, r));
  assert.equal(better({ ...r, ticks: 901, loops: 2 }, r), false);
  assert.ok(better({ ...r, loops: 2 }, r));
  assert.ok(better({ ...r, bonus: true }, r));
  assert.equal(better(r, r), false);
});
test("local progress round-trips and malformed saves recover safely", () => {
  let stored = null;
  globalThis.localStorage = {
    getItem: () => stored,
    setItem: (_, s) => {
      stored = s;
    },
  };
  const save = readSave();
  save.selected = 3;
  save.muted = true;
  save.records[1] = { loops: 3, medal: 3, ticks: 721, bonus: false };
  writeSave(save);
  assert.deepEqual(readSave(), save);
  const legacy = JSON.parse(stored);
  legacy.records[1].medal = 1;
  legacy.records[0] = { loops: 6, medal: 1, ticks: 3600, bonus: true };
  stored = JSON.stringify(legacy);
  assert.deepEqual(readSave().records[1], save.records[1]);
  assert.deepEqual(readSave().records[0], {...legacy.records[0], medal: 0});
  stored = "{broken";
  assert.equal(readSave().selected, 0);
  delete globalThis.localStorage;
});
