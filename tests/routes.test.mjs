import test from "node:test";
import assert from "node:assert/strict";
import { go, recordYardCrew } from "./route-helpers.mjs";
import { Heist, atControl, UNIT, RADIUS } from "../src/sim.ts";
import { levels } from "../src/levels.ts";
import { result } from "../src/save.ts";
test("rewinding on the first engaged tick leaves a working teammate", () => {
  const s = new Heist(levels[0]),
    pad = s.level.gates[0];
  go(s, pad.source, () => atControl(s.player, pad));
  assert.ok(s.doors[0]);
  s.rewind();
  go(s, s.level.loot);
  assert.ok(s.doors[0]);
  assert.ok(s.loot);
  go(s, s.level.exit);
  assert.ok(s.won);
});
for (const level of levels)
  test(
    level.title + " has an attainable gold medal through pointer controls",
    () => {
      const s = new Heist(level);
      if (level.handoff) recordYardCrew(s);
      else {
        for (const g of level.gates.filter((g) => g.kind === "plate")) {
          go(s, g.source);
          s.rewind();
        }
        if (level.patrol) {
          go(s, level.patrol.bell);
          s.rewind();
        }
        for (const g of level.gates.filter((g) => g.kind === "pulse")) {
          go(s, g.source);
          s.rewind();
        }
      }
      go(s, level.loot);
      if (level.signalBox) {
        assert.equal(
          s.loot,
          false,
          "First click stages the runner for the handoff",
        );
        for (
          let i = 0;
          i < 900 &&
          !s.actors.some(
            (a) =>
              a.x - RADIUS >= level.signalBox.min.x * UNIT &&
              a.y < (level.signalBox.max.y + 1) * UNIT,
          );
          i++
        )
          s.step(0);
        go(s, level.loot);
      }
      go(s, level.bonus);
      go(s, level.exit);
      assert.ok(s.won);
      assert.equal(result(s).medal, 3, JSON.stringify(result(s)));
    },
  );
test("retrying and undoing an active take count toward loop efficiency", () => {
  const s = new Heist(levels[0]);
  go(s, s.level.gates[0].source);
  s.rewind();
  go(s, s.level.loot);
  s.retry();
  assert.equal(s.attempts, 3);
  assert.equal(s.tracks.length, 1);
  go(s, s.level.loot);
  s.undo();
  assert.equal(s.attempts, 4);
  assert.equal(s.tracks.length, 0);
});
