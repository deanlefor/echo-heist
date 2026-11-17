export type Point = { x: number; y: number };
export type SecurityPhase = "normal" | "lockdown";
export type Gate = Point & { label?: string; phase?: SecurityPhase } & (
    | { kind: "plate" | "pulse"; source: Point }
    | { kind: "automatic"; phase: SecurityPhase; source?: never }
  );
export interface Patrol {
  from: Point;
  to: Point;
  look: Point;
  bell: Point;
}
export interface Level {
  title: string;
  site: string;
  item: string;
  brief: string;
  hint: string;
  quip: string;
  tiles: string[];
  start: Point;
  exit: Point;
  loot: Point;
  bonus: Point;
  gates: Gate[];
  patrol?: Patrol;
  lockdownOnLoot?: boolean;
  zones?: { name: string; firstColumn: number }[];
  victory?: { eyebrow: string; title: string };
  par: number;
  medalTimes: { bronze: number; silver: number; gold: number };
}
export const p = (x: number, y: number): Point => ({ x, y });
export const gate = (
  x: number,
  y: number,
  sx: number,
  sy: number,
  kind: "plate" | "pulse" = "plate",
): Gate => ({ x, y, source: p(sx, sy), kind });
export const company: Level = {
  title: "Three’s Company",
  site: "Relay Exchange",
  item: "Bearer bonds",
  brief:
    "Chain two pressure locks together and bring the bonds back to extraction.",
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
    "#######################",
  ],
  start: p(3, 6),
  exit: p(2, 7),
  loot: p(20, 6),
  bonus: p(19, 2),
  gates: [gate(8, 6, 5, 3), gate(16, 6, 13, 8)],
  par: 3,
  medalTimes: { bronze: 45, silver: 30, gold: 20 },
};
export const first: Level = {
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
    "#######################",
  ],
  start: p(4, 6),
  exit: p(3, 8),
  loot: p(18, 5),
  bonus: p(19, 2),
  gates: [gate(11, 6, 7, 3)],
  par: 2,
  medalTimes: { bronze: 35, silver: 22, gold: 15 },
};
export const distraction: Level = {
  title: "The Distraction",
  site: "Hushline Archives",
  item: "Voice cipher",
  brief:
    "Draw the sentry away with the floor buzzer. Slip past its sightline and steal the voice cipher.",
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
    "#######################",
  ],
  start: p(3, 6),
  exit: p(2, 7),
  loot: p(19, 5),
  bonus: p(18, 8),
  gates: [],
  patrol: { from: p(15, 6), to: p(16, 6), look: p(-1, 0), bell: p(6, 3) },
  par: 2,
  medalTimes: { bronze: 38, silver: 24, gold: 15 },
};
export const timing: Level = {
  title: "Perfect Timing",
  site: "Pendulum Works",
  item: "Phase crystal",
  brief:
    "Pulse the relay to open the shutter for 2.5 seconds. Take the crystal to the far lift.",
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
    "#######################",
  ],
  start: p(3, 7),
  exit: p(20, 8),
  loot: p(18, 3),
  bonus: p(16, 9),
  gates: [gate(14, 7, 4, 2, "pulse")],
  par: 2,
  medalTimes: { bronze: 30, silver: 18, gold: 12 },
};
export const score: Level = {
  title: "The Big Score",
  victory: { eyebrow: "Blackstar recovered", title: "The Big Score is yours." },
  site: "Parallax Treasury",
  item: "Blackstar diamond",
  brief:
    "Beat the pressure lock, divert the guard and pulse the inner vault. Get the Blackstar to the east lift.",
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
    "#######################",
  ],
  start: p(3, 6),
  exit: p(20, 8),
  loot: p(20, 3),
  bonus: p(18, 9),
  gates: [gate(8, 6, 5, 3), gate(16, 6, 10, 2, "pulse")],
  patrol: { from: p(18, 6), to: p(19, 6), look: p(-1, 0), bell: p(10, 8) },
  par: 4,
  medalTimes: { bronze: 50, silver: 32, gold: 20 },
};
export const lockdown: Level = {
  title: "The Lockdown",
  site: "Vesper Reserve",
  item: "Aegis Core",
  brief:
    "Lift the core in the east vault. A and B seal on theft. Hatch H opens toward pad C, which powers the lower maintenance exit.",
  hint: "From spawn, hold Right against H until 20s remain, then rewind. Leave your next Echo on A. Go straight to the core. A longer gallery stair also reaches pad C before theft.",
  quip: "Management reviewed all three alibis. The handwriting matched.",
  victory: { eyebrow: "Aegis Core recovered", title: "Lockdown breached." },
  tiles: [
    "#######################",
    "##...###.SS#####...SS.#",
    "#..............#......#",
    "#.....##...##.........#",
    "#.....######...#......#",
    "#.C...######.###......#",
    "#..........#.###......#",
    "#.....##.###.####....##",
    "#.....##.....####....##",
    "##..##############.####",
    "##.................####",
    "#######################",
  ],
  start: p(3, 6),
  exit: p(3, 8),
  loot: p(17, 2),
  bonus: p(21, 5),
  gates: [
    { ...gate(6, 2, 2, 4), label: "A", phase: "normal" },
    { x: 15, y: 3, label: "B", kind: "automatic", phase: "normal" },
    { ...gate(18, 9, 10, 6), label: "C", phase: "lockdown" },
    { x: 6, y: 6, label: "H", kind: "automatic", phase: "lockdown" },
  ],
  patrol: { from: p(20, 4), to: p(20, 6), look: p(1, 0), bell: p(17, 5) },
  lockdownOnLoot: true,
  par: 3,
  zones: [
    { name: "WEST LOBBY", firstColumn: 1 },
    { name: "CENTRAL GALLERY", firstColumn: 7 },
    { name: "EAST VAULT", firstColumn: 16 },
  ],
  medalTimes: { bronze: 58, silver: 40, gold: 30 },
};
export const levels: Level[] = [
  first,
  company,
  distraction,
  timing,
  score,
  lockdown,
];
