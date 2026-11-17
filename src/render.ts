import { Pixels, noise, runner, ECHO_COLORS } from "./pixels.ts";
import { Heist, UNIT, near, atControl, LIMIT, PULSE_TICKS } from "./sim.ts";
import type { Point, Level } from "./levels.ts";
const T = 24,
  OX = 23,
  OY = 23,
  W = 598,
  H = 334;
const mint = "#74f4cc",
  amber = "#ffcc65",
  violet = "#bd9afa";
const pos = (p: Point) => ({
  x: OX + (p.x + 0.5) * T,
  y: OY + (p.y + 0.5) * T,
});
const world = (p: Point) => ({
  x: Math.round(OX + (p.x * T) / UNIT),
  y: Math.round(OY + (p.y * T) / UNIT),
});
const floor = (l: Level, x: number, y: number) => l.tiles[y]?.[x] === ".";
function tag(g: Pixels, x: number, y: number, s: string, col: string) {
  const w = s.length * 6 + 5;
  g.rect(x - w / 2, y - 1, w, 10, "#0a111ced");
  g.rect(x - w / 2, y - 1, 1, 10, col);
  g.label(Math.round(x - w / 2 + 3), y, s, col);
}
function crate(g: Pixels, x: number, y: number, gold: boolean) {
  const top = gold ? "#615642" : "#374b61",
    rim = gold ? "#918068" : "#597187";
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
function server(g: Pixels, x: number, y: number, n: number) {
  g.rect(x + 1, y + 2, 22, 21, "#101c2c");
  g.rect(x + 2, y, 20, 3, "#465d72");
  g.rect(x + 3, y + 3, 18, 17, "#24374c");
  for (let j = 0; j < 4; j++) {
    g.rect(x + 5, y + 4 + j * 4, 14, 3, "#0d1b2b");
    g.rect(x + 6, y + 5 + j * 4, 5, 1, "#4f6a79");
    g.rect(x + 15, y + 5 + j * 4, 2, 1, (n + j) % 3 === 0 ? amber : "#62c6bc");
  }
}
function surface(g: Pixels, l: Level) {
  g.rect(0, 0, W, H, "#0b111b");
  for (let x = 3; x < W; x += 8)
    for (let y = 3; y < H; y += 8) g.rect(x, y, 1, 1, "#263042");
  for (let i = 0; i < 4; i++) {
    const x = i % 2 ? W - 9 : 8,
      y = i < 2 ? 8 : H - 9;
    g.line(x, y, x + (i % 2 ? -6 : 6), y, "#5e7487");
    g.line(x, y, x, y + (i < 2 ? 6 : -6), "#5e7487");
  }
  for (const zone of l.zones ?? []) {
    g.label(OX + zone.firstColumn * T, 8, zone.name, "#99adb7");
  }
  const vaultX = l.zones
    ? l.zones[l.zones.length - 1].firstColumn - 1
    : (l.gates.at(-1)?.x ?? 15);
  for (let r = 0; r < l.tiles.length; r++)
    for (let c = 0; c < l.tiles[r].length; c++) {
      const x = OX + c * T,
        y = OY + r * T,
        n = noise(c, r),
        gold = c > vaultX;
      if (floor(l, c, r)) {
        const fills = gold
          ? ["#363c40", "#373c41", "#333a3e", "#343b41"]
          : ["#263542", "#293744", "#283642", "#2b3945"];
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
        const edge = [-1, 0, 1].some((d) =>
          [-1, 0, 1].some((e) => floor(l, c + d, r + e)),
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
  // Ceiling fixtures throw localized light into each bay.
  const lamps: Point[] = [];
  for (let y = 0; y < l.tiles.length - 1; y++)
    for (let x = 1; x < 22; x++) {
      if (l.tiles[y][x] !== "#" || !floor(l, x, y + 1) || floor(l, x, y - 1))
        continue;
      if ((x + 2 * y) % 5 !== 0) continue;
      const px = OX + x * T,
        py = OY + y * T,
        warm = x > vaultX;
      g.rect(px + 2, py + 13, 20, 7, "#101a25");
      g.rect(px + 4, py + 14, 16, 2, warm ? "#ecd393" : "#9ae8e0");
      g.rect(px + 5, py + 16, 14, 1, warm ? "#b89b5c" : "#459a9c");
      g.glow(px + 12, py + 27, 46, warm ? "#e8b65c28" : "#6edfd034");
      lamps.push({ x: px + 12, y: py + 18 });
    }
  // Small machine bays have glass CRTs, illuminated keys and cable trunks.
  for (let y = 0; y < l.tiles.length; y++)
    for (let x = 0; x < l.tiles[y].length; x++) {
      if (l.tiles[y][x] !== "S") continue;
      const px = OX + x * T,
        py = OY + y * T;
      if (l.tiles[y][x - 1] !== "S") {
        g.rect(px + 1, py + 2, 21, 19, "#0a1522");
        g.rect(px + 2, py, 19, 13, "#4b6172");
        g.rect(px + 4, py + 2, 15, 10, "#14383e");
        g.rect(px + 5, py + 3, 13, 1, "#70caba");
        for (let j = 0; j < 3; j++) {
          g.rect(px + 5, py + 5 + j * 2, 3 + (noise(x, j) % 8), 1, "#50aa9c");
        }
        g.rect(px + 3, py + 14, 17, 5, "#3c5164");
        g.rect(px + 5, py + 15, 6, 2, "#9abdca");
        g.rect(px + 15, py + 15, 3, 2, "#d9b178");
        g.rect(px + 4, py + 19, 2, 3, "#58697a");
        g.rect(px + 16, py + 19, 2, 3, "#58697a");
        g.glow(px + 11, py + 8, 22, "#6ee1d92a");
      }
    }
  if (l.handoff) {
    const rail = pos(l.start),
      stop = pos(l.gates[l.handoff.berth].source!);
    for (let x = rail.x; x < stop.x; x += 8)
      g.rect(x, rail.y - 6, 3, 13, "#29312f");
    for (const dy of [-5, 5])
      g.line(rail.x, rail.y + dy, stop.x, rail.y + dy, "#99846a");
  }
  const a = pos(l.start),
    v = pos(l.loot);
  // Painted floor lines, stencilled bay numbers and worn hazard chevrons.
  g.label(a.x - 16, a.y - 46, "01", "#4d616a", 2);
  g.label(v.x - 45, v.y + 48, "VAULT", "#655f50");
  for (let i = 0; i < 4; i++) {
    const x = v.x - 17 + i * 8;
    for (let j = 0; j < 3; j++) g.rect(x + j, v.y + 34 - j, 4, 1, "#8b7855");
  }
  for (const lamp of lamps) {
    g.rect(lamp.x - 7, lamp.y - 3, 14, 1, "#d4e2d4");
  }
  l.gates.forEach((gate, i) => {
    if (gate.kind === "automatic") return;
    const a = pos(gate.source),
      b = pos(gate),
      col = i % 2 ? "#7a698e" : "#527a77";
    g.line(a.x, a.y, a.x, b.y, col);
    g.line(a.x, b.y, b.x, b.y, col);
    for (let x = Math.min(a.x, b.x) + 5; x < Math.max(a.x, b.x); x += 11)
      g.rect(x, b.y - 1, 3, 3, col);
  });
  // Recessed uplights in the entrance and vault lend each room a distinct color.
  g.glow(a.x - 40, a.y, 84, "#3bbaad16");
  g.glow(v.x, v.y, 95, "#e4a84621");
}
function diamond(g: Pixels, x: number, y: number, small: boolean, t: number) {
  const dy = Math.floor(Math.sin(t / 15) * 1.5),
    s = small ? 1 : 2;
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
    "....a....",
  ];
  g.stamp(
    x - 4 * s,
    y - 5 * s + dy,
    art,
    small
      ? { a: "#8d66b6", b: "#d4b8ff", c: "#9977d6", d: "#d4baee", e: "#eee4ff" }
      : {
          a: "#bc7c38",
          b: "#fff4b5",
          c: "#e8a64b",
          d: "#ffd86a",
          e: "#ffffda",
        },
    s,
  );
}
const trophies: Record<string, string[]> = {
  "Platform Zero token": [
    "...aaaa...",
    ".aabbbbaa.",
    ".abffffba.",
    "abbfddcfba",
    "abcfddcfba",
    ".acffffca.",
    ".aabccbaa.",
    "...aaaa...",
  ],
  "Midnight Postmark": [
    "...abbba..",
    "...bfcca..",
    "....ac....",
    "..aabbba..",
    ".abffffba.",
    "abccccccba",
    ".dddddddd.",
  ],
  "Bearer bonds": [
    "..aaaaaaa.",
    ".abbbffffa",
    "abbbbfcffa",
    "acccccccca",
    "adbbbfbbda",
    "acccccccca",
    "addddcddda",
    ".aaaaaaaa.",
  ],
  "Voice cipher": [
    ".aaaaaaaa.",
    "abbbbbbbba",
    "abddffddba",
    "abddffddba",
    "acccccccca",
    "acfffffcca",
    ".aaaaaaaa.",
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
    ".aaaaaaaa.",
  ],
  "Aegis Core": [
    "...aaaa...",
    ".aabbfbaa.",
    "abffdddfba",
    "abfdffdfba",
    ".abdfcdba.",
    "..abccba..",
    "...abba...",
    "....aa....",
  ],
  "Blackstar diamond": [
    "...aaaa...",
    "..abffba..",
    ".abbddcba.",
    "abfddddcba",
    ".acddddca.",
    "..acddca..",
    "...acca...",
    "....aa....",
  ],
};
function trophy(g: Pixels, l: Level, x: number, y: number, t: number) {
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
      f: "#fff7c5",
    },
    2,
  );
}
// The repeater occupies the sealed signal gantry above the shunt line.
function yardBoard(g: Pixels, s: Heist) {
  const yard = s.level.handoff!;
  const x = OX + 14 * T,
    y = OY + T + 4;
  g.rect(x, y, 172, 54, "#5b675f");
  g.rect(x + 2, y + 2, 168, 50, "#192725");
  g.rect(x + 4, y + 4, 164, 13, "#283b37");
  g.label(x + 9, y + 7, "MORROW  /  LINE ZERO", "#ded0a9");
  const signals = [
    { name: "A SHUNT", gate: yard.release, on: "CLEAR", off: "STOP" },
    { name: "B BERTH", gate: yard.berth, on: "HELD", off: "EMPTY" },
    { name: "C LIFT", gate: yard.departure, on: "BOARD", off: "WAIT" },
  ];
  signals.forEach((signal, i) => {
    const left = x + 6 + i * 54;
    const lit =
      signal.gate === yard.berth
        ? s.actors.some(
            (a) => !a.caught && atControl(a, s.level.gates[yard.berth]),
          )
        : s.doors[signal.gate];
    g.label(left + 2, y + 22, signal.name, "#b1c0b6");
    g.rect(left, y + 32, 50, 15, "#0a1415");
    g.rect(left + 3, y + 37, 4, 4, lit ? mint : "#927052");
    g.label(
      left + 11,
      y + 36,
      lit ? signal.on : signal.off,
      lit ? mint : "#cbad78",
    );
  });
}

export class Feed {
  paths = false;
  target?: Point;
  tileAt(u: number, v: number) {
    return { x: Math.floor((u * W - OX) / T), y: Math.floor((v * H - OY) / T) };
  }
  g: Pixels;
  cache: HTMLCanvasElement;
  level: Level;
  flash = 0;
  doors: number[] = [];
  endGlow = 0;
  escape = 0;
  constructor(canvas: HTMLCanvasElement, l: Level) {
    this.g = new Pixels(canvas, W, H);
    this.cache = document.createElement("canvas");
    this.level = l;
    this.setLevel(l);
  }
  setLevel(l: Level) {
    this.level = l;
    this.doors = l.gates.map(() => 0);
    surface(new Pixels(this.cache, W, H), l);
  }
  draw(s: Heist, frame: number, reduced: boolean) {
    const g = this.g,
      l = s.level,
      t = reduced ? 0 : frame;
    g.ctx.drawImage(this.cache, 0, 0);
    if (s.phase === "lockdown") {
      g.rect(0, 0, W, H, "#c82b4018");
      for (const gate of l.gates) {
        const lamp = pos(gate);
        const intensity = Math.round(36 + 16 * Math.sin(t / 16));
        g.glow(lamp.x, lamp.y - 14, 32, "#ff394d" + intensity.toString(16));
        g.rect(lamp.x - 5, lamp.y - 13, 10, 2, "#ff8180");
      }
    }
    if (l.handoff) yardBoard(g, s);
    if (this.paths)
      s.tracks.forEach((track, i) => {
        const color = ECHO_COLORS[i % ECHO_COLORS.length];
        g.ctx.globalAlpha = 0.52;
        for (const point of track.trace) {
          const p = world(point);
          g.rect(p.x, p.y, 2, 2, color);
        }
        g.ctx.globalAlpha = 1;
      });
    if (this.target) {
      const p = pos(this.target);
      for (const dx of [-1, 1])
        for (const dy of [-1, 1]) {
          g.line(
            p.x + dx * 8,
            p.y + dy * 8,
            p.x + dx * 5,
            p.y + dy * 8,
            "#bce9da",
          );
          g.line(
            p.x + dx * 8,
            p.y + dy * 8,
            p.x + dx * 8,
            p.y + dy * 5,
            "#bce9da",
          );
        }
    }
    const ex = pos(l.exit);
    g.rect(ex.x - 10, ex.y - 9, 20, 18, "#102b2c");
    for (const a of [-1, 1])
      for (const b of [-1, 1]) {
        const x = ex.x + 9 * a,
          y = ex.y + 8 * b;
        g.rect(x - (a > 0 ? 4 : 0), y, 5, 2, mint);
        g.rect(x, y - (b > 0 ? 4 : 0), 2, 5, mint);
      }
    for (let j = -1; j <= 1; j++)
      for (let i = 0; i < 3; i++)
        g.rect(ex.x + i - 2, ex.y + j * 4 + Math.abs(i - 1), 1, 1, mint);
    tag(g, ex.x, ex.y + 13, "EXIT", "#84c7b8");
    l.gates.forEach((k, i) => {
      const b = pos(k);
      const label = k.label ?? String.fromCharCode(65 + i);
      if (k.kind !== "automatic") {
        const a = pos(k.source),
          on = s.actors.some((e) => !e.caught && atControl(e, k)),
          col = k.kind === "pulse" ? "#8ebdff" : violet;
        if (k.kind === "pulse" && k.phase) {
          const armed = k.phase === s.phase;
          tag(
            g,
            a.x,
            a.y - 19,
            armed ? "ARMED" : "OFFLINE",
            armed ? amber : "#afbac9",
          );
        }
        if (on && (!k.phase || k.phase === s.phase)) {
          g.glow(a.x, a.y, 34, "#bba1ff66");
          const light = i % 2 ? "#c6a2f2" : "#82c8b3";
          g.line(a.x, a.y, a.x, b.y, light);
          g.line(a.x, b.y, b.x, b.y, light);
          const seg = Math.abs(b.y - a.y) + Math.abs(b.x - a.x),
            progress = Math.floor(t * 0.8) % Math.max(seg, 1);
          const sy = Math.min(progress, Math.abs(b.y - a.y)),
            sx = progress - sy;
          g.rect(
            a.x + sx * Math.sign(b.x - a.x) - 1,
            a.y + sy * Math.sign(b.y - a.y) - 1,
            3,
            3,
            "#c4e9d7",
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
          (k.kind === "pulse" ? (k.phase ? "RELAY " : "PULSE ") : "PAD ") +
            label,
          col,
        );
      }
      g.rect(b.x - 12, b.y - 12, 24, 24, "#13212c");
      for (let j = 0; j < 6; j++) {
        g.rect(b.x - 12 + j * 4, b.y - 12, 2, 2, amber);
        g.rect(b.x - 12 + j * 4, b.y + 10, 2, 2, amber);
      }
      const goal = s.doors[i] ? 1 : 0;
      this.doors[i] = reduced
        ? goal
        : this.doors[i] + (goal - this.doors[i]) * 0.3;
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
          goal ? mint : "#ff7779",
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
      if (k.label || !s.doors[i])
        tag(
          g,
          b.x,
          b.y + 14,
          k.kind === "automatic"
            ? (k.phase === "normal" ? "SHUTTER " : "HATCH ") + label
            : l.gates.length === 1
              ? "LOCKED"
              : "GATE " + label,
          s.doors[i] ? mint : "#f3a29c",
        );
      if (k.kind === "pulse" && s.doors[i])
        g.rect(
          b.x - 10,
          b.y - 14,
          (20 * Math.max(0, s.pulses[i] - s.tick)) / PULSE_TICKS,
          2,
          "#9ac6ff",
        );
    });
    if (l.patrol) {
      const b = pos(l.patrol.bell);
      g.rect(b.x - 8, b.y - 7, 16, 14, "#382c2c");
      for (let i = 0; i < 4; i++)
        g.rect(b.x - 6 + i * 3, b.y - 5, 2, 10, "#d68d64");
      tag(g, b.x, b.y + 11, "BUZZER", amber);
      const q = world(s.guard);
      if (!s.distracted) {
        // Sample the exact sight predicate at pixel-grid intervals, including wall occlusion.
        for (let y = q.y - 107; y <= q.y + 107; y += 3)
          for (let x = q.x - 107; x <= q.x + 107; x += 3) {
            const probe = {
              ...s.player,
              x: ((x - OX) * UNIT) / T,
              y: ((y - OY) * UNIT) / T,
              caught: false,
            };
            if (s.sees(probe, l.patrol)) g.rect(x, y, 3, 3, "#ff777433");
          }
      }
      runner(g, q.x, q.y, "#fb7e87", t, !s.distracted, s.distracted ? 1 : 2);
      tag(g, q.x, q.y - 23, s.distracted ? "?" : "SEC", "#fb979e");
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
    if (!s.loot) {
      trophy(g, l, tr.x, tr.y - 5, t);
      tag(g, tr.x, tr.y + 14, "LOOT", amber);
    }
    if (!s.bonus) {
      const b = pos(l.bonus);
      diamond(g, b.x, b.y, true, t);
      tag(g, b.x, b.y + 9, "INTEL", "#bfa9e0");
    }
    s.actors.forEach((actor, i) => {
      const live = actor === s.player,
        q = world(actor),
        col = live ? mint : ECHO_COLORS[i % ECHO_COLORS.length];
      g.ctx.globalAlpha = actor.caught ? 0.4 : live ? 1 : 0.88;
      g.glow(q.x, q.y, live ? 22 : 16, live ? "#64f7c731" : "#ae86f72f");
      if (!live) {
        g.rect(q.x - 8, q.y + 6, 16, 1, col);
        g.rect(q.x - 6, q.y + 8, 12, 1, col);
      }
      runner(g, q.x, q.y, col, t, actor.walking && s.started, actor.face);
      if (live) {
        g.rect(q.x - 6, q.y + 7, 12, 1, mint);
        tag(g, q.x, q.y - 25, "YOU", mint);
      } else if (
        !near(
          s.player,
          { x: actor.x / UNIT - 0.5, y: actor.y / UNIT - 0.5 },
          155,
        )
      ) {
        tag(g, q.x, q.y - 22, "E" + (i + 1), col);
      }
      g.ctx.globalAlpha = 1;
    });
    if (this.escape > 0 && !reduced) {
      const a = pos(l.exit),
        phase = 1 - this.escape;
      g.glow(a.x, a.y, 35 + phase * 45, "#95ffd85c");
      for (let j = 0; j < 30; j++) {
        const angle = j * 2.39996,
          r = phase * (10 + (noise(j, 1) % 53));
        g.rect(
          a.x + Math.cos(angle) * r,
          a.y + Math.sin(angle) * r - phase * 7,
          2,
          2,
          j % 3 ? mint : amber,
        );
      }
      this.escape = Math.max(0, this.escape - 0.015);
    }
    if (this.flash > 0) {
      if (!reduced) {
        const p = pos(l.start),
          phase = 1 - this.flash;
        g.glow(p.x, p.y, 14 + phase * 30, "#c8aaff55");
        for (let j = 0; j < 18; j++) {
          const angle = (j * Math.PI) / 9,
            rad = 3 + phase * 24;
          g.rect(
            p.x + Math.cos(angle) * rad,
            p.y + Math.sin(angle) * rad * 0.65,
            2,
            1,
            "#cbaeff",
          );
        }
      }
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
    if (s.tick > LIMIT - 300) g.rect(0, H - 2, W, 2, "#ee787e");
  }
}
