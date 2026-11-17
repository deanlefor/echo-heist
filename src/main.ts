import { levels } from "./levels.ts";
import {
  Heist,
  Clock,
  UP,
  DOWN,
  LEFT,
  RIGHT,
  USE,
  LIMIT,
  near,
  atControl,
} from "./sim.ts";
import { Feed } from "./render.ts";
import { PointerRoute } from "./input.ts";
import { AudioDeck } from "./audio.ts";
import { skyline, wordmark } from "./skyline.ts";
import { el, digits, text, icons, icon, Timeline } from "./ui.ts";
import { readSave, writeSave, result, better, medals } from "./save.ts";
const save = readSave(),
  audio = new AudioDeck(),
  clock = new Clock(),
  timeline = new Timeline();
audio.muted = save.muted;
let index = save.selected,
  s = new Heist(levels[index]);
const route = new PointerRoute();
const board = el<HTMLCanvasElement>("board"),
  feed = new Feed(board, s.level);
const dialog = el<HTMLDialogElement>("dialog"),
  keys = new Map<string, number>(),
  reduced = matchMedia("(prefers-reduced-motion: reduce)");
let queued = 0,
  thumb = 0,
  last = performance.now(),
  frameCount = 0,
  previousPause = false;
let notice = "",
  noticeUntil = 0,
  overlayMode = "",
  newRecord = false,
  showReceiptAt = 0;
