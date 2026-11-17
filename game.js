"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/levels.ts
  var p = (x, y) => ({ x, y });
  var gate = (x, y, sx, sy, kind = "plate") => ({ x, y, source: p(sx, sy), kind });
  var company = {
    title: "Three\u2019s Company",
    site: "Relay Exchange",
    item: "Bearer bonds",
    brief: "Chain two pressure locks together and bring the bonds back to extraction.",
    hint: "Record a runner on pad A. Follow them through A, then record a second runner holding B.",
    quip: "Three accomplices. One suspiciously familiar alibi.",
    tiles: [
      "#######################",
      "##......#.......#....##",
      "#.......#.......#.....#",
      "#.......#.......#.....#",
      "#.......#..##...#.....#",
      "#.......#.......#.....#",
      "#.....................#",
      "#.......#.......#.....#",
      "#.......#.......#.....#",
      "#..##...#.......#.....#",
      "##......#......##....##",
      "#######################"
    ],
    start: p(3, 6),
    exit: p(2, 7),
    loot: p(20, 6),
    bonus: p(19, 2),
    gates: [gate(8, 6, 5, 3), gate(16, 6, 13, 8)],
    par: 3,
    target: 24
  };

  // src/sim.ts
  var HZ = 60;
  var LIMIT = 30 * HZ;
  var UNIT = 240;
  var SPEED = 15;
  var RADIUS = 46;
  var UP = 1;
  var DOWN = 2;
  var LEFT = 4;
  var RIGHT = 8;
  var USE = 16;
  var center = (p2) => ({ x: p2.x * UNIT + UNIT / 2, y: p2.y * UNIT + UNIT / 2 });
  var near = (a, b, r = 125) => Math.abs(a.x - (b.x + 0.5) * UNIT) <= r && Math.abs(a.y - (b.y + 0.5) * UNIT) <= r;
  var spawn = (level) => ({ ...center(level.start), face: DOWN, walking: false, caught: false });
  var Heist = class {
    constructor(level) {
      __publicField(this, "level");
      __publicField(this, "tracks", []);
      __publicField(this, "actors", []);
      __publicField(this, "tick", 0);
      __publicField(this, "elapsed", 0);
      __publicField(this, "attempts", 1);
      __publicField(this, "commands", []);
      __publicField(this, "activity", []);
      __publicField(this, "doors", []);
      __publicField(this, "pulses", []);
      __publicField(this, "loot", false);
      __publicField(this, "bonus", false);
      __publicField(this, "won", false);
      __publicField(this, "paused", false);
      __publicField(this, "started", false);
      __publicField(this, "cues", []);
      __publicField(this, "guard", { x: 0, y: 0 });
      __publicField(this, "distracted", false);
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
      this.cues = [];
      this.actors = Array.from({ length: this.tracks.length + 1 }, () => spawn(this.level));
      this.doors = this.level.gates.map(() => false);
      this.pulses = this.level.gates.map(() => 0);
      this.guard = this.level.patrol ? center(this.level.patrol.from) : { x: 0, y: 0 };
      this.distracted = false;
      this.loot = false;
      this.bonus = false;
      this.won = false;
      this.started = false;
    }
    rewind() {
      if (this.won || this.paused || !this.tick) return;
      this.tracks.push({ commands: this.commands, activity: this.activity });
      this.attempts++;
      this.reset();
      this.cues.push("rewind");
    }
    undo() {
      if (this.paused || this.won || !this.tracks.length) return;
      this.tracks.pop();
      this.reset();
      this.cues.push("undo");
    }
    retry() {
      if (this.paused || this.won) return;
      this.reset();
      this.cues.push("retry");
    }
    blocked(x, y) {
      const c2 = Math.floor(x / UNIT), r = Math.floor(y / UNIT);
      return this.level.tiles[r]?.[c2] !== "." || this.level.gates.some((g, i) => g.x === c2 && g.y === r && !this.doors[i]);
    }
    fits(x, y) {
      return !this.blocked(x - RADIUS, y - RADIUS) && !this.blocked(x + RADIUS, y - RADIUS) && !this.blocked(x - RADIUS, y + RADIUS) && !this.blocked(x + RADIUS, y + RADIUS);
    }
    move(a, cmd) {
      const dx = Number(!!(cmd & RIGHT)) - Number(!!(cmd & LEFT)), dy = Number(!!(cmd & DOWN)) - Number(!!(cmd & UP));
      const speed = dx && dy ? 11 : SPEED, x = a.x + dx * speed, y = a.y + dy * speed, oldX = a.x, oldY = a.y;
      if (dx && this.fits(x, a.y)) a.x = x;
      if (dy && this.fits(a.x, y)) a.y = y;
      a.walking = a.x !== oldX || a.y !== oldY;
      if (dx || dy) a.face = dx ? dx > 0 ? RIGHT : LEFT : dy > 0 ? DOWN : UP;
    }
    sees(a, patrol) {
      if (a.caught || this.distracted) return false;
      const dx = a.x - this.guard.x, dy = a.y - this.guard.y;
      const depth = dx * patrol.look.x + dy * patrol.look.y;
      if (depth < 0 || depth > UNIT * 4.4 || Math.abs(dx * patrol.look.y - dy * patrol.look.x) > UNIT * 0.42 + depth * 0.48) return false;
      const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (UNIT / 8));
      for (let i = 1; i < steps; i++) if (this.blocked(this.guard.x + dx * i / steps, this.guard.y + dy * i / steps)) return false;
      return true;
    }
    security() {
      const patrol = this.level.patrol;
      if (!patrol) return;
      const from = center(patrol.from), to = center(patrol.to), phase = 120 - Math.abs(this.tick % 240 - 120);
      this.guard = { x: from.x + Math.trunc((to.x - from.x) * phase / 120), y: from.y + Math.trunc((to.y - from.y) * phase / 120) };
      const divert = this.actors.some((a) => !a.caught && near(a, patrol.bell));
      if (divert && !this.distracted) this.cues.push("alarm");
      this.distracted = divert;
      for (const a of this.actors) if (this.sees(a, patrol)) {
        a.caught = true;
        a.walking = false;
        if (a === this.player) this.cues.push("caught");
      }
    }
    step(input2) {
      if (this.paused || this.won || this.player.caught) return;
      if (!this.started && !input2) return;
      this.started = true;
      this.commands.push(input2);
      const inputs = this.tracks.map((t) => t.commands[this.tick] ?? 0);
      inputs.push(input2);
      this.actors.forEach((a, i) => {
        if (!a.caught) this.move(a, inputs[i]);
      });
      this.security();
      this.level.gates.forEach((g, i) => {
        const onPad = this.actors.some((a) => !a.caught && near(a, g.source, 112));
        if (g.kind === "pulse" && this.actors.some((a, n) => !a.caught && inputs[n] & USE && near(a, g.source, 185))) {
          this.pulses[i] = this.tick + 150;
          this.cues.push("pulse");
        }
        const held = this.doors[i] && this.actors.some((a) => !a.caught && near(a, g, UNIT / 2 + RADIUS));
        const open = (g.kind === "plate" ? onPad : this.pulses[i] > this.tick) || held;
        if (open !== this.doors[i]) this.cues.push(open ? "door" : "lock");
        this.doors[i] = open;
      });
      if (!this.player.caught) {
        if (input2 & USE) {
          if (!this.loot && near(this.player, this.level.loot, 205)) {
            this.loot = true;
            this.cues.push("loot");
          } else if (!this.bonus && near(this.player, this.level.bonus, 190)) {
            this.bonus = true;
            this.cues.push("bonus");
          } else if (!this.level.gates.some((g) => g.kind === "pulse" && near(this.player, g.source, 185))) this.cues.push("empty");
        }
        if (this.loot && near(this.player, this.level.exit, 126)) {
          this.won = true;
          this.cues.push("clear");
        }
      }
      this.activity.push(this.level.gates.some((g) => near(this.player, g.source, 112)) || !!(this.level.patrol && near(this.player, this.level.patrol.bell)) ? 2 : input2 & USE ? 3 : this.player.walking ? 1 : 0);
      this.tick++;
      this.elapsed++;
      if (this.tick >= LIMIT && !this.won && !this.player.caught) this.rewind();
    }
  };
  var Clock = class {
    constructor() {
      __publicField(this, "remainder", 0);
    }
    advance(seconds, step) {
      this.remainder += seconds * HZ;
      const count = Math.floor(this.remainder + 1e-8);
      this.remainder -= count;
      for (let i = 0; i < count; i++) step();
    }
    clear() {
      this.remainder = 0;
    }
  };

  // src/main.ts
  var s = new Heist(company);
  var c = document.querySelector("canvas").getContext("2d");
  var input = 0;
  var use = 0;
  var last = performance.now();
  var clock = new Clock();
  var keys = { w: UP, a: LEFT, s: DOWN, d: RIGHT, arrowup: UP, arrowdown: DOWN, arrowleft: LEFT, arrowright: RIGHT };
  onkeydown = (e) => {
    const k = e.key.toLowerCase();
    if (keys[k]) {
      e.preventDefault();
      input |= keys[k];
    }
    if (e.repeat) return;
    if (k === "e") use = USE;
    if (k === "r") s.rewind();
    if (k === "z") s.undo();
    if (k === "p") s.paused = !s.paused;
    if (k === "x") s = new Heist(company);
  };
  onkeyup = (e) => {
    input &= ~(keys[e.key.toLowerCase()] || 0);
  };
  function frame(t) {
    clock.advance((t - last) / 1e3, () => {
      s.step(input | use);
      use = 0;
    });
    last = t;
    const box = (x, y, col, size = 30) => {
      c.fillStyle = col;
      c.fillRect(x * 32 + (32 - size) / 2, y * 32 + (32 - size) / 2, size, size);
    };
    s.level.tiles.forEach((row, y) => [...row].forEach((v, x) => box(x, y, v === "#" ? "#334451" : "#192229", 32)));
    s.level.gates.forEach((g, i) => {
      box(g.source.x, g.source.y, "#a34deb", 22);
      box(g.x, g.y, s.doors[i] ? "#327b64" : "#e65f58");
    });
    box(s.level.exit.x, s.level.exit.y, "#61bf96");
    if (!s.loot) box(s.level.loot.x, s.level.loot.y, "#ffbc3f", 15);
    s.actors.forEach((a, i) => box(a.x / UNIT - 0.5, a.y / UNIT - 0.5, i === s.tracks.length ? "#69f7f0" : "#b285ff", 16));
    document.querySelector("#info").textContent = s.won ? "ESCAPED" : "Loop " + (s.tracks.length + 1) + " | " + ((1800 - s.tick) / 60).toFixed(1) + " seconds" + (s.paused ? " | PAUSED" : "");
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
