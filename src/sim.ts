import type { Level, Point, Patrol, Gate, SecurityPhase } from "./levels.ts";
export const HZ = 60,
  LIMIT = 30 * HZ,
  UNIT = 240,
  SPEED = 15,
  RADIUS = 46;
export const UP = 1,
  DOWN = 2,
  LEFT = 4,
  RIGHT = 8,
  USE = 16;
export const center = (p: Point) => ({
  x: p.x * UNIT + UNIT / 2,
  y: p.y * UNIT + UNIT / 2,
});
export const tile = (a: Point) => ({
  x: Math.floor(a.x / UNIT),
  y: Math.floor(a.y / UNIT),
});
export const near = (a: Point, b: Point, r = 125) =>
  Math.abs(a.x - (b.x + 0.5) * UNIT) <= r &&
  Math.abs(a.y - (b.y + 0.5) * UNIT) <= r;
export const atControl = (a: Point, g: Gate) =>
  g.kind !== "automatic" && near(a, g.source, g.kind === "pulse" ? 185 : 112);
export type Actor = Point & { face: number; walking: boolean; caught: boolean };
export type Track = { commands: number[]; activity: number[]; trace: Point[] };
export type Cue =
  | "lockdown"
  | "door"
  | "lock"
  | "pulse"
  | "loot"
  | "bonus"
  | "clear"
  | "caught"
  | "alarm"
  | "rewind"
  | "undo"
  | "retry"
  | "empty";
