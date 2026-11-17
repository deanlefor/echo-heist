import { ECHO_COLORS } from "./pixels.ts";
import {
  Heist,
  LIMIT,
  RELAY_STAMP,
  HZ,
  RIGHT,
  UNIT,
  RADIUS,
  near,
  atControl,
} from "./sim.ts";
export const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
export const digits = (n: number) => String(n).padStart(2, "0");
const paths: Record<string, string> = {
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
  restart: "M16 4v5h-5m5 0-3-4H7L3 9v4l4 3h5l3-2",
};
export function icon(name: string) {
  return (
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' +
    paths[name] +
    '"/></svg>'
  );
}
export function icons(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-icon]").forEach((i) => {
    i.innerHTML = icon(i.dataset.icon!);
  });
}
export function text(id: string, value: string) {
  const node = el(id);
  if (node.textContent !== value) node.textContent = value;
}
// The operator cue follows the replayed body. The stamp marker describes the
// original input tape; neither changes whether the relay receives USE.
export function dispatchStatus(s: Heist) {
  const box = s.level.signalBox;
  if (!box) return;
  const relay = s.level.gates.findIndex((g) => g.kind === "pulse");
  const gate = s.level.gates[relay];
  const atPostmark = near(s.player, s.level.loot, 205);
  let recorded = false,
    pending = false,
    clerkThrough = false,
    ready = false;
  // The next tick is already too late to arm a relay stamped on that tick.
  const nextStamp = s.tick + (s.phase === "normal" ? 1 : 0);
  for (const [i, tape] of s.tracks.entries()) {
    if (!tape.activity.includes(RELAY_STAMP)) continue;
    recorded = true;
    const a = s.actors[i];
    const through =
      !a.caught &&
      a.x - RADIUS >= box.min.x * UNIT &&
      a.x + RADIUS < (box.max.x + 1) * UNIT &&
      a.y >= box.min.y * UNIT &&
      a.y < (box.max.y + 1) * UNIT;
    const upcoming = tape.activity.includes(RELAY_STAMP, nextStamp);
    clerkThrough ||= through;
    pending ||= upcoming;
    ready ||= through && upcoming;
  }
  if (s.phase === "normal") {
    if (atControl(s.player, gate))
      return s.activity.includes(RELAY_STAMP)
        ? "Offline stamp recorded. Rewind to give this job to your Echo."
        : "Relay R offline. Press E to put a stamp on your tape.";
    if (!atPostmark) return;
    if (ready)
      return "Shutter S clear. Take the postmark now with E or a second click.";
    if (pending) return "Wait here. Your clerk still has to cross shutter S.";
    if (recorded)
      return "Too late for this stamp. Press T to retry with this crew.";
    return "Record an Echo pressing E at relay R before taking the postmark.";
  }
  if (
    s.player.x - RADIUS >= (gate.x + 1) * UNIT &&
    s.player.y > (box.max.y + 1) * UNIT
  )
    return "Dispatch cleared. Take the green EXIT or collect the violet intel first.";
  const left = s.pulses[relay] - s.tick;
  if (left > 0)
    return left <= HZ
      ? "Gate R closing. Cross the striped threshold now."
      : "Dispatch pulse! Gate R is open. Head east to EXIT.";
  if (s.doors[relay]) return "Gate R interlock engaged. Finish crossing.";
  if (s.pulses[relay] && !pending)
    return "Gate R closed. The dispatch pulse expired. Press T to try again.";
  const shutter = s.level.gates.findIndex(
    (g) => g.kind === "automatic" && g.phase === "normal",
  );
  if (!recorded)
    return "No stamp on tape. Record an Echo using the offline relay R.";
  if (!s.doors[shutter] && !clerkThrough)
    return "Too early. Shutter S sealed the clerk out. Press T and let them cross.";
  if (!pending)
    return "Too late. Relay R needed lockdown before the stamp. Press T to retry.";
  return "Relay R armed. Move toward gate R while your clerk approaches the stamp.";
}

