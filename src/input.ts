import type { Level, Point, SecurityPhase } from "./levels.ts";
import { center, tile, SPEED, LEFT, RIGHT, UP, DOWN, USE } from "./sim.ts";
import type { Heist } from "./sim.ts";
// Pointer routes generate ordinary movement inputs. Playback never runs the planner.
export class PointerRoute {
  points: Point[] = [];
  target?: Point;
  use = false;
  cancel() {
    this.points = [];
    this.target = undefined;
    this.use = false;
  }
  plan(l: Level, from: Point, to: Point, phase: SecurityPhase = "normal") {
    this.cancel();
    if (l.tiles[to.y]?.[to.x] !== ".") return false;
    const first = tile(from),
      width = l.tiles[0].length,
      id = (v: Point) => v.y * width + v.x;
    // A direct click on a sealed hatch deliberately records pushing against it.
    // For destinations beyond it, use passages available in the current phase.
    const sealed = new Set(
      l.gates
        .filter((g) => g.phase && g.phase !== phase && id(g) !== id(to))
        .map(id),
    );
    const queue = [first],
      parents = new Map<number, Point | null>([[id(first), null]]);
    for (let head = 0; head < queue.length; head++) {
      const a = queue[head];
      if (id(a) === id(to)) break;
      for (const d of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const b = { x: a.x + d[0], y: a.y + d[1] };
        if (
          l.tiles[b.y]?.[b.x] !== "." ||
          parents.has(id(b)) ||
          sealed.has(id(b))
        )
          continue;
        parents.set(id(b), a);
        queue.push(b);
      }
    }
    if (!parents.has(id(to))) return false;
    for (let a: Point | null = to; a; a = parents.get(id(a)) ?? null)
      this.points.push(center(a));
    this.points.reverse();
    this.target = to;
    this.use = [
      l.loot,
      l.bonus,
      ...l.gates.flatMap((g) => (g.kind === "pulse" ? [g.source] : [])),
    ].some((p) => p.x === to.x && p.y === to.y);
    return true;
  }
  next(s: Heist): number {
    while (this.points.length) {
      const p = this.points[0],
        dx = p.x - s.player.x,
        dy = p.y - s.player.y;
      if (Math.abs(dx) > SPEED / 2) return dx < 0 ? LEFT : RIGHT;
      if (Math.abs(dy) > SPEED / 2) return dy < 0 ? UP : DOWN;
      this.points.shift();
    }
    const cmd = this.use ? USE : 0;
    this.cancel();
    return cmd;
  }
}