const spawn = (level: Level): Actor => ({
  ...center(level.start),
  face: DOWN,
  walking: false,
  caught: false,
});
export class Heist {
  level: Level;
  tracks: Track[] = [];
  actors: Actor[] = [];
  tick = 0;
  elapsed = 0;
  attempts = 1;
  commands: number[] = [];
  activity: number[] = [];
  trace: Point[] = [];
  doors: boolean[] = [];
  pulses: number[] = [];
  phase: SecurityPhase = "normal";
  loot = false;
  bonus = false;
  won = false;
  paused = false;
  started = false;
  cues: Cue[] = [];
  guard: Point = { x: 0, y: 0 };
  distracted = false;
  constructor(level: Level) {
    this.level = level;
    this.reset();
  }
  get player() {
    return this.actors[this.actors.length - 1];
  }
  reset() {
    this.tick = 0;
    this.commands = [];
    this.activity = [];
    this.trace = [center(this.level.start)];
    this.cues = [];
    this.actors = Array.from({ length: this.tracks.length + 1 }, () =>
      spawn(this.level),
    );
    this.phase = "normal";
    this.doors = this.level.gates.map(
      (g) => g.kind === "automatic" && g.phase === "normal",
    );
    this.pulses = this.level.gates.map(() => 0);
    this.guard = this.level.patrol
      ? center(this.level.patrol.from)
      : { x: 0, y: 0 };
    this.distracted = false;
    this.loot = false;
    this.bonus = false;
    this.won = false;
    this.started = false;
  }
  rewind() {
    if (this.won || this.paused || !this.tick) return;
    this.tracks.push({
      commands: this.commands,
      activity: this.activity,
      trace: this.trace,
    });
    this.attempts++;
    this.reset();
    this.cues.push("rewind");
  }
  undo() {
    if (this.paused || this.won || !this.tracks.length) return;
    if (this.tick) this.attempts++;
    this.tracks.pop();
    this.reset();
    this.cues.push("undo");
  }
  retry() {
    if (this.paused || this.won) return;
    if (this.tick) this.attempts++;
    this.reset();
    this.cues.push("retry");
  }
  blocked(x: number, y: number) {
    const c = Math.floor(x / UNIT),
      r = Math.floor(y / UNIT);
    return (
      this.level.tiles[r]?.[c] !== "." ||
      this.level.gates.some((g, i) => g.x === c && g.y === r && !this.doors[i])
    );
  }
  fits(x: number, y: number) {
    return (
      !this.blocked(x - RADIUS, y - RADIUS) &&
      !this.blocked(x + RADIUS, y - RADIUS) &&
      !this.blocked(x - RADIUS, y + RADIUS) &&
      !this.blocked(x + RADIUS, y + RADIUS)
    );
  }
  move(a: Actor, cmd: number) {
    const dx = Number(!!(cmd & RIGHT)) - Number(!!(cmd & LEFT)),
      dy = Number(!!(cmd & DOWN)) - Number(!!(cmd & UP));
    const speed = dx && dy ? 11 : SPEED,
      x = a.x + dx * speed,
      y = a.y + dy * speed,
      oldX = a.x,
      oldY = a.y;
    if (dx && this.fits(x, a.y)) a.x = x;
    if (dy && this.fits(a.x, y)) a.y = y;
    a.walking = a.x !== oldX || a.y !== oldY;
    if (dx || dy) a.face = dx ? (dx > 0 ? RIGHT : LEFT) : dy > 0 ? DOWN : UP;
  }
  sees(a: Actor, patrol: Patrol) {
    if (a.caught || this.distracted) return false;
    const dx = a.x - this.guard.x,
      dy = a.y - this.guard.y;
    const depth = dx * patrol.look.x + dy * patrol.look.y;
    if (
      depth < 0 ||
      depth > UNIT * 4.4 ||
      Math.abs(dx * patrol.look.y - dy * patrol.look.x) >
        UNIT * 0.42 + depth * 0.48
    )
      return false;
    const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (UNIT / 8));
    for (let i = 1; i < steps; i++)
      if (
        this.blocked(
          this.guard.x + (dx * i) / steps,
          this.guard.y + (dy * i) / steps,
        )
      )
        return false;
    return true;
  }
  security() {
    const patrol = this.level.patrol;
    if (!patrol) return;
    const from = center(patrol.from),
      to = center(patrol.to),
      phase = 120 - Math.abs((this.tick % 240) - 120);
    const patrolX = from.x + Math.trunc(((to.x - from.x) * phase) / 120),
      patrolY = from.y + Math.trunc(((to.y - from.y) * phase) / 120);
    const divert = this.actors.some((a) => !a.caught && near(a, patrol.bell));
    if (divert && !this.distracted) this.cues.push("alarm");
    this.distracted = divert;
    // The buzzer draws the sentry to the wall intercom above its patrol route.
    const targetX = divert ? from.x : patrolX,
      targetY = divert ? from.y - UNIT : patrolY;
    this.guard.x += Math.max(-6, Math.min(6, targetX - this.guard.x));
    this.guard.y += Math.max(-6, Math.min(6, targetY - this.guard.y));
    for (const a of this.actors)
      if (this.sees(a, patrol)) {
        a.caught = true;
        a.walking = false;
        if (a === this.player) this.cues.push("caught");
      }
  }
  step(input: number) {
    if (this.paused || this.won || this.player.caught) return;
    if (!this.started && !input) return;
    this.started = true;
    this.commands.push(input);
    const inputs = this.tracks.map((t) => t.commands[this.tick] ?? 0);
    inputs.push(input);
    this.actors.forEach((a, i) => {
      if (!a.caught) this.move(a, inputs[i]);
    });
    if (this.tick % 4 === 0 && this.player.walking)
      this.trace.push({ x: this.player.x, y: this.player.y });
    this.security();
    // Movement and sight use the previous tick’s doors. A live pickup sets the
    // phase for this tick’s door resolution, visible to movement next tick.
    const takingLoot =
      !this.player.caught &&
      !!(input & USE) &&
      !this.loot &&
      near(this.player, this.level.loot, 205);
    if (takingLoot && this.level.lockdownOnLoot) this.phase = "lockdown";
    this.level.gates.forEach((g, i) => {
      const enabled = !g.phase || g.phase === this.phase;
      if (
        enabled &&
        g.kind === "pulse" &&
        this.actors.some(
          (a, n) => !a.caught && inputs[n] & USE && atControl(a, g),
        )
      ) {
        this.pulses[i] = this.tick + 150;
        this.cues.push("pulse");
      }
      // Keep a closing door safe until the last overlapping actor has crossed.
      const held =
        this.doors[i] &&
        this.actors.some((a) => !a.caught && near(a, g, UNIT / 2 + RADIUS));
      const powered =
        g.kind === "automatic" ||
        (g.kind === "plate"
          ? this.actors.some((a) => !a.caught && atControl(a, g))
          : this.pulses[i] > this.tick);
      const open = (enabled && powered) || held;
      if (open !== this.doors[i]) this.cues.push(open ? "door" : "lock");
      this.doors[i] = open;
    });
    if (!this.player.caught) {
      if (input & USE) {
        if (takingLoot) {
          this.loot = true;
          this.cues.push("loot");
          if (this.level.lockdownOnLoot) this.cues.push("lockdown");
        } else if (!this.bonus && near(this.player, this.level.bonus, 190)) {
          this.bonus = true;
          this.cues.push("bonus");
        } else if (
          !this.level.gates.some(
            (g) => g.kind === "pulse" && atControl(this.player, g),
          )
        )
          this.cues.push("empty");
      }
      if (this.loot && near(this.player, this.level.exit, 126)) {
        this.won = true;
        this.cues.push("clear");
      }
    }
    this.activity.push(
      this.level.gates.some((g) => atControl(this.player, g)) ||
        !!(this.level.patrol && near(this.player, this.level.patrol.bell))
        ? 2
        : input & USE
          ? 3
          : input & (UP | DOWN | LEFT | RIGHT)
            ? 1
            : 0,
    );
    this.tick++;
    this.elapsed++;
    if (this.tick >= LIMIT && !this.won && !this.player.caught) this.rewind();
  }
}
export class Clock {
  remainder = 0;
  advance(seconds: number, step: () => void) {
    this.remainder += seconds * HZ;
    const count = Math.floor(this.remainder + 1e-8);
    this.remainder -= count;
    for (let i = 0; i < count; i++) step();
  }
  clear() {
    this.remainder = 0;
  }
}