// Read the current bodies and remaining tape inputs, including runs in which
// a different Echo (or the live operator) takes over a station.
export function handoffStatus(s: Heist) {
  const yard = s.level.handoff;
  if (!yard) return;
  const release = s.level.gates[yard.release];
  const berth = s.level.gates[yard.berth];
  const departure = s.level.gates[yard.departure];
  if (atControl(s.player, departure) && s.pulses[yard.departure])
    return "Departure stamped. Rewind here to send the crew out with you.";
  if (s.loot && s.player.x - RADIUS > (departure.x + 1) * UNIT)
    return s.bonus
      ? "Intel aboard. Step onto EXIT."
      : "Platform Zero reached. Board at EXIT or collect the platform intel.";
  if (s.doors[yard.departure])
    return s.loot
      ? "Departure bell! Cross gate C now."
      : "Gate C is open. Bring the brass token aboard.";
  if (s.pulses[yard.departure] && s.loot)
    return "Missed departure. Press T with this crew and bring the token to C sooner.";
  if (near(s.player, s.level.loot, 205) && !s.loot)
    return "Press E for the brass token, then head east to gate C.";
  if (atControl(s.player, berth) && s.tracks.length)
    return "Pad B held. Let your operator enter the booth before you double back.";
  if (s.doors[yard.berth])
    return s.loot
      ? "Berth B received. Wait at gate C for the departure pulse."
      : "Berth B received! Through gate B, click pulse C to call the train.";
  if (near(s.player, release, UNIT) && !s.tracks.length)
    return s.tick < 8 * HZ
      ? "Shutter A shut. Keep pushing Right until 22s remain to give your operator time."
      : "Push recorded. Rewind here, then work the switch at pulse A.";
  const onLine = s.tracks.findIndex((_, i) => {
    const runner = s.actors[i];
    return (
      Math.abs(runner.y - (release.y + 0.5) * UNIT) < UNIT / 2 &&
      runner.x >= release.x * UNIT - UNIT
    );
  });
  if (onLine >= 0) {
    const moving = s.tracks[onLine].commands.some(
      (cmd, tick) => tick >= s.tick && !!(cmd & RIGHT),
    );
    if (!moving)
      return "Runner stopped short of B. Release A earlier or record a longer eastbound push.";
    if (s.actors[onLine].x > (release.x + 0.5) * UNIT)
      return "Runner through A. Watch the berth light as they reach pad B.";
    if (s.doors[yard.release])
      return "A released. The runner can cross on their recorded inputs.";
    if (s.pulses[yard.release])
      return "A closed too soon. Pulse again at the shutter, or change the operator’s tape.";
    return s.loot
      ? "Runner at A. Watch for your operator’s release."
      : "Runner at A. Pulse A now to send them onto pad B.";
  }
  if (s.pulses[yard.release] && !s.doors[yard.release])
    return "A closed before the runner arrived. Pulse again when they reach the shutter.";
  if (s.loot)
    return "Token secured. Stage at gate C while your crew works the line.";
  if (s.tracks.length && atControl(s.player, release))
    return "Switch A ready. Watch the runner approach, then press E to release.";
  if (!s.tracks.length)
    return "Send the first runner east. Click pad B and keep pushing against shutter A.";
  return s.level.brief;
}

export class Timeline {
  count = -1;
  lastTick = -1;
  draw(s: Heist) {
    const rebuild = this.count !== s.tracks.length;
    if (rebuild) {
      this.count = s.tracks.length;
      el("lanes").replaceChildren();
      for (let i = 0; i <= this.count; i++) {
        const row = document.createElement("div");
        row.className = "lane";
        const live = i === this.count,
          label = live ? "You" : "Echo " + (i + 1),
          col = live ? "#87e9c8" : ECHO_COLORS[i % ECHO_COLORS.length];
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
    if (!rebuild && this.lastTick === s.tick) return;
    this.lastTick = s.tick;
    const bars = el("lanes").querySelectorAll("canvas");
    bars.forEach((cv, i) => {
      const g = cv.getContext("2d")!,
        live = i === s.tracks.length,
        color = live ? "#87e9c8" : ECHO_COLORS[i % ECHO_COLORS.length];
      g.clearRect(0, 0, 600, 10);
      g.fillStyle = "#2c3545";
      for (let x = 0; x < 600; x += 10) g.fillRect(x, 0, 1, x % 100 ? 3 : 10);
      const a = live ? s.activity : s.tracks[i].activity;
      g.fillStyle = color;
      for (let n = 0; n < a.length; n += 3) {
        const v = Math.max(a[n], a[n + 1] || 0, a[n + 2] || 0),
          h = [2, 4, 8, 10, 10][v];
        g.fillStyle = v === RELAY_STAMP ? "#ffd877" : color;
        g.fillRect(n / 3, 10 - h, v === RELAY_STAMP ? 3 : 1, h);
      }
      if (!live && a.at(-1) === 2) {
        g.globalAlpha = 0.32;
        for (let x = Math.ceil(a.length / 3); x < 600; x += 5)
          g.fillRect(x, 5, 3, 3);
        g.globalAlpha = 1;
      }
      g.fillStyle = "#f3f7fe";
      g.fillRect(Math.min(599, (600 * s.tick) / LIMIT), 0, 2, 10);
    });
  }
}