const moveKeys: Record<string, number> = {
  KeyW: UP,
  ArrowUp: UP,
  KeyA: LEFT,
  ArrowLeft: LEFT,
  KeyS: DOWN,
  ArrowDown: DOWN,
  KeyD: RIGHT,
  ArrowRight: RIGHT,
};
function artwork(id: string, draw: (canvas: HTMLCanvasElement) => void) {
  const canvas = document.createElement("canvas");
  draw(canvas);
  const img = el<HTMLImageElement>(id);
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
function say(value: string, seconds = 2.5) {
  notice = value;
  noticeUntil = performance.now() + seconds * 1000;
}
function soundButton() {
  el("audio").innerHTML =
    "<i>" +
    icon(audio.muted ? "mute" : "sound") +
    "</i><span>Sound " +
    (audio.muted ? "off" : "on") +
    "</span>";
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
    const b = document.createElement("button"),
      rec = save.records[i];
    b.className = "job" + (i === index ? " active" : "");
    b.setAttribute("aria-current", i === index ? "true" : "false");
    b.innerHTML =
      '<span class="idx">' +
      digits(i + 1) +
      '</span><span class="jname">' +
      l.title +
      '</span><span class="mark">' +
      (rec ? "◆" : i === index ? "◂" : "·") +
      "</span>";
    if (rec)
      b.title =
        medals[rec.medal] +
        " · " +
        rec.loops +
        " loops · " +
        (rec.ticks / 60).toFixed(2) +
        "s";
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
      "Best · " +
        medals[best.medal] +
        " · " +
        best.loops +
        " loops · " +
        (best.ticks / 60).toFixed(2) +
        "s",
    );
}
function switchTo(i: number) {
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
  text("filecode", "EH–" + digits(i + 1));
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
  el("hint").innerHTML =
    "<span><i>" +
    icon("bulb") +
    "</i>" +
    (show ? "Hide hint" : "Show hint") +
    "</span><b>" +
    (show ? "−" : "+") +
    "</b>";
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
  const g = s.level.gates.find((g) => atControl(s.player, g));
  if (g?.kind === "pulse") {
    const remaining = s.pulses[s.level.gates.indexOf(g)] - s.tick;
    if (remaining > 0)
      return (
        "Pulse active · " +
        (remaining / 60).toFixed(1) +
        "s left. Press R to record this timing."
      );
  }
  if (g)
    return g.kind === "pulse"
      ? "Tap E to send a 2.5-second pulse. Rewind to replay it."
      : "Pad engaged. Press R here to leave an Echo holding it.";
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
  const mode = s.won
    ? performance.now() >= showReceiptAt
      ? "won"
      : ""
    : s.player.caught
      ? "caught"
      : s.paused && !dialog.open
        ? "paused"
        : "";
  if (mode === overlayMode) return;
  overlayMode = mode;
  const o = el("overlay");
  o.hidden = !mode;
  if (!mode) return;
  if (mode === "won") {
    const r = result(s),
      best = save.records[index],
      final = index === levels.length - 1;
    o.innerHTML =
      '<div class="seal">◆</div><div class="eyebrow">' +
      (final ? "Blackstar recovered" : "Extraction confirmed") +
      "</div><h3>" +
      (final ? "The Big Score is yours." : "Clean getaway.") +
      "</h3><p>" +
      s.level.quip +
      '</p><div class="receipt">' +
      medals[r.medal] +
      " medal · " +
      r.loops +
      " loops · " +
      (r.ticks / 60).toFixed(2) +
      's</div><div class="scoreline">' +
      (newRecord
        ? "Personal best"
        : "Best " +
          medals[best.medal] +
          " · " +
          best.loops +
          " loops · " +
          (best.ticks / 60).toFixed(2) +
          "s") +
      " · Intel " +
      (r.bonus ? "secured" : "missed") +
      '</div><div class="choices"><button class="primary" id="next">' +
      (final ? "Back to first contract" : "Next contract →") +
      '</button><button id="replay">Replay</button></div>';
    el("next").onclick = () => switchTo((index + 1) % levels.length);
    el("replay").onclick = () => switchTo(index);
  } else if (mode === "caught") {
    o.innerHTML =
      '<div class="eyebrow">Security alert</div><h3>Cover blown.</h3><p>Your earlier Echoes are still on tape.</p><div class="choices"><button class="primary" id="retryNow">Retry loop <kbd>T</kbd></button><button id="keep">Keep Echo <kbd>R</kbd></button></div>';
    el("retryNow").onclick = () => action("retry");
    el("keep").onclick = () => action("rewind");
  } else {
    o.innerHTML =
      '<div class="eyebrow">Timeline on hold</div><h3>Paused</h3><button class="primary" id="resume">Resume <kbd>P</kbd></button>';
    el("resume").onclick = pause;
  }
}
function hud() {
  const hundredths = Math.ceil(((LIMIT - s.tick) * 100) / 60);
  const value =
    "00:" +
    digits(Math.floor(hundredths / 100)) +
    "<span>." +
    digits(hundredths % 100) +
    "</span>";
  if (el("time").innerHTML !== value) el("time").innerHTML = value;
  text("loop", digits(s.tracks.length + 1));
  text("echoes", digits(s.tracks.length));
  text("looted", s.loot ? "✓" : "");
  text("bonus", s.bonus ? "Secured ✓" : "Optional");
  const rec = s.paused
    ? "Paused"
    : s.won
      ? "Archived"
      : s.player.caught
        ? "Stopped"
        : s.started
          ? "Recording"
          : "Standby";
  text("rec", rec);
  el("rec").parentElement!.classList.toggle("live", rec === "Recording");
  el<HTMLButtonElement>("undo").disabled =
    !s.tracks.length || s.won || s.paused;
  el<HTMLButtonElement>("rewind").disabled = s.paused || s.won;
  const pauseButton = el<HTMLButtonElement>("pause");
  pauseButton.disabled = s.won || s.player.caught;
  const state = s.paused ? "Resume" : "Pause";
  if (pauseButton.querySelector("span")?.textContent !== state)
    pauseButton.innerHTML =
      "<i>" +
      icon(s.paused ? "play" : "pause") +
      "</i><span>" +
      state +
      "</span>";
  pauseButton.setAttribute("aria-label", state + " game");
  text(
    "status",
    performance.now() < noticeUntil && notice ? notice : contextual(),
  );
  timeline.draw(s);
  overlay();
}
function action(a: "rewind" | "undo" | "retry" | "restart") {
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
  el("dialog-content").innerHTML =
    '<div class="eyebrow">Operator handbook</div><h3>Work with your past.</h3><p>Click a floor tile to walk there, or use the keyboard. Click loot to collect it. Rewind to keep the route you just ran. Each Echo starts with you, repeats its inputs, then waits where its tape ends.</p><dl><dt>WASD / Arrows</dt><dd>Move</dd><dt>E</dt><dd>Take loot or intel, pulse a relay</dd><dt>R / Z</dt><dd>Record an Echo / undo the last Echo</dd><dt>T / X</dt><dd>Retry with your crew / restart contract</dd><dt>Space</dt><dd>Start the clock while standing still</dd><dt>P / Esc</dt><dd>Pause or resume</dd><dt>M</dt><dd>Toggle audio</dd></dl><p>Gold requires bonus intel, at most ' +
    s.level.par +
    " loops and a total time of " +
    s.level.target +
    's or less on this contract.</p><button class="primary" id="dismiss">Back to the heist</button>';
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
        cue === "rewind"
          ? "Echo " +
              digits(s.tracks.length) +
              " recorded. Move to run the tape."
          : cue === "undo"
            ? "Last Echo erased. Remaining tapes are ready."
            : "Loop reset. Your crew is ready.",
        2,
      );
    }
    if (cue === "loot" || cue === "bonus") {
      feed.endGlow = 1;
      say(
        cue === "loot"
          ? "Loot secured. Move to the green EXIT pad."
          : "Bonus intel secured.",
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
  if (
    ![
      "Space",
      "KeyE",
      "KeyR",
      "KeyZ",
      "KeyT",
      "KeyX",
      "KeyP",
      "Escape",
      "KeyM",
      "KeyH",
    ].includes(e.code)
  )
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
document.querySelectorAll<HTMLButtonElement>("[data-dir]").forEach((b) => {
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
  b.onlostpointercapture =
    b.onpointercancel =
    b.onpointerup =
      () => {
        thumb &= ~dir;
      };
});
el("touch-use").onclick = () => {
  if (canRun()) {
    audio.wake();
    queued |= USE;
  }
};
function frame(t: number) {
  const delta = Math.max(0, (t - last) / 1000);
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
    (e.clientY - bounds.top) / bounds.height,
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
