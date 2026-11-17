import test from "node:test";
import assert from "node:assert/strict";
import { theWindow as level, levels } from "../src/levels.ts";
import {
  center,
  Heist,
  Clock,
  USE,
  UNIT,
  RADIUS,
  HZ,
  PULSE_TICKS,
  RELAY_STAMP,
  near,
  atControl,
} from "../src/sim.ts";
import { dispatchStatus } from "../src/ui.ts";
import { PointerRoute } from "../src/input.ts";
import { result, readSave, writeSave } from "../src/save.ts";

const [entrance, shutter, relay] = level.gates;

function go(s, target, afterStep) {
  const route = new PointerRoute();
  assert.ok(route.plan(level, s.player, target, s.phase));
  for (let i = 0; i < 700 && route.target && !s.won; i++) {
    s.step(route.next(s));
    afterStep?.();
  }
  assert.ok(
    s.won || (!route.target && near(s.player, target)),
    "Unreachable " + JSON.stringify(target),
  );
}
function waitUntil(s, tick) {
  assert.ok(s.started && tick >= s.tick && tick < 30 * HZ);
  const steps = tick - s.tick;
  for (let i = 0; i < steps; i++) s.step(0);
  assert.equal(s.tick, tick);
}
function recordCrew(combined = false) {
  const s = new Heist(level);
  go(s, entrance.source);
  if (combined) waitUntil(s, 115);
  else s.rewind();
  let interlock, clear;
  go(s, relay.source, () => {
    if (near(s.player, shutter, UNIT / 2 + RADIUS)) interlock ??= s.tick - 1;
    if (s.player.x - RADIUS >= (shutter.x + 1) * UNIT) clear ??= s.tick - 1;
  });
  const stamp = s.activity.indexOf(RELAY_STAMP);
  assert.ok(interlock < clear && clear < stamp);
  assert.equal(s.commands[stamp], USE);
  assert.equal(s.pulses[2], 0);
  assert.ok(s.cues.includes("relayOffline"));
  s.rewind();
  go(s, level.loot);
  assert.equal(s.loot, false);
  assert.ok(s.tick < interlock);
  return { s, interlock, clear, stamp };
}
function steal(s, tick) {
  waitUntil(s, tick);
  s.step(USE);
  assert.ok(s.loot);
  assert.equal(s.phase, "lockdown");
}
function finish(s) {
  go(s, level.bonus);
  go(s, level.exit);
  assert.ok(s.won && s.bonus);
}
test("the clerk clears S well after the runner can arrive, then stamps within a readable window", () => {
  const { s, interlock, clear, stamp } = recordCrew();
  assert.deepEqual([s.tick, interlock, clear, stamp], [81, 196, 219, 368]);
  assert.ok((stamp - clear) / HZ >= 2 && (stamp - clear) / HZ <= 4);
  assert.match(dispatchStatus(s), /Wait here/);
  waitUntil(s, clear + 1);
  assert.match(dispatchStatus(s), /Shutter S clear/);
  const tapes = structuredClone(s.tracks);
  steal(s, clear + 24);
  assert.deepEqual(s.doors, [false, false, false]);
  finish(s);
  assert.deepEqual(s.tracks, tapes);
  assert.deepEqual(result(s), { loops: 3, ticks: 943, bonus: true, medal: 3 });
});
test("immediate theft and theft one tick before the interlock leave the clerk outside S", () => {
  for (const timing of ["arrival", "threshold"]) {
    const { s, interlock, stamp } = recordCrew();
    steal(s, timing === "arrival" ? s.tick : interlock - 1);
    assert.equal(s.doors[1], false);
    assert.match(dispatchStatus(s), /Too early/);
    waitUntil(s, stamp + 1);
    assert.ok(s.actors[1].x < shutter.x * UNIT);
    assert.ok(!atControl(s.actors[1], relay));
    assert.deepEqual(s.pulses, [0, 0, 0]);
    assert.equal(s.doors[2], false);
  }
});
test("the threshold interlock lets an overlapping clerk finish crossing on the first protected tick", () => {
  const { s, interlock } = recordCrew();
  steal(s, interlock);
  assert.ok(s.doors[1] && near(s.actors[1], shutter, UNIT / 2 + RADIUS));
  finish(s);
  assert.equal(s.doors[1], false);
});
test("a stamp needs lockdown at tick start: one tick before works, simultaneous and late both miss", () => {
  for (const offset of [-1, 0, 1, HZ]) {
    const { s, stamp } = recordCrew();
    steal(s, stamp + offset);
    if (offset === -1) {
      assert.equal(s.doors[2], false);
      s.step(0);
      assert.ok(s.doors[2]);
      finish(s);
    } else {
      assert.ok(atControl(s.actors[1], relay));
      assert.match(dispatchStatus(s), /Too late/);
      waitUntil(s, stamp + 2 * HZ);
      assert.equal(s.pulses[2], 0);
      assert.equal(s.doors[2], false);
    }
  }
});
test("a single stamp opens dispatch for 150 ticks, then a slow runner is locked out", () => {
  const { s, clear, stamp } = recordCrew();
  steal(s, clear + 1);
  waitUntil(s, stamp);
  assert.equal(s.doors[2], false);
  s.step(0);
  assert.equal(s.pulses[2], stamp + 150);
  for (let i = 1; i < PULSE_TICKS; i++) {
    assert.equal(s.doors[2], true);
    s.step(0);
  }
  assert.equal(s.doors[2], true);
  s.step(0);
  assert.equal(s.doors[2], false);
  const route = new PointerRoute();
  assert.ok(route.plan(level, s.player, level.exit, s.phase));
  for (let i = 0; i < 400; i++) s.step(route.next(s));
  assert.ok(s.player.x < relay.x * UNIT && !s.won);
});
test("the dispatch interlock holds a runner already in the gate when its pulse expires", () => {
  const { s, clear, stamp } = recordCrew();
  steal(s, clear + 1);
  go(s, relay);
  waitUntil(s, stamp + PULSE_TICKS + 10);
  assert.ok(s.doors[2]);
  go(s, level.exit);
  assert.ok(s.won && !s.doors[2]);
});
test("retry, rewind, undo and a fresh start disarm the relay and reopen the shutter", () => {
  for (const action of ["retry", "rewind", "undo", "restart"]) {
    const { s, clear, stamp } = recordCrew();
    const tapes = structuredClone(s.tracks);
    steal(s, clear + 1);
    waitUntil(s, stamp + 1);
    assert.ok(s.pulses[2]);
    const reset = action === "restart" ? new Heist(level) : s;
    if (reset === s) s[action]();
    assert.equal(reset.tick, 0);
    assert.equal(reset.phase, "normal");
    assert.deepEqual(reset.doors, [false, true, false]);
    assert.deepEqual(reset.pulses, [0, 0, 0]);
    assert.equal(reset.loot, false);
    assert.equal(
      reset.tracks.length,
      { retry: 2, rewind: 3, undo: 1, restart: 0 }[action],
    );
    assert.deepEqual(
      reset.tracks.slice(0, 2),
      tapes.slice(0, reset.tracks.length),
    );
    if (action === "rewind") {
      reset.started = true;
      waitUntil(reset, stamp + 1);
      assert.equal(
        reset.phase,
        "normal",
        "Archived theft cannot arm its own relay",
      );
      assert.equal(reset.pulses[2], 0);
    }
  }
});
test("a two-loop crew can combine pad and stamp, keeping the handoff intact", () => {
  const { s, clear, stamp } = recordCrew(true);
  steal(s, clear + 24);
  assert.ok(s.tick < stamp);
  finish(s);
  assert.equal(result(s).loops, 2);
});
test("30 and 144 FPS reproduce every dispatch tick, including the recording and theft", () => {
  const { s: guide, clear } = recordCrew();
  steal(guide, clear + 24);
  finish(guide);
  const takes = [...guide.tracks.map((t) => t.commands), guide.commands];
  function replay(fps) {
    const s = new Heist(level),
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
          s.phase,
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
test("the entrance, sorting shutter and dispatch gate have no walk-around routes", () => {
  // Check each choke point in isolation, giving the runner every other gate.
  function canWalk(from, to, closed) {
    const tiles = level.tiles.slice();
    const row = tiles[closed.y];
    tiles[closed.y] = row.slice(0, closed.x) + "#" + row.slice(closed.x + 1);
    return new PointerRoute().plan(
      { ...level, gates: [], tiles },
      center(from),
      to,
    );
  }
  assert.equal(canWalk(level.start, level.loot, entrance), false);
  assert.equal(canWalk(level.start, relay.source, shutter), false);
  assert.equal(canWalk(level.loot, level.exit, relay), false);
  assert.equal(canWalk(level.loot, relay.source, entrance), false);
});
test("seventh selection and medal coexist with a six-contract save", () => {
  assert.ok(levels.length >= 7);
  assert.equal(levels[6], level);
  const { s, clear } = recordCrew();
  steal(s, clear + 24);
  finish(s);
  const previous = {
    selected: 5,
    muted: true,
    records: { 5: { ticks: 1512, medal: 3, loops: 3, bonus: false } },
  };
  let data = JSON.stringify(previous);
  globalThis.localStorage = {
    getItem: () => data,
    setItem: (_, value) => {
      data = value;
    },
  };
  try {
    const save = readSave();
    assert.deepEqual(save, previous);
    save.selected = 6;
    save.records[6] = result(s);
    writeSave(save);
    assert.deepEqual(readSave(), save);
  } finally {
    delete globalThis.localStorage;
  }
});
