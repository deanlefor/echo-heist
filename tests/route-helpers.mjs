import assert from "node:assert/strict";
import { PointerRoute } from "../src/input.ts";
import { near } from "../src/sim.ts";

export function go(s, target, done) {
  const input = new PointerRoute();
  assert.ok(input.plan(s.level, s.player, target, s.phase));
  for (let i = 0; i < 900 && !s.won && !s.player.caught && input.target; i++) {
    s.step(input.next(s));
    if (done?.()) return;
  }
  assert.ok(!s.player.caught, "Guard intercepted a route in " + s.level.title);
  assert.ok(
    s.won || near(s.player, target),
    "Runner did not reach " + JSON.stringify(target),
  );
}

// Three ordinary pointer routes. The blocked destination keeps issuing Right
// on take one. On take two the same inputs finally carry the runner to B.
export function recordYardCrew(s) {
  const [release, berth, departure] = s.level.gates;
  go(s, berth.source, () => s.tick === 480);
  assert.ok(!s.doors[1]);
  s.rewind();
  go(s, { x: release.source.x, y: release.source.y + 1 });
  for (let i = s.tick; i < 207; i++) s.step(0);
  go(s, release.source);
  go(s, departure.source);
  assert.ok(s.doors[1] && s.doors[2]);
  s.rewind();
}
