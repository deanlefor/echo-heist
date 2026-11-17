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
      const c = Math.floor(x / UNIT), r = Math.floor(y / UNIT);
      return this.level.tiles[r]?.[c] !== "." || this.level.gates.some((g, i) => g.x === c && g.y === r && !this.doors[i]);
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

  // src/pixels.ts
  var Pixels = class {
    constructor(canvas, w, h) {
      __publicField(this, "ctx");
      __publicField(this, "w");
      __publicField(this, "h");
      canvas.width = this.w = w;
      canvas.height = this.h = h;
      this.ctx = canvas.getContext("2d");
      this.ctx.imageSmoothingEnabled = false;
    }
    rect(x, y, w, h, color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }
    line(x, y, a, b, color) {
      x = Math.round(x);
      y = Math.round(y);
      a = Math.round(a);
      b = Math.round(b);
      const dx = Math.abs(a - x), dy = -Math.abs(b - y), sx = x < a ? 1 : -1, sy = y < b ? 1 : -1;
      let error = dx + dy;
      for (; ; ) {
        this.rect(x, y, 1, 1, color);
        if (x === a && y === b) break;
        const e = 2 * error;
        if (e >= dy) {
          error += dy;
          x += sx;
        }
        if (e <= dx) {
          error += dx;
          y += sy;
        }
      }
    }
    stamp(x, y, rows, palette, scale = 1) {
      rows.forEach((row, j) => [...row].forEach((v, i) => {
        if (palette[v]) this.rect(x + i * scale, y + j * scale, scale, scale, palette[v]);
      }));
    }
    glow(x, y, r, col) {
      const g = this.ctx.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, col);
      g.addColorStop(1, "transparent");
      this.ctx.fillStyle = g;
      this.ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    label(x, y, value, color, scale = 1, spacing = 1) {
      for (const ch of value.toUpperCase()) {
        const cols = letters[ch] || letters[" "];
        cols.forEach((bits, i) => {
          for (let j = 0; j < 7; j++) if (bits & 1 << j) this.rect(x + i * scale, y + j * scale, scale, scale, color);
        });
        x += (cols.length + spacing) * scale;
      }
    }
  };
  var letters = {
    A: [126, 9, 9, 9, 126],
    B: [127, 73, 73, 73, 54],
    C: [62, 65, 65, 65, 34],
    D: [127, 65, 65, 34, 28],
    E: [127, 73, 73, 73, 65],
    F: [127, 9, 9, 9, 1],
    G: [62, 65, 73, 73, 122],
    H: [127, 8, 8, 8, 127],
    I: [65, 127, 65],
    J: [32, 64, 65, 63, 1],
    K: [127, 8, 20, 34, 65],
    L: [127, 64, 64, 64, 64],
    M: [127, 2, 12, 2, 127],
    N: [127, 4, 8, 16, 127],
    O: [62, 65, 65, 65, 62],
    P: [127, 9, 9, 9, 6],
    Q: [62, 65, 81, 33, 94],
    R: [127, 9, 25, 41, 70],
    S: [70, 73, 73, 73, 49],
    T: [1, 1, 127, 1, 1],
    U: [63, 64, 64, 64, 63],
    V: [31, 32, 64, 32, 31],
    W: [127, 32, 24, 32, 127],
    X: [99, 20, 8, 20, 99],
    Y: [3, 4, 120, 4, 3],
    Z: [97, 81, 73, 69, 67],
    "0": [62, 81, 73, 69, 62],
    "1": [66, 127, 64],
    "2": [98, 81, 73, 73, 70],
    "3": [34, 65, 73, 73, 54],
    "4": [24, 20, 18, 127, 16],
    "5": [39, 69, 69, 69, 57],
    "6": [60, 74, 73, 73, 48],
    "7": [1, 113, 9, 5, 3],
    "8": [54, 73, 73, 73, 54],
    "9": [6, 73, 73, 41, 30],
    " ": [0, 0, 0],
    "-": [8, 8, 8],
    ".": [64],
    "/": [96, 16, 8, 4, 3],
    "!": [95],
    "?": [2, 1, 81, 9, 6],
    ":": [36]
  };
  function noise(x, y, seed = 0) {
    let n = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263) + seed * 1447;
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return (n ^ n >>> 16) >>> 0;
  }
  var sprite = [
    "....kkkkkkk....",
    "...klllllllk...",
    "..klhhhhhlhlk..",
    "..klhhhhhhlhk..",
    ".kllkkkffffkk..",
    ".kllkgggggfgk..",
    "..klkggggggkk..",
    "...kkfffkfkk...",
    "..kllvvvvvllk..",
    ".klhlvvvlllhhk.",
    ".klhlhhhlllhkk.",
    "..kfkllhbbbfk..",
    "..kkklbbabblk..",
    "....klllkkllk..",
    "....kllk.kllk..",
    "...kkkkk.kkkkk."
  ];
  function runner(g, x, y, color, tick, moving, face = 2) {
    const swing = moving && Math.floor(tick / 6) % 2 ? 1 : 0;
    const body = sprite.slice();
    if (swing) {
      body[14] = "...klllk..kllk.";
      body[15] = "..kkkkkk..kkkk.";
    }
    if (face === 1) {
      body[4] = ".klllhhhhhhkk..";
      body[5] = ".kllhhhhhhhlk..";
      body[6] = "..klllhhhhlkk..";
      body[7] = "...kklllllkk...";
    }
    const palette = { k: "#090e1a", l: "#354461", h: "#69769a", f: "#c7a990", g: color, v: color, b: "#222d43", a: "#e6bd73" };
    g.rect(x - 7, y + 5, 14, 3, "#0a1019");
    g.stamp(x - 7, y - 10 - swing, body, palette);
    g.rect(x - 4, y - 11 - swing, 5, 1, "#a0afc5");
  }
  var ECHO_COLORS = ["#b79aff", "#ff91b4", "#77c9ff", "#f7ca74", "#a2e1bd"];

  // src/render.ts
  var T = 24;
  var OX = 23;
  var OY = 23;
  var W = 598;
  var H = 334;
  var mint = "#74f4cc";
  var amber = "#ffcc65";
  var violet = "#bd9afa";
  var pos = (p2) => ({ x: OX + (p2.x + 0.5) * T, y: OY + (p2.y + 0.5) * T });
  var world = (p2) => ({ x: Math.round(OX + p2.x * T / UNIT), y: Math.round(OY + p2.y * T / UNIT) });
  var floor = (l, x, y) => l.tiles[y]?.[x] === ".";
  function tag(g, x, y, s2, col) {
    const w = s2.length * 6 + 5;
    g.rect(x - w / 2, y - 1, w, 10, "#0a111ced");
    g.rect(x - w / 2, y - 1, 1, 10, col);
    g.label(Math.round(x - w / 2 + 3), y, s2, col);
  }
  function crate(g, x, y, gold) {
    const top = gold ? "#615642" : "#374b61", rim = gold ? "#918068" : "#597187";
    g.rect(x + 1, y + 3, 22, 20, "#0d1824");
    g.rect(x + 2, y, 20, 17, top);
    g.rect(x + 2, y, 20, 2, rim);
    g.rect(x + 3, y + 3, 18, 12, "#1d2c3b");
    g.rect(x + 5, y + 4, 14, 9, top);
    g.line(x + 5, y + 4, x + 17, y + 12, rim);
    g.line(x + 17, y + 4, x + 5, y + 12, rim);
    g.rect(x + 2, y + 17, 20, 5, "#273541");
    g.rect(x + 4, y + 17, 2, 4, rim);
    g.rect(x + 18, y + 17, 2, 4, rim);
    g.rect(x + 9, y + 16, 6, 2, gold ? amber : "#93a7b8");
  }
  function server(g, x, y, n) {
    g.rect(x + 1, y + 2, 22, 21, "#101c2c");
    g.rect(x + 2, y, 20, 3, "#465d72");
    g.rect(x + 3, y + 3, 18, 17, "#24374c");
    for (let j = 0; j < 4; j++) {
      g.rect(x + 5, y + 4 + j * 4, 14, 3, "#0d1b2b");
      g.rect(x + 6, y + 5 + j * 4, 5, 1, "#4f6a79");
      g.rect(x + 15, y + 5 + j * 4, 2, 1, (n + j) % 3 === 0 ? amber : "#62c6bc");
    }
  }
  function surface(g, l) {
    g.rect(0, 0, W, H, "#0b111b");
    for (let x = 3; x < W; x += 8) for (let y = 3; y < H; y += 8) g.rect(x, y, 1, 1, "#263042");
    for (let i = 0; i < 4; i++) {
      const x = i % 2 ? W - 9 : 8, y = i < 2 ? 8 : H - 9;
      g.line(x, y, x + (i % 2 ? -6 : 6), y, "#5e7487");
      g.line(x, y, x, y + (i < 2 ? 6 : -6), "#5e7487");
    }
    const vaultX = l.gates.at(-1)?.x ?? 15;
    for (let r = 0; r < l.tiles.length; r++) for (let c = 0; c < l.tiles[r].length; c++) {
      const x = OX + c * T, y = OY + r * T, n = noise(c, r), gold = c > vaultX;
      if (floor(l, c, r)) {
        const fills = gold ? ["#363c40", "#373c41", "#333a3e", "#343b41"] : ["#263542", "#293744", "#283642", "#2b3945"];
        g.rect(x, y, T, T, "#17232f");
        g.rect(x + 1, y + 1, T - 1, T - 1, fills[n % 4]);
        g.rect(x + 1, y + 1, T - 2, 1, gold ? "#45494a" : "#34434e");
        g.rect(x + 1, y + 2, 1, T - 4, "#31404a");
        if (n % 4 === 0) {
          g.rect(x + 3, y + 3, 2, 1, "#52616a");
          g.rect(x + 20, y + 20, 1, 1, "#17252f");
        }
        if (n % 7 === 0) {
          g.rect(x + 6, y + 14, 7, 1, "#34424b");
          g.rect(x + 13, y + 13, 3, 1, "#34424b");
        }
        if (n % 29 === 0) {
          g.rect(x + 5, y + 6, 14, 11, "#1b2935");
          for (let i = 0; i < 4; i++) g.rect(x + 7, y + 7 + i * 2, 10, 1, "#42525e");
        }
        if (!floor(l, c, r - 1)) {
          g.rect(x, y, 24, 5, "#101b2680");
          g.rect(x, y + 5, 24, 2, "#15222d55");
        }
        if (!floor(l, c - 1, r)) g.rect(x, y, 3, 24, "#121e2a77");
      } else {
        const edge = [-1, 0, 1].some((d) => [-1, 0, 1].some((e) => floor(l, c + d, r + e)));
        if (!edge) continue;
        if (l.tiles[r][c] === "C") {
          crate(g, x, y, gold);
          continue;
        }
        if (l.tiles[r][c] === "S") {
          server(g, x, y, n);
          continue;
        }
        g.rect(x, y, T, T, "#0c1420");
        g.rect(x + 1, y + 1, 23, 17, gold ? "#444950" : "#334557");
        g.rect(x + 1, y + 1, 22, 2, gold ? "#747674" : "#566a7b");
        g.rect(x + 2, y + 4, 20, 11, gold ? "#383f46" : "#2a394c");
        g.rect(x + 3, y + 5, 18, 1, "#435362");
        g.rect(x + 2, y + 16, 20, 2, "#172333");
        g.rect(x + 1, y + 18, 22, 4, "#1c2a38");
        g.rect(x + 2, y + 19, 20, 1, "#354454");
        if (floor(l, c, r + 1)) {
          if (n % 4 === 0) {
            g.rect(x + 3, y + 14, 17, 6, "#172534");
            g.rect(x + 5, y + 15, 13, 2, gold ? "#ddad63" : "#74c5cc");
          } else {
            for (let k = 0; k < 5; k++) g.rect(x + 4 + k * 3, y + 16, 2, 4, "#0c1927");
          }
        }
        if (n % 3 === 0) for (let k = 0; k < 4; k++) g.rect(x + 5 + k * 4, y + 5, 2, 7, "#1b2a39");
        if (!floor(l, c, r + 1) && n % 5 === 0) {
          g.rect(x + 4, y + 11, 4, 2, "#768595");
          g.rect(x + 9, y + 11, 2, 2, "#9da6aa");
        }
      }
    }
    l.gates.forEach((gk, i) => {
      const a = pos(gk.source), b = pos(gk), col = i % 2 ? "#6f627f" : "#47726e";
      g.line(a.x, a.y, b.x, a.y, col);
      g.line(b.x, a.y, b.x, b.y, col);
      for (let x = Math.min(a.x, b.x) + 5; x < Math.max(a.x, b.x); x += 11) g.rect(x, a.y - 1, 3, 3, col);
    });
  }
  function diamond(g, x, y, small, t) {
    const dy = Math.floor(Math.sin(t / 15) * 1.5), s2 = small ? 1 : 2;
    g.glow(x, y, small ? 12 : 27, small ? "#ab89fb26" : "#ffc94746");
    g.rect(x - (small ? 4 : 9), y + 6, small ? 8 : 18, 3, "#101820");
    const art = ["...aaa...", "..abcca..", ".abddcca.", "abdeedcca", ".acddcca.", "..accca..", "...aca...", "....a...."];
    g.stamp(x - 4 * s2, y - 5 * s2 + dy, art, small ? { a: "#8d66b6", b: "#d4b8ff", c: "#9977d6", d: "#d4baee", e: "#eee4ff" } : { a: "#bc7c38", b: "#fff4b5", c: "#e8a64b", d: "#ffd86a", e: "#ffffda" }, s2);
  }
  var Feed = class {
    constructor(canvas, l) {
      __publicField(this, "g");
      __publicField(this, "cache");
      __publicField(this, "level");
      __publicField(this, "flash", 0);
      __publicField(this, "doors", []);
      __publicField(this, "endGlow", 0);
      this.g = new Pixels(canvas, W, H);
      this.cache = document.createElement("canvas");
      this.level = l;
      this.setLevel(l);
    }
    setLevel(l) {
      this.level = l;
      this.doors = l.gates.map(() => 0);
      surface(new Pixels(this.cache, W, H), l);
    }
    draw(s2, frame2, reduced) {
      const g = this.g, l = s2.level, t = reduced ? 0 : frame2;
      g.ctx.drawImage(this.cache, 0, 0);
      const ex = pos(l.exit);
      g.rect(ex.x - 10, ex.y - 9, 20, 18, "#102b2c");
      for (const a of [-1, 1]) for (const b of [-1, 1]) {
        const x = ex.x + 9 * a, y = ex.y + 8 * b;
        g.rect(x - (a > 0 ? 4 : 0), y, 5, 2, mint);
        g.rect(x, y - (b > 0 ? 4 : 0), 2, 5, mint);
      }
      for (let j = -1; j <= 1; j++) for (let i = 0; i < 3; i++) g.rect(ex.x + i - 2, ex.y + j * 4 + Math.abs(i - 1), 1, 1, mint);
      tag(g, ex.x, ex.y + 13, "EXIT", "#84c7b8");
      l.gates.forEach((k, i) => {
        const a = pos(k.source), b = pos(k), on = s2.actors.some((e) => !e.caught && near(e, k.source, 112)), col = k.kind === "pulse" ? "#8ebdff" : violet;
        g.rect(a.x - 10, a.y - 7, 20, 16, "#111725");
        g.rect(a.x - 9, a.y - 8, 18, 14, on ? "#9880c6" : "#726086");
        g.rect(a.x - 7, a.y - 6, 14, 10, "#352e46");
        g.rect(a.x - 5, a.y - 5, 10, 8, on ? col : "#675375");
        for (let j = 0; j < 3; j++) g.rect(a.x - 4, a.y - 3 + j * 2, 8, 1, col);
        tag(g, a.x, a.y + 11, (k.kind === "pulse" ? "PULSE " : "PAD ") + String.fromCharCode(65 + i), col);
        g.rect(b.x - 12, b.y - 12, 24, 24, "#13212c");
        for (let j = 0; j < 6; j++) {
          g.rect(b.x - 12 + j * 4, b.y - 12, 2, 2, amber);
          g.rect(b.x - 12 + j * 4, b.y + 10, 2, 2, amber);
        }
        const goal = s2.doors[i] ? 1 : 0;
        this.doors[i] = reduced ? goal : this.doors[i] + (goal - this.doors[i]) * 0.3;
        const h = Math.round(10 * (1 - this.doors[i]));
        for (const side of [-1, 1]) {
          const y = side === -1 ? b.y - 10 : b.y + 10 - h;
          if (h) {
            g.rect(b.x - 11, y, 22, h, "#5c5660");
            g.rect(b.x - 9, y, 8, h, "#403d4b");
            g.rect(b.x + 2, y, 7, h, "#4b4653");
          }
          g.rect(b.x - 11, side === -1 ? b.y - 10 + h : b.y + 9 - h, 22, 1, goal ? mint : "#ff7779");
        }
        if (l.gates.length === 1 && !s2.doors[i]) tag(g, b.x, b.y + 14, "LOCKED", "#f39395");
        if (k.kind === "pulse" && s2.doors[i]) g.rect(b.x - 10, b.y - 14, 20 * Math.max(0, s2.pulses[i] - s2.tick) / 150, 2, "#9ac6ff");
      });
      if (l.patrol) {
        const b = pos(l.patrol.bell);
        g.rect(b.x - 8, b.y - 7, 16, 14, "#382c2c");
        for (let i = 0; i < 4; i++) g.rect(b.x - 6 + i * 3, b.y - 5, 2, 10, "#d68d64");
        tag(g, b.x, b.y + 11, "BUZZER", amber);
        const q = world(s2.guard);
        if (!s2.distracted) {
          for (let y = q.y - 107; y <= q.y + 107; y += 3) for (let x = q.x - 107; x <= q.x + 107; x += 3) {
            const probe = { ...s2.player, x: (x - OX) * UNIT / T, y: (y - OY) * UNIT / T, caught: false };
            if (s2.sees(probe, l.patrol)) g.rect(x, y, 3, 3, "#ff777433");
          }
        }
        runner(g, q.x, q.y, "#fb7e87", t, true);
        tag(g, q.x, q.y - 23, s2.distracted ? "?" : "SEC", "#fb979e");
      }
      const tr = pos(l.loot);
      g.rect(tr.x - 14, tr.y + 3, 28, 11, "#151d27");
      g.rect(tr.x - 12, tr.y, 24, 10, "#6c624b");
      g.rect(tr.x - 10, tr.y + 1, 20, 6, "#292c30");
      g.rect(tr.x - 8, tr.y + 8, 16, 1, amber);
      if (!s2.loot) {
        diamond(g, tr.x, tr.y - 5, false, t);
        tag(g, tr.x, tr.y + 14, "LOOT", amber);
      }
      if (!s2.bonus) {
        const b = pos(l.bonus);
        diamond(g, b.x, b.y, true, t);
      }
      s2.actors.forEach((actor, i) => {
        const live = actor === s2.player, q = world(actor), col = live ? mint : ECHO_COLORS[i % ECHO_COLORS.length];
        g.ctx.globalAlpha = actor.caught ? 0.4 : live ? 1 : 0.88;
        g.glow(q.x, q.y, live ? 22 : 16, live ? "#64f7c731" : "#ae86f72f");
        if (!live) {
          g.rect(q.x - 8, q.y + 6, 16, 1, col);
          g.rect(q.x - 6, q.y + 8, 12, 1, col);
        }
        runner(g, q.x, q.y, col, t, actor.walking && s2.started, actor.face);
        if (live) {
          g.rect(q.x - 6, q.y + 7, 12, 1, mint);
          tag(g, q.x, q.y - 25, "YOU", mint);
        } else if (!near(s2.player, { x: actor.x / UNIT - 0.5, y: actor.y / UNIT - 0.5 }, 155)) {
          tag(g, q.x, q.y - 22, "E" + (i + 1), col);
        }
        g.ctx.globalAlpha = 1;
      });
      if (this.flash > 0) {
        if (!reduced) {
          g.rect(0, 0, W, H, "rgba(161,140,245," + this.flash * 0.23 + ")");
          for (let j = 0; j < 7; j++) {
            const y = (j * 53 + Math.floor(this.flash * 80)) % H;
            g.rect(0, y, W, 2, "#c7b7ff70");
          }
        }
        this.flash = Math.max(0, this.flash - 0.05);
      }
      if (this.endGlow > 0) {
        g.glow(tr.x, tr.y, 40, "#ffd66f55");
        this.endGlow -= 0.02;
      }
      if (s2.tick > LIMIT - 300) g.rect(0, H - 2, W, 2, "#ee787e");
    }
  };

  // src/audio.ts
  var AudioDeck = class {
    constructor() {
      __publicField(this, "ctx");
      __publicField(this, "bus");
      __publicField(this, "muted", false);
      __publicField(this, "active", false);
      __publicField(this, "next", 0);
      __publicField(this, "beat", 0);
    }
    wake() {
      if (!this.ctx) {
        try {
          this.ctx = new AudioContext();
          this.bus = this.ctx.createGain();
          this.bus.gain.value = this.muted ? 0 : 0.48;
          this.bus.connect(this.ctx.destination);
        } catch {
          return;
        }
      }
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {
      });
    }
    toggle() {
      this.muted = !this.muted;
      if (this.bus && this.ctx) this.bus.gain.setTargetAtTime(this.muted ? 0 : 0.48, this.ctx.currentTime, 0.02);
    }
    tone(f, end, len, type, vol, delay = 0) {
      const c = this.ctx;
      if (!c || !this.bus || this.muted || c.state !== "running") return;
      const at = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, at);
      o.frequency.exponentialRampToValueAtTime(end, at + len);
      g.gain.setValueAtTime(1e-4, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 8e-3);
      g.gain.exponentialRampToValueAtTime(1e-4, at + len);
      o.connect(g);
      g.connect(this.bus);
      o.start(at);
      o.stop(at + len + 0.02);
    }
    effect(cue) {
      if (cue === "rewind" || cue === "undo" || cue === "retry") {
        this.tone(910, 65, 0.26, "sawtooth", 0.11);
        this.tone(190, 780, 0.16, "triangle", 0.13, 0.08);
      }
      if (cue === "door" || cue === "lock") {
        this.tone(cue === "door" ? 180 : 360, cue === "door" ? 640 : 120, 0.18, "triangle", 0.22);
      }
      if (cue === "loot" || cue === "bonus" || cue === "clear") {
        (cue === "clear" ? [392, 494, 587, 784, 988] : [587, 784, 988]).forEach((f, i) => this.tone(f, f, 0.23, "square", 0.056, i * 0.083));
      }
      if (cue === "alarm" || cue === "caught") {
        this.tone(330, 190, 0.28, "sawtooth", 0.15);
        this.tone(280, 135, 0.32, "triangle", 0.16, 0.14);
      }
      if (cue === "pulse") this.tone(600, 1100, 0.22, "sine", 0.16);
      if (cue === "empty") this.tone(95, 90, 0.07, "sine", 0.12);
    }
    music() {
      if (!this.ctx || !this.active || this.muted || this.ctx.state !== "running") return;
      const now = this.ctx.currentTime;
      if (now < this.next) return;
      this.next = now + 0.31;
      const bass = [55, 55, 65.406, 49][Math.floor(this.beat / 16) % 4];
      if (this.beat % 4 === 0) {
        this.tone(bass, bass, 0.55, "triangle", 0.16);
        this.tone(84, 36, 0.12, "sine", 0.14);
      }
      if (this.beat % 2 === 0) {
        const f = bass * [4, 6, 8, 7.12, 4.76, 6, 8, 9.52][Math.floor(this.beat / 2) % 8];
        this.tone(f, f, 0.21, "sine", 0.064);
      }
      if (this.beat % 4 === 2) this.tone(1900, 620, 0.04, "triangle", 0.028);
      this.beat++;
    }
  };

  // src/main.ts
  var s = new Heist(company);
  var feed = new Feed(document.querySelector("canvas"), company);
  var audio = new AudioDeck();
  var input = 0;
  var use = 0;
  var last = performance.now();
  var clock = new Clock();
  var keys = { w: UP, a: LEFT, s: DOWN, d: RIGHT, arrowup: UP, arrowdown: DOWN, arrowleft: LEFT, arrowright: RIGHT };
  onkeydown = (e) => {
    audio.wake();
    const k = e.key.toLowerCase();
    if (k === "m" && !e.repeat) audio.toggle();
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
    for (const cue of s.cues.splice(0)) {
      audio.effect(cue);
      if (["rewind", "undo"].includes(cue)) feed.flash = 1;
    }
    audio.active = s.started && !s.paused && !s.won;
    audio.music();
    feed.draw(s, t * 0.06, false);
    document.querySelector("#info").textContent = s.won ? "ESCAPED" : "Loop " + (s.tracks.length + 1) + " | " + ((1800 - s.tick) / 60).toFixed(1) + " seconds" + (s.paused ? " | PAUSED" : "");
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
