import type { Cue } from "./sim.ts";
export class AudioDeck {
  ctx?: AudioContext;
  bus?: GainNode;
  muted = false;
  active = false;
  next = 0;
  beat = 0;
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
    if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
  }
  toggle() {
    this.muted = !this.muted;
    if (this.bus && this.ctx)
      this.bus.gain.setTargetAtTime(
        this.muted ? 0 : 0.48,
        this.ctx.currentTime,
        0.02,
      );
  }
  tone(
    f: number,
    end: number,
    len: number,
    type: OscillatorType,
    vol: number,
    delay = 0,
  ) {
    const c = this.ctx;
    if (!c || !this.bus || this.muted || c.state !== "running") return;
    const at = c.currentTime + delay,
      o = c.createOscillator(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    o.frequency.exponentialRampToValueAtTime(end, at + len);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g);
    g.connect(this.bus);
    o.start(at);
    o.stop(at + len + 0.02);
  }
  effect(cue: Cue) {
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
        0.22,
      );
    }
    if (cue === "loot" || cue === "bonus" || cue === "clear") {
      (cue === "clear" ? [392, 494, 587, 784, 988] : [587, 784, 988]).forEach(
        (f, i) => this.tone(f, f, 0.23, "square", 0.056, i * 0.083),
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
      const f =
        bass * [4, 6, 8, 7.12, 4.76, 6, 8, 9.52][Math.floor(this.beat / 2) % 8];
      this.tone(f, f, 0.21, "sine", 0.064);
    }
    if (this.beat % 4 === 2) this.tone(1900, 620, 0.04, "triangle", 0.028);
    this.beat++;
  }
}
