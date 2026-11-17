import test from "node:test";
import assert from "node:assert/strict";
import { handoff, levels } from "../src/levels.ts";
import {
  Clock,
  Heist,
  HZ,
  LIMIT,
  PULSE_TICKS,
  LEFT,
  RIGHT,
  UP,
  USE,
  UNIT,
  RADIUS,
  atControl,
} from "../src/sim.ts";
import { result, readSave, writeSave } from "../src/save.ts";
import { handoffStatus } from "../src/ui.ts";
import { go, recordYardCrew } from "./route-helpers.mjs";

const [release, berth, departure] = handoff.gates;
function until(s, time, command = 0) {
  assert.ok(time >= s.tick && time < LIMIT);
  const remaining = time - s.tick;
  for (let i = 0; i < remaining; i++) s.step(command);
  assert.equal(s.tick, time);
}
function loadRunner() {
  const s = new Heist(handoff);
  until(s, 480, RIGHT);
  assert.ok(!atControl(s.player, berth));
  assert.ok(s.commands.every((cmd) => cmd === RIGHT));
  s.rewind();
  // Walk to the release switch without operating it on arrival.
  until(s, 32, UP);
  assert.ok(atControl(s.player, release));
  return s;
}
function signal(s, tick) {
  until(s, tick);
  s.step(USE);
  assert.ok(s.doors[0]);
  assert.equal(s.pulses[0], tick + PULSE_TICKS);
}
function finish(s) {
  go(s, handoff.loot);
  go(s, handoff.bonus);
  go(s, handoff.exit);
  assert.ok(s.won && s.bonus);
}

test("A releases a blocked recording, the displaced body opens B, then the operator stamps C", () => {
  const s = loadRunner();
  const originalTape = structuredClone(s.tracks[0]);
  signal(s, 224);
  const solo = new Heist(handoff);
  for (const cmd of originalTape.commands) solo.step(cmd);
  const stop = solo.player;
  assert.equal(s.actors[0].x, stop.x);
  assert.deepEqual(s.doors, [true, false, false]);
  s.step(0);
  assert.ok(
    s.actors[0].x > stop.x,
    "first movement through the released shutter is next tick",
  );
  while (s.tick < 320 && !s.doors[1]) s.step(0);
  assert.ok(atControl(s.actors[0], berth));
  assert.ok(!s.doors[2]);
  go(s, departure.source);
  const stamp = s.tick - 1;
  assert.equal(s.commands[stamp], USE);
  s.rewind();
  assert.deepEqual(s.tracks[0], originalTape);
  go(s, handoff.loot);
  until(s, stamp);
  assert.ok(s.loot && s.doors[1] && !s.doors[2]);
  s.step(0);
  assert.ok(atControl(s.actors[1], departure));
  assert.deepEqual(s.pulses, [224 + PULSE_TICKS, 0, stamp + PULSE_TICKS]);
  go(s, handoff.bonus);
  go(s, handoff.exit);
  assert.ok(s.won && s.bonus);
  assert.equal(result(s).loops, 3);
});

