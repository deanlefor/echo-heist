"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
  var __publicField = (obj, key2, value) => __defNormalProp(obj, typeof key2 !== "symbol" ? key2 + "" : key2, value);

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
      "##.SS...#..SS...#....##",
      "#.......#.......#.....#",
      "#.......#.......#.....#",
      "#.CC....#..CC...#..SS.#",
      "#.......#.......#.....#",
      "#.....................#",
      "#.......#.......#.....#",
      "#.......#.......#.....#",
      "#..CC...#....CC.#..CC.#",
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
  var first = {
    title: "The First Echo",
    site: "Meridian Depository",
    item: "Prism core",
    brief: "Lift the prism core from the vault and return to the extraction pad.",
    hint: "Stand on pad A and press R. Your Echo will hold the door while you collect the core with E.",
    quip: "Meridian has filed a complaint against both of you.",
    tiles: [
      "#######################",
      "###SS....######....SS##",
      "##........#####.......#",
      "#..........#..........#",
      "#.CC.......#.......CC.#",
      "#..........#..........#",
      "#.....................#",
      "#..........#..........#",
      "#.....CC...#..CC......#",
      "##.........#......SSS.#",
      "###SS.....###........##",
      "#######################"
    ],
    start: p(4, 6),
    exit: p(3, 8),
    loot: p(18, 5),
    bonus: p(19, 2),
    gates: [gate(11, 6, 7, 3)],
    par: 2,
    target: 20
  };
  var distraction = {
    title: "The Distraction",
    site: "Hushline Archives",
    item: "Voice cipher",
    brief: "Draw the sentry away with the floor buzzer. Slip past its sightline and steal the voice cipher.",
    hint: "Leave an Echo on the buzzer. The guard investigates for as long as someone keeps it ringing.",
    quip: "The guard insists the floor called him first.",
    tiles: [
      "#######################",
      "####SSS...####....SS###",
      "##........####........#",
      "#..........###.....CC.#",
      "#..CC......###........#",
      "#..........###........#",
      "#.....................#",
      "#..........###........#",
      "#..........###.....CC.#",
      "##..SS....####........#",
      "###......#####....SS###",
      "#######################"
    ],
    start: p(3, 6),
    exit: p(2, 7),
    loot: p(19, 5),
    bonus: p(18, 8),
    gates: [],
    patrol: { from: p(15, 6), to: p(16, 6), look: p(-1, 0), bell: p(6, 3) },
    par: 2,
    target: 24
  };
  var timing = {
    title: "Perfect Timing",
    site: "Pendulum Works",
    item: "Phase crystal",
    brief: "Pulse the relay to open the shutter for 2.5 seconds. Take the crystal to the far lift.",
    hint: "Walk to the relay and tap E. Rewind. On the next run, head straight for the shutter while your Echo repeats the pulse.",
    quip: "The clockwork was perfect. The payroll was off by one.",
    tiles: [
      "#######################",
      "##.....SS...####...SS##",
      "#...........###.......#",
      "#.......CC...##.......#",
      "#.......CC...##.......#",
      "#............##...CC..#",
      "#............##.......#",
      "#.....................#",
      "#............##.......#",
      "##..SS......###.......#",
      "###........####....SS##",
      "#######################"
    ],
    start: p(3, 7),
    exit: p(20, 8),
    loot: p(18, 3),
    bonus: p(16, 9),
    gates: [gate(14, 7, 4, 2, "pulse")],
    par: 2,
    target: 17
  };
  var score = {
    title: "The Big Score",
    site: "Parallax Treasury",
    item: "Blackstar diamond",
    brief: "Beat the pressure lock, divert the guard and pulse the inner vault. Get the Blackstar to the east lift.",
    hint: "Assign one Echo to pad A and another to the buzzer. Record a relay pulse after both reach their posts, then make the final dash.",
    quip: "Four faces on camera. Somehow, only one name on the invoice.",
    tiles: [
      "#######################",
      "##.SS...#...SS..#....##",
      "#.......#.......#.....#",
      "#.......#.......#.....#",
      "#..CC...#....C..#..SS.#",
      "#.......#.......#.....#",
      "#.....................#",
      "#.......#.......#.....#",
      "#.......#.......#.....#",
      "#...CC..#..C....#.....#",
      "##......#.......#....##",
      "#######################"
    ],
    start: p(3, 6),
    exit: p(20, 8),
    loot: p(20, 3),
    bonus: p(18, 9),
    gates: [gate(8, 6, 5, 3), gate(16, 6, 10, 2, "pulse")],
    patrol: { from: p(18, 6), to: p(19, 6), look: p(-1, 0), bell: p(10, 8) },
    par: 4,
    target: 37
  };
  var levels = [first, company, distraction, timing, score];

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
  var center = (p2) => ({
    x: p2.x * UNIT + UNIT / 2,
    y: p2.y * UNIT + UNIT / 2
  });
  var tile = (a) => ({
    x: Math.floor(a.x / UNIT),
    y: Math.floor(a.y / UNIT)
  });
  var near = (a, b, r = 125) => Math.abs(a.x - (b.x + 0.5) * UNIT) <= r && Math.abs(a.y - (b.y + 0.5) * UNIT) <= r;
  var atControl = (a, g) => near(a, g.source, g.kind === "pulse" ? 185 : 112);
  var spawn = (level) => ({
    ...center(level.start),
    face: DOWN,
    walking: false,
    caught: false
  });
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
      __publicField(this, "trace", []);
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
      this.trace = [center(this.level.start)];
      this.cues = [];
      this.actors = Array.from(
        { length: this.tracks.length + 1 },
        () => spawn(this.level)
      );
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
      this.tracks.push({
        commands: this.commands,
        activity: this.activity,
        trace: this.trace
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
      if (depth < 0 || depth > UNIT * 4.4 || Math.abs(dx * patrol.look.y - dy * patrol.look.x) > UNIT * 0.42 + depth * 0.48)
        return false;
      const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (UNIT / 8));
      for (let i = 1; i < steps; i++)
        if (this.blocked(
          this.guard.x + dx * i / steps,
          this.guard.y + dy * i / steps
        ))
          return false;
      return true;
    }
    security() {
      const patrol = this.level.patrol;
      if (!patrol) return;
      const from = center(patrol.from), to = center(patrol.to), phase = 120 - Math.abs(this.tick % 240 - 120);
      const patrolX = from.x + Math.trunc((to.x - from.x) * phase / 120), patrolY = from.y + Math.trunc((to.y - from.y) * phase / 120);
      const divert = this.actors.some((a) => !a.caught && near(a, patrol.bell));
      if (divert && !this.distracted) this.cues.push("alarm");
      this.distracted = divert;
      const targetX = divert ? from.x : patrolX, targetY = divert ? from.y - UNIT : patrolY;
      this.guard.x += Math.max(-6, Math.min(6, targetX - this.guard.x));
      this.guard.y += Math.max(-6, Math.min(6, targetY - this.guard.y));
      for (const a of this.actors)
        if (this.sees(a, patrol)) {
          a.caught = true;
          a.walking = false;
          if (a === this.player) this.cues.push("caught");
        }
    }
    step(input) {
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
      this.level.gates.forEach((g, i) => {
        const onPad = this.actors.some((a) => !a.caught && atControl(a, g));
        if (g.kind === "pulse" && this.actors.some(
          (a, n) => !a.caught && inputs[n] & USE && atControl(a, g)
        )) {
          this.pulses[i] = this.tick + 150;
          this.cues.push("pulse");
        }
        const held = this.doors[i] && this.actors.some((a) => !a.caught && near(a, g, UNIT / 2 + RADIUS));
        const open = (g.kind === "plate" ? onPad : this.pulses[i] > this.tick) || held;
        if (open !== this.doors[i]) this.cues.push(open ? "door" : "lock");
        this.doors[i] = open;
      });
      if (!this.player.caught) {
        if (input & USE) {
          if (!this.loot && near(this.player, this.level.loot, 205)) {
            this.loot = true;
            this.cues.push("loot");
          } else if (!this.bonus && near(this.player, this.level.bonus, 190)) {
            this.bonus = true;
            this.cues.push("bonus");
          } else if (!this.level.gates.some(
            (g) => g.kind === "pulse" && atControl(this.player, g)
          ))
            this.cues.push("empty");
        }
        if (this.loot && near(this.player, this.level.exit, 126)) {
          this.won = true;
          this.cues.push("clear");
        }
      }
      this.activity.push(
        this.level.gates.some((g) => atControl(this.player, g)) || !!(this.level.patrol && near(this.player, this.level.patrol.bell)) ? 2 : input & USE ? 3 : this.player.walking ? 1 : 0
      );
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
      this.ctx.fillRect(
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h)
      );
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
      rows.forEach(
        (row, j) => [...row].forEach((v, i) => {
          if (palette[v])
            this.rect(x + i * scale, y + j * scale, scale, scale, palette[v]);
        })
      );
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
          for (let j = 0; j < 7; j++)
            if (bits & 1 << j)
              this.rect(x + i * scale, y + j * scale, scale, scale, color);
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
    if (face === 4 || face === 8) {
      body[4] = "..klkkfffffkk..";
      body[5] = "..klhgggggffk..";
      body[6] = "..klhhggggfkk..";
      if (face === 4)
        for (let j = 0; j < body.length; j++)
          body[j] = [...body[j]].reverse().join("");
    }
    const palette = {
      k: "#090e1a",
      l: "#4a5272",
      h: "#929abd",
      f: "#c7a990",
      g: color,
      v: color,
      b: "#222d43",
      a: "#e6bd73"
    };
    g.rect(x - 7, y + 5, 14, 3, "#0a1019");
    g.stamp(x - 7, y - 10 - swing, body, palette);
    g.rect(x - 4, y - 11 - swing, 5, 1, "#a0afc5");
  }
  var ECHO_COLORS = [
    "#b79aff",
    "#ff91b4",
    "#77c9ff",
    "#f7ca74",
    "#a2e1bd"
  ];

  // src/render.ts
  var T = 24;
  var OX = 23;
  var OY = 23;
  var W = 598;
  var H = 334;
  var mint = "#74f4cc";
  var amber = "#ffcc65";
  var violet = "#bd9afa";
  var pos = (p2) => ({
    x: OX + (p2.x + 0.5) * T,
    y: OY + (p2.y + 0.5) * T
  });
  var world = (p2) => ({
    x: Math.round(OX + p2.x * T / UNIT),
    y: Math.round(OY + p2.y * T / UNIT)
  });
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
    for (let x = 3; x < W; x += 8)
      for (let y = 3; y < H; y += 8) g.rect(x, y, 1, 1, "#263042");
    for (let i = 0; i < 4; i++) {
      const x = i % 2 ? W - 9 : 8, y = i < 2 ? 8 : H - 9;
      g.line(x, y, x + (i % 2 ? -6 : 6), y, "#5e7487");
      g.line(x, y, x, y + (i < 2 ? 6 : -6), "#5e7487");
    }
    const vaultX = l.gates.at(-1)?.x ?? 15;
    for (let r = 0; r < l.tiles.length; r++)
      for (let c = 0; c < l.tiles[r].length; c++) {
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
            for (let i = 0; i < 4; i++)
              g.rect(x + 7, y + 7 + i * 2, 10, 1, "#42525e");
          }
          if (!floor(l, c, r - 1)) {
            g.rect(x, y, 24, 5, "#101b2680");
            g.rect(x, y + 5, 24, 2, "#15222d55");
          }
          if (!floor(l, c - 1, r)) g.rect(x, y, 3, 24, "#121e2a77");
        } else {
          const edge = [-1, 0, 1].some(
            (d) => [-1, 0, 1].some((e) => floor(l, c + d, r + e))
          );
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
              for (let k = 0; k < 5; k++)
                g.rect(x + 4 + k * 3, y + 16, 2, 4, "#0c1927");
            }
          }
          if (n % 3 === 0)
            for (let k = 0; k < 4; k++)
              g.rect(x + 5 + k * 4, y + 5, 2, 7, "#1b2a39");
          if (!floor(l, c, r + 1) && n % 5 === 0) {
            g.rect(x + 4, y + 11, 4, 2, "#768595");
            g.rect(x + 9, y + 11, 2, 2, "#9da6aa");
          }
        }
      }
    const lamps = [];
    for (let y = 0; y < l.tiles.length - 1; y++)
      for (let x = 1; x < 22; x++) {
        if (l.tiles[y][x] !== "#" || !floor(l, x, y + 1) || floor(l, x, y - 1))
          continue;
        if ((x + 2 * y) % 5 !== 0) continue;
        const px = OX + x * T, py = OY + y * T, warm = x > vaultX;
        g.rect(px + 2, py + 13, 20, 7, "#101a25");
        g.rect(px + 4, py + 14, 16, 2, warm ? "#ecd393" : "#9ae8e0");
        g.rect(px + 5, py + 16, 14, 1, warm ? "#b89b5c" : "#459a9c");
        g.glow(px + 12, py + 27, 46, warm ? "#e8b65c28" : "#6edfd034");
        lamps.push({ x: px + 12, y: py + 18 });
      }
    for (let y = 0; y < l.tiles.length; y++)
      for (let x = 0; x < l.tiles[y].length; x++) {
        if (l.tiles[y][x] !== "S") continue;
        const px = OX + x * T, py = OY + y * T;
        if (l.tiles[y][x - 1] !== "S") {
          g.rect(px + 1, py + 2, 21, 19, "#0a1522");
          g.rect(px + 2, py, 19, 13, "#4b6172");
          g.rect(px + 4, py + 2, 15, 10, "#14383e");
          g.rect(px + 5, py + 3, 13, 1, "#70caba");
          for (let j = 0; j < 3; j++) {
            g.rect(px + 5, py + 5 + j * 2, 3 + noise(x, j) % 8, 1, "#50aa9c");
          }
          g.rect(px + 3, py + 14, 17, 5, "#3c5164");
          g.rect(px + 5, py + 15, 6, 2, "#9abdca");
          g.rect(px + 15, py + 15, 3, 2, "#d9b178");
          g.rect(px + 4, py + 19, 2, 3, "#58697a");
          g.rect(px + 16, py + 19, 2, 3, "#58697a");
          g.glow(px + 11, py + 8, 22, "#6ee1d92a");
        }
      }
    const a = pos(l.start), v = pos(l.loot);
    g.label(a.x - 16, a.y - 46, "01", "#4d616a", 2);
    g.label(v.x - 45, v.y + 48, "VAULT", "#655f50");
    for (let i = 0; i < 4; i++) {
      const x = v.x - 17 + i * 8;
      for (let j = 0; j < 3; j++) g.rect(x + j, v.y + 34 - j, 4, 1, "#8b7855");
    }
    for (const lamp of lamps) {
      g.rect(lamp.x - 7, lamp.y - 3, 14, 1, "#d4e2d4");
    }
    l.gates.forEach((gate2, i) => {
      const a2 = pos(gate2.source), b = pos(gate2), col = i % 2 ? "#7a698e" : "#527a77";
      g.line(a2.x, a2.y, a2.x, b.y, col);
      g.line(a2.x, b.y, b.x, b.y, col);
      for (let x = Math.min(a2.x, b.x) + 5; x < Math.max(a2.x, b.x); x += 11)
        g.rect(x, b.y - 1, 3, 3, col);
    });
    g.glow(a.x - 40, a.y, 84, "#3bbaad16");
    g.glow(v.x, v.y, 95, "#e4a84621");
  }
  function diamond(g, x, y, small, t) {
    const dy = Math.floor(Math.sin(t / 15) * 1.5), s2 = small ? 1 : 2;
    g.glow(x, y, small ? 12 : 27, small ? "#ab89fb26" : "#ffc94746");
    g.rect(x - (small ? 4 : 9), y + 6, small ? 8 : 18, 3, "#101820");
    const art = [
      "...aaa...",
      "..abcca..",
      ".abddcca.",
      "abdeedcca",
      ".acddcca.",
      "..accca..",
      "...aca...",
      "....a...."
    ];
    g.stamp(
      x - 4 * s2,
      y - 5 * s2 + dy,
      art,
      small ? { a: "#8d66b6", b: "#d4b8ff", c: "#9977d6", d: "#d4baee", e: "#eee4ff" } : {
        a: "#bc7c38",
        b: "#fff4b5",
        c: "#e8a64b",
        d: "#ffd86a",
        e: "#ffffda"
      },
      s2
    );
  }
  var trophies = {
    "Bearer bonds": [
      "..aaaaaaa.",
      ".abbbffffa",
      "abbbbfcffa",
      "acccccccca",
      "adbbbfbbda",
      "acccccccca",
      "addddcddda",
      ".aaaaaaaa."
    ],
    "Voice cipher": [
      ".aaaaaaaa.",
      "abbbbbbbba",
      "abddffddba",
      "abddffddba",
      "acccccccca",
      "acfffffcca",
      ".aaaaaaaa."
    ],
    "Phase crystal": [
      ".aaaaaaaa.",
      "..bffffb..",
      "..abffba..",
      "...acc a..",
      "....bf....",
      "...acc a..",
      "..abccba..",
      "..bccccb..",
      ".aaaaaaaa."
    ],
    "Blackstar diamond": [
      "...aaaa...",
      "..abffba..",
      ".abbddcba.",
      "abfddddcba",
      ".acddddca.",
      "..acddca..",
      "...acca...",
      "....aa...."
    ]
  };
  function trophy(g, l, x, y, t) {
    const art = trophies[l.item];
    if (!art) {
      diamond(g, x, y, false, t);
      return;
    }
    const star = l.item === "Blackstar diamond";
    g.glow(x, y, 30, star ? "#bfa1ee49" : "#ffc94746");
    g.stamp(
      x - 10,
      y - art.length + Math.floor(Math.sin(t / 15) * 1.5),
      art,
      {
        a: star ? "#dcad77" : "#ae763d",
        b: "#ffe18c",
        c: star ? "#84628d" : "#d79a53",
        d: star ? "#544161" : "#5c4e48",
        f: "#fff7c5"
      },
      2
    );
  }
  var Feed = class {
    constructor(canvas, l) {
      __publicField(this, "paths", false);
      __publicField(this, "target");
      __publicField(this, "g");
      __publicField(this, "cache");
      __publicField(this, "level");
      __publicField(this, "flash", 0);
      __publicField(this, "doors", []);
      __publicField(this, "endGlow", 0);
      __publicField(this, "escape", 0);
      this.g = new Pixels(canvas, W, H);
      this.cache = document.createElement("canvas");
      this.level = l;
      this.setLevel(l);
    }
    tileAt(u, v) {
      return { x: Math.floor((u * W - OX) / T), y: Math.floor((v * H - OY) / T) };
    }
    setLevel(l) {
      this.level = l;
      this.doors = l.gates.map(() => 0);
      surface(new Pixels(this.cache, W, H), l);
    }
    draw(s2, frame2, reduced2) {
      const g = this.g, l = s2.level, t = reduced2 ? 0 : frame2;
      g.ctx.drawImage(this.cache, 0, 0);
      if (this.paths)
        s2.tracks.forEach((track, i) => {
          const color = ECHO_COLORS[i % ECHO_COLORS.length];
          g.ctx.globalAlpha = 0.52;
          for (const point of track.trace) {
            const p2 = world(point);
            g.rect(p2.x, p2.y, 2, 2, color);
          }
          g.ctx.globalAlpha = 1;
        });
      if (this.target) {
        const p2 = pos(this.target);
        for (const dx of [-1, 1])
          for (const dy of [-1, 1]) {
            g.line(
              p2.x + dx * 8,
              p2.y + dy * 8,
              p2.x + dx * 5,
              p2.y + dy * 8,
              "#bce9da"
            );
            g.line(
              p2.x + dx * 8,
              p2.y + dy * 8,
              p2.x + dx * 8,
              p2.y + dy * 5,
              "#bce9da"
            );
          }
      }
      const ex = pos(l.exit);
      g.rect(ex.x - 10, ex.y - 9, 20, 18, "#102b2c");
      for (const a of [-1, 1])
        for (const b of [-1, 1]) {
          const x = ex.x + 9 * a, y = ex.y + 8 * b;
          g.rect(x - (a > 0 ? 4 : 0), y, 5, 2, mint);
          g.rect(x, y - (b > 0 ? 4 : 0), 2, 5, mint);
        }
      for (let j = -1; j <= 1; j++)
        for (let i = 0; i < 3; i++)
          g.rect(ex.x + i - 2, ex.y + j * 4 + Math.abs(i - 1), 1, 1, mint);
      tag(g, ex.x, ex.y + 13, "EXIT", "#84c7b8");
      l.gates.forEach((k, i) => {
        const a = pos(k.source), b = pos(k), on = s2.actors.some((e) => !e.caught && atControl(e, k)), col = k.kind === "pulse" ? "#8ebdff" : violet;
        if (on) {
          g.glow(a.x, a.y, 34, "#bba1ff66");
          const light2 = i % 2 ? "#c6a2f2" : "#82c8b3";
          g.line(a.x, a.y, a.x, b.y, light2);
          g.line(a.x, b.y, b.x, b.y, light2);
          const seg = Math.abs(b.y - a.y) + Math.abs(b.x - a.x), progress = Math.floor(t * 0.8) % Math.max(seg, 1);
          const sy = Math.min(progress, Math.abs(b.y - a.y)), sx = progress - sy;
          g.rect(
            a.x + sx * Math.sign(b.x - a.x) - 1,
            a.y + sy * Math.sign(b.y - a.y) - 1,
            3,
            3,
            "#c4e9d7"
          );
        }
        g.rect(a.x - 10, a.y - 7, 20, 16, "#111725");
        g.rect(a.x - 9, a.y - 8, 18, 14, on ? "#9880c6" : "#726086");
        g.rect(a.x - 7, a.y - 6, 14, 10, "#352e46");
        g.rect(a.x - 5, a.y - 5, 10, 8, on ? col : "#675375");
        for (let j = 0; j < 3; j++) g.rect(a.x - 4, a.y - 3 + j * 2, 8, 1, col);
        tag(
          g,
          a.x,
          a.y + 11,
          (k.kind === "pulse" ? "PULSE " : "PAD ") + String.fromCharCode(65 + i),
          col
        );
        g.rect(b.x - 12, b.y - 12, 24, 24, "#13212c");
        for (let j = 0; j < 6; j++) {
          g.rect(b.x - 12 + j * 4, b.y - 12, 2, 2, amber);
          g.rect(b.x - 12 + j * 4, b.y + 10, 2, 2, amber);
        }
        const goal = s2.doors[i] ? 1 : 0;
        this.doors[i] = reduced2 ? goal : this.doors[i] + (goal - this.doors[i]) * 0.3;
        const h = Math.round(10 * (1 - this.doors[i]));
        for (const side of [-1, 1]) {
          const y = side === -1 ? b.y - 10 : b.y + 10 - h;
          if (h) {
            g.rect(b.x - 11, y, 22, h, "#5c5660");
            g.rect(b.x - 9, y, 8, h, "#403d4b");
            g.rect(b.x + 2, y, 7, h, "#4b4653");
          }
          g.rect(
            b.x - 11,
            side === -1 ? b.y - 10 + h : b.y + 9 - h,
            22,
            1,
            goal ? mint : "#ff7779"
          );
        }
        const light = goal ? mint : "#ff827f";
        for (const side of [-1, 1]) {
          const post = b.x + (side < 0 ? -12 : 9);
          g.rect(post, b.y - 13, 4, 26, "#192333");
          g.rect(post + 1, b.y - 10, 2, 20, goal ? "#418f80" : "#914e53");
          g.rect(post + 1, b.y - 8, 2, 8, light);
        }
        g.glow(b.x, b.y, goal ? 21 : 26, goal ? "#69eab329" : "#f56d6b35");
        if (!s2.doors[i])
          tag(
            g,
            b.x,
            b.y + 14,
            l.gates.length === 1 ? "LOCKED" : "GATE " + String.fromCharCode(65 + i),
            "#f3a29c"
          );
        if (k.kind === "pulse" && s2.doors[i])
          g.rect(
            b.x - 10,
            b.y - 14,
            20 * Math.max(0, s2.pulses[i] - s2.tick) / 150,
            2,
            "#9ac6ff"
          );
      });
      if (l.patrol) {
        const b = pos(l.patrol.bell);
        g.rect(b.x - 8, b.y - 7, 16, 14, "#382c2c");
        for (let i = 0; i < 4; i++)
          g.rect(b.x - 6 + i * 3, b.y - 5, 2, 10, "#d68d64");
        tag(g, b.x, b.y + 11, "BUZZER", amber);
        const q = world(s2.guard);
        if (!s2.distracted) {
          for (let y = q.y - 107; y <= q.y + 107; y += 3)
            for (let x = q.x - 107; x <= q.x + 107; x += 3) {
              const probe = {
                ...s2.player,
                x: (x - OX) * UNIT / T,
                y: (y - OY) * UNIT / T,
                caught: false
              };
              if (s2.sees(probe, l.patrol)) g.rect(x, y, 3, 3, "#ff777433");
            }
        }
        runner(g, q.x, q.y, "#fb7e87", t, !s2.distracted, s2.distracted ? 1 : 2);
        tag(g, q.x, q.y - 23, s2.distracted ? "?" : "SEC", "#fb979e");
      }
      const tr = pos(l.loot);
      for (const side of [-1, 1]) {
        const x = tr.x + (side < 0 ? -18 : 15);
        g.rect(x, tr.y - 14, 3, 23, "#504838");
        g.rect(x, tr.y - 14, 3, 2, amber);
        g.rect(x + 1, tr.y - 10, 1, 16, "#bc9c65");
      }
      g.rect(tr.x - 14, tr.y + 3, 28, 11, "#151d27");
      g.rect(tr.x - 12, tr.y, 24, 10, "#6c624b");
      g.rect(tr.x - 10, tr.y + 1, 20, 6, "#292c30");
      g.rect(tr.x - 8, tr.y + 8, 16, 1, amber);
      if (!s2.loot) {
        trophy(g, l, tr.x, tr.y - 5, t);
        tag(g, tr.x, tr.y + 14, "LOOT", amber);
      }
      if (!s2.bonus) {
        const b = pos(l.bonus);
        diamond(g, b.x, b.y, true, t);
        tag(g, b.x, b.y + 9, "INTEL", "#bfa9e0");
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
        } else if (!near(
          s2.player,
          { x: actor.x / UNIT - 0.5, y: actor.y / UNIT - 0.5 },
          155
        )) {
          tag(g, q.x, q.y - 22, "E" + (i + 1), col);
        }
        g.ctx.globalAlpha = 1;
      });
      if (this.escape > 0 && !reduced2) {
        const a = pos(l.exit), phase = 1 - this.escape;
        g.glow(a.x, a.y, 35 + phase * 45, "#95ffd85c");
        for (let j = 0; j < 30; j++) {
          const angle = j * 2.39996, r = phase * (10 + noise(j, 1) % 53);
          g.rect(
            a.x + Math.cos(angle) * r,
            a.y + Math.sin(angle) * r - phase * 7,
            2,
            2,
            j % 3 ? mint : amber
          );
        }
        this.escape = Math.max(0, this.escape - 0.015);
      }
      if (this.flash > 0) {
        if (!reduced2) {
          const p2 = pos(l.start), phase = 1 - this.flash;
          g.glow(p2.x, p2.y, 14 + phase * 30, "#c8aaff55");
          for (let j = 0; j < 18; j++) {
            const angle = j * Math.PI / 9, rad = 3 + phase * 24;
            g.rect(
              p2.x + Math.cos(angle) * rad,
              p2.y + Math.sin(angle) * rad * 0.65,
              2,
              1,
              "#cbaeff"
            );
          }
        }
        if (!reduced2) {
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

  // src/input.ts
  var PointerRoute = class {
    constructor() {
      __publicField(this, "points", []);
      __publicField(this, "target");
      __publicField(this, "use", false);
    }
    cancel() {
      this.points = [];
      this.target = void 0;
      this.use = false;
    }
    plan(l, from, to) {
      this.cancel();
      if (l.tiles[to.y]?.[to.x] !== ".") return false;
      const first2 = tile(from), width = l.tiles[0].length, id = (v) => v.y * width + v.x;
      const queue = [first2], parents = /* @__PURE__ */ new Map([[id(first2), null]]);
      for (let head = 0; head < queue.length; head++) {
        const a = queue[head];
        if (id(a) === id(to)) break;
        for (const d of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1]
        ]) {
          const b = { x: a.x + d[0], y: a.y + d[1] };
          if (l.tiles[b.y]?.[b.x] !== "." || parents.has(id(b))) continue;
          parents.set(id(b), a);
          queue.push(b);
        }
      }
      if (!parents.has(id(to))) return false;
      for (let a = to; a; a = parents.get(id(a)) ?? null)
        this.points.push(center(a));
      this.points.reverse();
      this.target = to;
      this.use = [
        l.loot,
        l.bonus,
        ...l.gates.filter((g) => g.kind === "pulse").map((g) => g.source)
      ].some((p2) => p2.x === to.x && p2.y === to.y);
      return true;
    }
    next(s2) {
      while (this.points.length) {
        const p2 = this.points[0], dx = p2.x - s2.player.x, dy = p2.y - s2.player.y;
        if (Math.abs(dx) > SPEED / 2) return dx < 0 ? LEFT : RIGHT;
        if (Math.abs(dy) > SPEED / 2) return dy < 0 ? UP : DOWN;
        this.points.shift();
      }
      const cmd = this.use ? USE : 0;
      this.cancel();
      return cmd;
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
      if (this.bus && this.ctx)
        this.bus.gain.setTargetAtTime(
          this.muted ? 0 : 0.48,
          this.ctx.currentTime,
          0.02
        );
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
        this.tone(
          cue === "door" ? 180 : 360,
          cue === "door" ? 640 : 120,
          0.18,
          "triangle",
          0.22
        );
      }
      if (cue === "loot" || cue === "bonus" || cue === "clear") {
        (cue === "clear" ? [392, 494, 587, 784, 988] : [587, 784, 988]).forEach(
          (f, i) => this.tone(f, f, 0.23, "square", 0.056, i * 0.083)
        );
      }
      if (cue === "alarm" || cue === "caught") {
        this.tone(330, 190, 0.28, "sawtooth", 0.15);
        this.tone(280, 135, 0.32, "triangle", 0.16, 0.14);
      }
      if (cue === "pulse") this.tone(600, 1100, 0.22, "sine", 0.16);
      if (cue === "empty") this.tone(95, 90, 0.07, "sine", 0.12);
    }
    music() {
      if (!this.ctx || !this.active || this.muted || this.ctx.state !== "running")
        return;
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

  // src/skyline.ts
  function skyline(canvas) {
    const g = new Pixels(canvas, 900, 117);
    for (let y = 0; y < 117; y++)
      g.rect(
        0,
        y,
        900,
        1,
        "rgb(" + Math.round(14 + y * 0.22) + "," + Math.round(17 + y * 0.07) + "," + Math.round(32 + y * 0.38) + ")"
      );
    for (let i = 0; i < 170; i++) {
      const x = noise(i, 1) % 900, y = noise(i, 2) % 95;
      g.rect(x, y, i % 12 === 0 ? 2 : 1, 1, i % 5 === 0 ? "#ad94cb" : "#675d84");
    }
    const cx = 681, cy = 44, r = 35;
    g.glow(cx, cy, 90, "#c28af42a");
    for (let d = -r; d <= r; d++) {
      const a = Math.floor(Math.sqrt(r * r - d * d));
      if (d > 3 && (d % 7 === 0 || d > 16 && d % 7 === 1)) continue;
      g.rect(
        cx - a,
        cy + d,
        2 * a + 1,
        1,
        d < -14 ? "#e1c7ee" : d < 2 ? "#cfaaea" : d < 17 ? "#b38ad5" : "#986fb6"
      );
    }
    for (let layer = 0; layer < 3; layer++) {
      let x = -32 + layer * 11;
      for (let i = 0; x < 920; i++) {
        const n = noise(i, layer, 9), w = 9 + n % 23, base = 98 + layer * 10;
        const h = 9 + (n >>> 8) % (23 + layer * 4), y = base - h;
        const col = ["#302940", "#29263e", "#1c2034"][layer];
        g.rect(x, y, w, h + 24, col);
        g.rect(x + 3, y - 3, w - 6, 3, col);
        if (n % 5 === 0) {
          g.rect(x + w / 2, y - 12, 1, 12, col);
          g.rect(x + w / 2, y - 12, 1, 1, "#bd92bb");
        }
        for (let j = 2; j < w - 3; j += 4)
          for (let k = 4; k < h; k += 5)
            if (noise(i + j, k, layer) % 7 < 3)
              g.rect(
                x + j,
                y + k,
                2,
                1,
                ["#65506e", "#725a7d", "#6b7286"][layer]
              );
        x += w - 1;
      }
    }
    function tower(x, y, w, h, n) {
      g.rect(x + 4, y - 3, w - 9, 3, "#45405e");
      g.rect(x + 8, y - 6, 9, 3, "#27253b");
      g.rect(x, y, w, h, "#191e31");
      g.rect(x + 1, y + 1, w - 2, 2, "#63556e");
      g.rect(x + w - 7, y + 3, 6, h - 3, "#2b2b42");
      for (let j = 4; j < w - 7; j += 5)
        for (let k = 6; k < h - 3; k += 6) {
          const rnd = noise(j + n, k);
          g.rect(
            x + j,
            y + k,
            3,
            2,
            rnd % 6 < 3 ? ["#bf8ca0", "#85b2c1", "#b3a0cf"][rnd % 3] : "#34364c"
          );
        }
      g.rect(x + 2, y + 6, 1, h - 5, "#40394d");
    }
    tower(478, 56, 35, 70, 2);
    tower(521, 38, 40, 82, 8);
    tower(576, 66, 54, 62, 4);
    tower(712, 48, 46, 74, 5);
    tower(774, 28, 34, 99, 1);
    tower(830, 52, 48, 77, 7);
    g.rect(530, 30, 23, 8, "#373249");
    g.rect(538, 15, 2, 15, "#7b607c");
    g.rect(537, 14, 4, 2, "#ffabbf");
    g.rect(780, 18, 22, 10, "#3a334b");
    g.rect(789, 4, 2, 15, "#65526d");
    g.rect(788, 3, 4, 2, "#ec9eb6");
    g.rect(763, 52, 14, 2, "#8c7899");
    g.rect(763, 74, 14, 2, "#8c7899");
    g.rect(759, 49, 10, 35, "#191b30");
    g.rect(760, 50, 8, 33, "#765977");
    for (let i = 0; i < 4; i++) {
      g.rect(762, 53 + i * 7, 4, 1, "#edbbcf");
      g.rect(762 + i % 2, 54 + i * 7, 1, 4, "#edbbcf");
      g.rect(762, 57 + i * 7, 5, 1, "#edbbcf");
    }
    for (let i = 0; i < 112; i++)
      g.rect(
        805 + i,
        43 + Math.floor(Math.sin(i / 111 * Math.PI) * 9),
        1,
        1,
        "#343044"
      );
    g.rect(653, 100, 95, 3, "#73617e");
    g.rect(650, 103, 102, 15, "#131a2a");
    g.rect(849, 92, 56, 2, "#73617e");
    g.rect(846, 94, 59, 24, "#141b2b");
    for (let j = 0; j < 31; j++) g.rect(651 + j * 3, 104, 1, 3, "#40405a");
    g.rect(665, 90, 16, 10, "#37364b");
    g.rect(664, 89, 18, 2, "#62536c");
    for (let j = 0; j < 5; j++) g.rect(667 + j * 2, 93, 1, 4, "#1b2432");
    g.stamp(
      702,
      69,
      [
        ".......kkk.....",
        "......kpppk....",
        ".....kpppppk...",
        ".....kpmmtmk...",
        ".....kffffkk...",
        "......kpplk....",
        "...kkkkppplk...",
        ".kkplpppppplk..",
        "kpppkkppplklk..",
        "kkkk.kplllk.lk.",
        "....kppklkk..k.",
        "...kpppk.lpk...",
        "..kppkpk..lpk..",
        "..kk..pk..lpk..",
        ".....kllk.kllk."
      ],
      {
        k: "#101726",
        p: "#32334c",
        l: "#5c526e",
        m: "#9df4d9",
        t: "#d3b1b3",
        f: "#65516a"
      },
      2
    );
  }
  function wordmark(canvas) {
    const g = new Pixels(canvas, 196, 24);
    const chars = {
      E: [
        "1111111",
        "1100000",
        "1100000",
        "1111110",
        "1100000",
        "1100000",
        "1111111"
      ],
      C: [
        "0111111",
        "1100000",
        "1100000",
        "1100000",
        "1100000",
        "1100000",
        "0111111"
      ],
      H: [
        "1100011",
        "1100011",
        "1100011",
        "1111111",
        "1100011",
        "1100011",
        "1100011"
      ],
      O: [
        "0111110",
        "1100011",
        "1100011",
        "1100011",
        "1100011",
        "1100011",
        "0111110"
      ],
      I: ["11111", "01110", "01110", "01110", "01110", "01110", "11111"],
      S: [
        "0111111",
        "1100000",
        "1100000",
        "0111110",
        "0000011",
        "0000011",
        "1111110"
      ],
      T: [
        "1111111",
        "1111111",
        "0011100",
        "0011100",
        "0011100",
        "0011100",
        "0011100"
      ]
    };
    let x = 4;
    for (const [i, ch] of [..."ECHO HEIST"].entries()) {
      if (ch === " ") {
        x += 7;
        continue;
      }
      const pattern = chars[ch];
      for (let j = 0; j < pattern.length; j++)
        for (let k = 0; k < pattern[j].length; k++)
          if (pattern[j][k] === "1") {
            const lean = Math.floor((6 - j) / 3);
            g.rect(
              x + k * 2 + lean,
              5 + j * 2,
              2,
              5,
              i < 4 ? "#28685f" : "#57436e"
            );
          }
      for (let j = 0; j < pattern.length; j++)
        for (let k = 0; k < pattern[j].length; k++)
          if (pattern[j][k] === "1") {
            const lean = Math.floor((6 - j) / 3);
            g.rect(
              x + k * 2 + lean,
              3 + j * 2,
              2,
              2,
              i < 4 ? j < 4 ? "#a6ffe1" : "#79e8c4" : j < 4 ? "#e0c7fd" : "#baa0e5"
            );
          }
      x += pattern[0].length * 2 + 3;
    }
    const cut = g.ctx.getImageData(0, 0, x + 1, 23);
    canvas.width = x + 1;
    canvas.height = 23;
    g.ctx.putImageData(cut, 0, 0);
  }

  // src/ui.ts
  var el = (id) => document.getElementById(id);
  var digits = (n) => String(n).padStart(2, "0");
  var paths = {
    arcade: "M2 12 8 3h4l-6 9zm8 0 6-9h4l-6 9zm-8 4h14",
    keys: "M2 5h16v10H2z M5 8h1m2 0h1m2 0h1m2 0h1M5 12h2m2 0h5",
    sound: "M2 8h4l5-4v12l-5-4H2z M14 7q3 3 0 6m2-9q6 6 0 12",
    mute: "M2 8h4l5-4v12l-5-4H2z M14 7l5 6m0-6-5 6",
    pause: "M6 4h2v12H6zm7 0h2v12h-2z",
    play: "M5 3l11 7-11 7z",
    timer: "M7 2h6m-3 0v2m5 1 2-2 M15 6l2 3v5l-3 3H7l-4-4V9l3-4h7z M10 7v4h3",
    loop: "M3 9a7 7 0 1 1 1 6M2 4v6h6",
    echo: "M2 15V7l3-3h5l3 3v8l-3-2-2 2-3-2z M13 4h2l3 3v9l-3-2 M5 8h1m2 0h1",
    signal: "M2 16v-3m4 3v-6m4 6V7m4 9V4m4 12V1",
    prompt: "m3 5 5 5-5 5m7 0h6",
    wave: "M1 11h3l2-6 3 11 3-14 2 9h5",
    folder: "M2 5h6l2 2h8v10H2z M2 9h16",
    gem: "M2 7l4-4h8l4 4-8 10zM2 7h16M7 7l3 10 3-10-3-4z",
    shard: "m10 2 6 8-6 8-6-8z",
    bulb: "M7 13v-2L5 9V6l3-3h4l3 3v3l-2 2v2zm1 3h4",
    stack: "m2 6 8-4 8 4-8 4zm0 4 8 4 8-4m-16 4 8 4 8-4",
    rewind: "M10 4 2 10l8 6zm8 0-8 6 8 6z",
    undo: "M3 4v6h6M3 10l4-4h5l4 3v4l-3 3H8",
    restart: "M16 4v5h-5m5 0-3-4H7L3 9v4l4 3h5l3-2"
  };
  function icon(name) {
    return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + paths[name] + '"/></svg>';
  }
  function icons(root = document) {
    root.querySelectorAll("[data-icon]").forEach((i) => {
      i.innerHTML = icon(i.dataset.icon);
    });
  }
  function text(id, value) {
    const node = el(id);
    if (node.textContent !== value) node.textContent = value;
  }
  var Timeline = class {
    constructor() {
      __publicField(this, "count", -1);
      __publicField(this, "lastTick", -1);
    }
    draw(s2) {
      const rebuild = this.count !== s2.tracks.length;
      if (rebuild) {
        this.count = s2.tracks.length;
        el("lanes").replaceChildren();
        for (let i = 0; i <= this.count; i++) {
          const row = document.createElement("div");
          row.className = "lane";
          const live = i === this.count, label = live ? "You" : "Echo " + (i + 1), col = live ? "#87e9c8" : ECHO_COLORS[i % ECHO_COLORS.length];
          row.style.setProperty("--col", col);
          const name = document.createElement("span");
          name.textContent = label;
          const cv = document.createElement("canvas");
          cv.width = 600;
          cv.height = 10;
          cv.className = "tape";
          cv.setAttribute("aria-label", label + " recording timeline");
          row.append(name, cv);
          el("lanes").append(row);
        }
      }
      if (!rebuild && this.lastTick === s2.tick) return;
      this.lastTick = s2.tick;
      const bars = el("lanes").querySelectorAll("canvas");
      bars.forEach((cv, i) => {
        const g = cv.getContext("2d"), live = i === s2.tracks.length, color = live ? "#87e9c8" : ECHO_COLORS[i % ECHO_COLORS.length];
        g.clearRect(0, 0, 600, 10);
        g.fillStyle = "#2c3545";
        for (let x = 0; x < 600; x += 10) g.fillRect(x, 0, 1, x % 100 ? 3 : 10);
        const a = live ? s2.activity : s2.tracks[i].activity;
        g.fillStyle = color;
        for (let n = 0; n < a.length; n += 3) {
          const v = Math.max(a[n], a[n + 1] || 0, a[n + 2] || 0), h = [2, 4, 8, 10][v];
          g.fillRect(n / 3, 10 - h, 1, h);
        }
        if (!live && a.at(-1) === 2) {
          g.globalAlpha = 0.32;
          for (let x = Math.ceil(a.length / 3); x < 600; x += 5)
            g.fillRect(x, 5, 3, 3);
          g.globalAlpha = 1;
        }
        g.fillStyle = "#f3f7fe";
        g.fillRect(Math.min(599, 600 * s2.tick / LIMIT), 0, 2, 10);
      });
    }
  };

  // src/save.ts
  var key = "echo-heist.v1";
  function readSave() {
    const fallback = { selected: 0, muted: false, records: {} };
    try {
      const data = JSON.parse(localStorage.getItem(key) || "null");
      if (!data || typeof data !== "object") return fallback;
      if (Number.isInteger(data.selected) && data.selected >= 0 && data.selected < 5)
        fallback.selected = data.selected;
      fallback.muted = data.muted === true;
      for (const [k, r] of Object.entries(data.records || {})) {
        if (r && Number.isInteger(r.loops) && r.loops > 0 && Number.isInteger(r.ticks) && r.ticks > 0 && [1, 2, 3].includes(r.medal) && typeof r.bonus === "boolean")
          fallback.records[Number(k)] = r;
      }
    } catch {
    }
    return fallback;
  }
  function writeSave(s2) {
    try {
      localStorage.setItem(key, JSON.stringify(s2));
    } catch {
    }
  }
  function result(s2) {
    const efficient = s2.attempts <= s2.level.par, fast = s2.elapsed <= s2.level.target * 60;
    return {
      loops: s2.attempts,
      ticks: s2.elapsed,
      bonus: s2.bonus,
      medal: efficient && fast && s2.bonus ? 3 : efficient || fast ? 2 : 1
    };
  }
  function better(a, b) {
    return !b || a.medal > b.medal || a.medal === b.medal && (a.loops < b.loops || a.loops === b.loops && a.ticks < b.ticks);
  }
  var medals = ["", "Bronze", "Silver", "Gold"];

  // src/main.ts
  var save = readSave();
  var audio = new AudioDeck();
  var clock = new Clock();
  var timeline = new Timeline();
  audio.muted = save.muted;
  var index = save.selected;
  var s = new Heist(levels[index]);
  var route = new PointerRoute();
  var board = el("board");
  var feed = new Feed(board, s.level);
  var dialog = el("dialog");
  var keys = /* @__PURE__ */ new Map();
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var queued = 0;
  var thumb = 0;
  var last = performance.now();
  var frameCount = 0;
  var previousPause = false;
  var notice = "";
  var noticeUntil = 0;
  var overlayMode = "";
  var newRecord = false;
  var showReceiptAt = 0;
  var moveKeys = {
    KeyW: UP,
    ArrowUp: UP,
    KeyA: LEFT,
    ArrowLeft: LEFT,
    KeyS: DOWN,
    ArrowDown: DOWN,
    KeyD: RIGHT,
    ArrowRight: RIGHT
  };
  function artwork(id, draw) {
    const canvas = document.createElement("canvas");
    draw(canvas);
    const img = el(id);
    img.src = canvas.toDataURL();
    img.width = canvas.width;
    img.height = canvas.height;
  }
  artwork("sky", skyline);
  artwork("logo", wordmark);
  icons();
  function clearInput() {
    route.cancel();
    keys.clear();
    thumb = queued = 0;
    clock.clear();
  }
  function say(value, seconds = 2.5) {
    notice = value;
    noticeUntil = performance.now() + seconds * 1e3;
  }
  function soundButton() {
    el("audio").innerHTML = "<i>" + icon(audio.muted ? "mute" : "sound") + "</i><span>Sound " + (audio.muted ? "off" : "on") + "</span>";
    el("audio").setAttribute("aria-pressed", String(!audio.muted));
  }
  function mute() {
    audio.wake();
    audio.toggle();
    save.muted = audio.muted;
    writeSave(save);
    soundButton();
  }
  function jobs() {
    const list = el("jobs");
    list.replaceChildren();
    levels.forEach((l, i) => {
      const b = document.createElement("button"), rec = save.records[i];
      b.className = "job" + (i === index ? " active" : "");
      b.setAttribute("aria-current", i === index ? "true" : "false");
      b.innerHTML = '<span class="idx">' + digits(i + 1) + '</span><span class="jname">' + l.title + '</span><span class="mark">' + (rec ? "\u25C6" : i === index ? "\u25C2" : "\xB7") + "</span>";
      if (rec)
        b.title = medals[rec.medal] + " \xB7 " + rec.loops + " loops \xB7 " + (rec.ticks / 60).toFixed(2) + "s";
      b.onclick = () => {
        if (i !== index) switchTo(i);
      };
      list.append(b);
    });
    text("completed", Object.keys(save.records).length + " / 5");
    const best = save.records[index];
    el("best").hidden = !best;
    if (best)
      text(
        "best",
        "Best \xB7 " + medals[best.medal] + " \xB7 " + best.loops + " loops \xB7 " + (best.ticks / 60).toFixed(2) + "s"
      );
  }
  function switchTo(i) {
    index = i;
    s = new Heist(levels[i]);
    feed.setLevel(s.level);
    feed.flash = 0;
    feed.endGlow = 0;
    feed.escape = 0;
    timeline.count = -1;
    clearInput();
    last = performance.now();
    notice = "";
    overlayMode = "";
    newRecord = false;
    el("overlay").hidden = true;
    el("hinttext").hidden = true;
    save.selected = i;
    writeSave(save);
    text("facility", s.level.site);
    text("cam", digits(i + 1));
    text("filecode", "EH\u2013" + digits(i + 1));
    text("contract", "Contract " + digits(i + 1) + " / 05");
    text("title", s.level.title);
    text("brief", s.level.brief);
    text("item", s.level.item);
    text("hinttext", s.level.hint);
    hintLabel();
    jobs();
    hud();
  }
  function hintLabel() {
    const show = !el("hinttext").hidden;
    el("hint").innerHTML = "<span><i>" + icon("bulb") + "</i>" + (show ? "Hide hint" : "Show hint") + "</span><b>" + (show ? "\u2212" : "+") + "</b>";
    el("hint").setAttribute("aria-expanded", String(show));
  }
  function contextual() {
    if (s.won) return "Extraction confirmed. Receipt filed under your alias.";
    if (s.player.caught)
      return "Sentry contact. Retry this loop or rewind to keep its recording.";
    if (s.paused) return "Timeline suspended. Your crew is waiting.";
    if (near(s.player, s.level.loot, 205) && !s.loot)
      return "Press E to steal the " + s.level.item.toLowerCase() + ".";
    if (near(s.player, s.level.bonus, 190) && !s.bonus)
      return "Press E to pocket the violet bonus intel.";
    const g = s.level.gates.find((g2) => atControl(s.player, g2));
    if (g?.kind === "pulse") {
      const remaining = s.pulses[s.level.gates.indexOf(g)] - s.tick;
      if (remaining > 0)
        return "Pulse active \xB7 " + (remaining / 60).toFixed(1) + "s left. Press R to record this timing.";
    }
    if (g)
      return g.kind === "pulse" ? "Tap E to send a 2.5-second pulse. Rewind to replay it." : "Pad engaged. Press R here to leave an Echo holding it.";
    if (s.level.patrol && near(s.player, s.level.patrol.bell))
      return "Buzzer active. Rewind here to keep the sentry distracted.";
    if (s.loot) return "Loot secured. Reach the green EXIT pad.";
    if (!s.started && s.tracks.length)
      return "Echoes synced. Move or press Space to start the crew.";
    if (index === 0 && !s.tracks.length)
      return "Reach PAD A with WASD, arrow keys, or a click.";
    if (index === 0)
      return "Follow your Echo through the door. Press E at the gold core.";
    return s.level.brief;
  }
  function overlay() {
    const mode = s.won ? performance.now() >= showReceiptAt ? "won" : "" : s.player.caught ? "caught" : s.paused && !dialog.open ? "paused" : "";
    if (mode === overlayMode) return;
    overlayMode = mode;
    const o = el("overlay");
    o.hidden = !mode;
    if (!mode) return;
    if (mode === "won") {
      const r = result(s), best = save.records[index], final = index === levels.length - 1;
      o.innerHTML = '<div class="seal">\u25C6</div><div class="eyebrow">' + (final ? "Blackstar recovered" : "Extraction confirmed") + "</div><h3>" + (final ? "The Big Score is yours." : "Clean getaway.") + "</h3><p>" + s.level.quip + '</p><div class="receipt">' + medals[r.medal] + " medal \xB7 " + r.loops + " loops \xB7 " + (r.ticks / 60).toFixed(2) + 's</div><div class="scoreline">' + (newRecord ? "Personal best" : "Best " + medals[best.medal] + " \xB7 " + best.loops + " loops \xB7 " + (best.ticks / 60).toFixed(2) + "s") + " \xB7 Intel " + (r.bonus ? "secured" : "missed") + '</div><div class="choices"><button class="primary" id="next">' + (final ? "Back to first contract" : "Next contract \u2192") + '</button><button id="replay">Replay</button></div>';
      el("next").onclick = () => switchTo((index + 1) % levels.length);
      el("replay").onclick = () => switchTo(index);
    } else if (mode === "caught") {
      o.innerHTML = '<div class="eyebrow">Security alert</div><h3>Cover blown.</h3><p>Your earlier Echoes are still on tape.</p><div class="choices"><button class="primary" id="retryNow">Retry loop <kbd>T</kbd></button><button id="keep">Keep Echo <kbd>R</kbd></button></div>';
      el("retryNow").onclick = () => action("retry");
      el("keep").onclick = () => action("rewind");
    } else {
      o.innerHTML = '<div class="eyebrow">Timeline on hold</div><h3>Paused</h3><button class="primary" id="resume">Resume <kbd>P</kbd></button>';
      el("resume").onclick = pause;
    }
  }
  function hud() {
    const hundredths = Math.ceil((LIMIT - s.tick) * 100 / 60);
    const value = "00:" + digits(Math.floor(hundredths / 100)) + "<span>." + digits(hundredths % 100) + "</span>";
    if (el("time").innerHTML !== value) el("time").innerHTML = value;
    text("loop", digits(s.tracks.length + 1));
    text("echoes", digits(s.tracks.length));
    text("looted", s.loot ? "\u2713" : "");
    text("bonus", s.bonus ? "Secured \u2713" : "Optional");
    const rec = s.paused ? "Paused" : s.won ? "Archived" : s.player.caught ? "Stopped" : s.started ? "Recording" : "Standby";
    text("rec", rec);
    el("rec").parentElement.classList.toggle("live", rec === "Recording");
    el("undo").disabled = !s.tracks.length || s.won || s.paused;
    el("rewind").disabled = s.paused || s.won;
    const pauseButton = el("pause");
    pauseButton.disabled = s.won || s.player.caught;
    const state = s.paused ? "Resume" : "Pause";
    if (pauseButton.querySelector("span")?.textContent !== state)
      pauseButton.innerHTML = "<i>" + icon(s.paused ? "play" : "pause") + "</i><span>" + state + "</span>";
    pauseButton.setAttribute("aria-label", state + " game");
    text(
      "status",
      performance.now() < noticeUntil && notice ? notice : contextual()
    );
    timeline.draw(s);
    overlay();
  }
  function action(a) {
    audio.wake();
    if (dialog.open) return;
    if (a === "restart") {
      switchTo(index);
      say("Contract reset. Fresh tape.");
      return;
    }
    if (s.paused || s.won) return;
    if (a === "rewind" && !s.tick) {
      say("Move first to record a route.");
      return;
    }
    clearInput();
    if (a === "rewind") s.rewind();
    if (a === "undo") s.undo();
    if (a === "retry") s.retry();
    effects();
    hud();
  }
  function pause() {
    if (s.won || s.player.caught || dialog.open) return;
    audio.wake();
    clearInput();
    s.paused = !s.paused;
    notice = "";
    last = performance.now();
    hud();
  }
  function help() {
    if (dialog.open) return;
    previousPause = s.paused;
    s.paused = true;
    clearInput();
    el("dialog-content").innerHTML = '<div class="eyebrow">Operator handbook</div><h3>Work with your past.</h3><p>Click a floor tile to walk there, or use the keyboard. Click loot to collect it. Rewind to keep the route you just ran. Each Echo starts with you, repeats its inputs, then waits where its tape ends.</p><dl><dt>WASD / Arrows</dt><dd>Move</dd><dt>E</dt><dd>Take loot or intel, pulse a relay</dd><dt>R / Z</dt><dd>Record an Echo / undo the last Echo</dd><dt>T / X</dt><dd>Retry with your crew / restart contract</dd><dt>Space</dt><dd>Start the clock while standing still</dd><dt>P / Esc</dt><dd>Pause or resume</dd><dt>M</dt><dd>Toggle audio</dd></dl><p>Gold requires bonus intel, at most ' + s.level.par + " loops and a total time of " + s.level.target + 's or less on this contract.</p><button class="primary" id="dismiss">Back to the heist</button>';
    dialog.showModal();
    el("dismiss").onclick = () => dialog.close();
    hud();
  }
  dialog.addEventListener("close", () => {
    s.paused = previousPause;
    clearInput();
    last = performance.now();
    hud();
    board.focus({ preventScroll: true });
  });
  function effects() {
    for (const cue of s.cues.splice(0)) {
      audio.effect(cue);
      if (cue === "rewind" || cue === "retry" || cue === "undo") {
        route.cancel();
        feed.flash = 1;
        feed.doors.fill(0);
        timeline.lastTick = -1;
        say(
          cue === "rewind" ? "Echo " + digits(s.tracks.length) + " recorded. Move to run the tape." : cue === "undo" ? "Last Echo erased. Remaining tapes are ready." : "Loop reset. Your crew is ready.",
          2
        );
      }
      if (cue === "loot" || cue === "bonus") {
        feed.endGlow = 1;
        say(
          cue === "loot" ? "Loot secured. Move to the green EXIT pad." : "Bonus intel secured."
        );
      }
      if (cue === "clear") {
        const r = result(s);
        newRecord = better(r, save.records[index]);
        if (newRecord) save.records[index] = r;
        writeSave(save);
        jobs();
        notice = "";
        feed.escape = 1;
        showReceiptAt = performance.now() + (reduced.matches ? 0 : 720);
      }
      if (cue === "caught") notice = "";
      if (cue === "empty")
        say("Use E beside loot, violet intel or a pulse relay.", 1);
    }
  }
  el("restart").onclick = () => action("restart");
  el("rewind").onclick = () => action("rewind");
  el("undo").onclick = () => action("undo");
  el("hint").onclick = () => {
    el("hinttext").hidden = !el("hinttext").hidden;
    hintLabel();
  };
  el("help").onclick = help;
  el("audio").onclick = mute;
  el("pause").onclick = pause;
  function canRun() {
    return !dialog.open && !s.paused && !s.won && !s.player.caught;
  }
  window.addEventListener("keydown", (e) => {
    if (dialog.open || e.metaKey || e.ctrlKey || e.altKey) return;
    const move = moveKeys[e.code];
    if (move) {
      e.preventDefault();
      if (canRun() && !e.repeat) {
        audio.wake();
        route.cancel();
        keys.set(e.code, move);
        queued |= move;
      }
      return;
    }
    if (e.code === "Space" && e.target instanceof HTMLButtonElement) return;
    if (![
      "Space",
      "KeyE",
      "KeyR",
      "KeyZ",
      "KeyT",
      "KeyX",
      "KeyP",
      "Escape",
      "KeyM",
      "KeyH"
    ].includes(e.code))
      return;
    e.preventDefault();
    if (e.repeat) return;
    audio.wake();
    switch (e.code) {
      case "KeyE":
        if (canRun()) queued |= USE;
        break;
      case "Space":
        if (canRun()) s.started = true;
        break;
      case "KeyR":
        action("rewind");
        break;
      case "KeyZ":
        action("undo");
        break;
      case "KeyT":
        action("retry");
        break;
      case "KeyX":
        action("restart");
        break;
      case "KeyP":
      case "Escape":
        pause();
        break;
      case "KeyM":
        mute();
        break;
      case "KeyH":
        help();
        break;
    }
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  function background() {
    clearInput();
    if (s.started && canRun()) {
      s.paused = true;
      notice = "";
      hud();
    }
    last = performance.now();
  }
  window.addEventListener("blur", background);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) background();
    else last = performance.now();
  });
  document.querySelectorAll("[data-dir]").forEach((b) => {
    const dir = Number(b.dataset.dir);
    b.onpointerdown = (e) => {
      if (!canRun()) return;
      e.preventDefault();
      route.cancel();
      b.setPointerCapture(e.pointerId);
      audio.wake();
      thumb |= dir;
      queued |= dir;
    };
    b.onlostpointercapture = b.onpointercancel = b.onpointerup = () => {
      thumb &= ~dir;
    };
  });
  el("touch-use").onclick = () => {
    if (canRun()) {
      audio.wake();
      queued |= USE;
    }
  };
  function frame(t) {
    const delta = Math.max(0, (t - last) / 1e3);
    last = t;
    if (canRun() && !document.hidden) {
      let held = thumb;
      for (const mask of keys.values()) held |= mask;
      clock.advance(delta, () => {
        s.step(held | queued | route.next(s));
        queued = 0;
        effects();
      });
    }
    if (!s.paused && !document.hidden) frameCount += delta * 60;
    audio.active = s.started && canRun() && !document.hidden;
    audio.music();
    feed.target = route.target;
    feed.draw(s, frameCount, reduced.matches);
    hud();
    requestAnimationFrame(frame);
  }
  board.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !canRun()) return;
    audio.wake();
    board.focus({ preventScroll: true });
    const bounds = board.getBoundingClientRect();
    const target = feed.tileAt(
      (e.clientX - bounds.left) / bounds.width,
      (e.clientY - bounds.top) / bounds.height
    );
    if (route.plan(s.level, s.player, target)) s.started = true;
    else say("Choose a floor tile or device.", 1);
  });
  el("paths").onclick = () => {
    feed.paths = !feed.paths;
    el("paths").setAttribute("aria-pressed", String(feed.paths));
  };
  soundButton();
  switchTo(index);
  requestAnimationFrame(frame);
})();