test("the first and last workable release ticks bound a generous handoff", () => {
  // For this eight-second push, the shutter may open before arrival or while
  // the runner is blocked, provided enough eastbound commands remain.
  for (const [tick, expected] of [
    [32, false],
    [45, false],
    [46, true],
    [196, true],
    [426, true],
    [427, false],
    [480, false],
  ]) {
    const s = loadRunner();
    signal(s, tick);
    until(s, 660);
    assert.equal(s.doors[0], false, "shutter seals after clearance or expiry");
    assert.equal(
      atControl(s.actors[0], berth),
      expected,
      "release on tick " + tick,
    );
    assert.equal(s.doors[1], expected);
    assert.equal(s.doors[2], false, "occupying B alone never calls the train");
    if (!expected) {
      go(s, departure.source, () => s.tick === 800);
      assert.ok(!atControl(s.player, departure));
      s.step(USE);
      assert.equal(s.pulses[2], 0);
    }
  }
});
test("the final runner needs both recorded jobs to extract with the token", () => {
  const guide = new Heist(handoff);
  recordYardCrew(guide);
  finish(guide);
  for (const tape of guide.tracks) {
    const solo = new Heist(handoff);
    for (const cmd of tape.commands) solo.step(cmd);
    solo.rewind();
    for (const cmd of guide.commands) solo.step(cmd);
    assert.ok(solo.loot && !solo.won);
    assert.ok(!solo.doors[2] && solo.pulses[2] === 0);
    assert.ok(solo.player.x < departure.x * UNIT);
  }
});
test("a train missed by one tick leaves C closed; resetting the same crew allows extraction", () => {
  const s = new Heist(handoff);
  recordYardCrew(s);
  const tapes = structuredClone(s.tracks);
  go(s, handoff.loot);
  const stamp = s.tracks[1].commands.lastIndexOf(USE);
  until(s, stamp);
  assert.equal(s.doors[2], false);
  s.step(0);
  assert.equal(s.pulses[2], stamp + 150);
  until(s, stamp + PULSE_TICKS);
  assert.ok(s.doors[2]);
  s.step(0);
  assert.equal(s.doors[2], false);
  assert.match(handoffStatus(s), /Missed departure/);
  go(s, handoff.exit, () => s.tick === stamp + 500);
  assert.ok(s.player.x < departure.x * UNIT && !s.won);
  s.retry();
  assert.deepEqual(s.tracks, tapes);
  assert.deepEqual(s.doors, [false, false, false]);
  assert.deepEqual(s.pulses, [0, 0, 0]);
  assert.equal(s.tick, 0);
  assert.equal(s.loot, false);
  finish(s);
});
test("rewind, undo, expiry and a clean start reset the entire signal chain", () => {
  const s = new Heist(handoff);
  recordYardCrew(s);
  const saved = structuredClone(s.tracks);
  go(s, handoff.loot);
  until(s, s.tracks[1].commands.length);
  assert.ok(s.doors[1] && s.doors[2]);
  s.rewind();
  assert.equal(s.tracks.length, 3);
  s.undo();
  assert.deepEqual(s.tracks, saved);
  s.started = true;
  until(s, LIMIT - 1);
  s.step(0);
  assert.equal(s.tracks[2].commands.length, LIMIT);
  for (const clean of [s, new Heist(handoff)]) {
    assert.equal(clean.tick, 0);
    assert.deepEqual(clean.doors, [false, false, false]);
    assert.deepEqual(clean.pulses, [0, 0, 0]);
    assert.ok(!clean.loot && !clean.bonus);
  }
});
test("reverse handoff: one operator tape and a live runner can catch the train in two takes", () => {
  const s = new Heist(handoff);
  until(s, 32, UP);
  signal(s, 212);
  until(s, 480, RIGHT);
  assert.ok(s.player.x < berth.x * UNIT);
  until(s, 795);
  s.step(USE);
  assert.equal(
    s.pulses[2],
    0,
    "the original stamp misses the unreachable console",
  );
  s.rewind();
  until(s, 294, RIGHT);
  assert.ok(atControl(s.player, berth));
  assert.ok(s.actors[0].x > (berth.x + 1) * UNIT + RADIUS);
  until(s, 337, LEFT);
  go(s, handoff.loot);
  assert.ok(!s.doors[1] && atControl(s.actors[0], departure));
  until(s, 796);
  assert.equal(s.pulses[2], 795 + PULSE_TICKS);
  go(s, handoff.bonus);
  go(s, handoff.exit);
  assert.ok(s.won && s.bonus);
  assert.equal(result(s).loops, 2);
});
test("30 and 144 FPS replay identical actors, gate transitions, recordings and clear time", () => {
  const guide = new Heist(handoff);
  recordYardCrew(guide);
  finish(guide);
  const takes = [...guide.tracks.map((t) => t.commands), guide.commands];
  function replay(fps) {
    const s = new Heist(handoff),
      clock = new Clock(),
      ticks = [];
    for (
      let frame = 0;
      frame <= Math.ceil((guide.elapsed * fps) / HZ);
      frame++
    ) {
      clock.advance(1 / fps, () => {
        if (s.won) return;
        const tape = takes[s.tracks.length];
        s.step(tape[s.tick]);
        ticks.push([
          ...s.doors,
          ...s.pulses,
          ...s.actors.flatMap((a) => [a.x, a.y]),
        ]);
        if (!s.won && s.tick === tape.length) s.rewind();
      });
    }
    assert.deepEqual(s, guide);
    return ticks;
  }
  assert.deepEqual(replay(30), replay(144));
});
test("the eighth result and selected contract round-trip with the seven released slots", () => {
  assert.deepEqual(
    levels.map((l) => l.title),
    [
      "The First Echo",
      "Three’s Company",
      "The Distraction",
      "Perfect Timing",
      "The Big Score",
      "The Lockdown",
      "The Window",
      "The Handoff",
    ],
  );
  const past = Object.fromEntries(
    levels
      .slice(0, 7)
      .map((l, i) => [
        i,
        { ticks: l.medalTimes.gold * HZ, loops: l.par, bonus: true, medal: 3 },
      ]),
  );
  let data = JSON.stringify({ selected: 6, muted: true, records: past });
  globalThis.localStorage = {
    getItem: () => data,
    setItem: (_, v) => {
      data = v;
    },
  };
  try {
    const save = readSave();
    assert.deepEqual(save.records, past);
    const s = new Heist(handoff);
    recordYardCrew(s);
    finish(s);
    save.selected = 7;
    save.records[7] = result(s);
    writeSave(save);
    assert.deepEqual(readSave(), save);
  } finally {
    delete globalThis.localStorage;
  }
});
