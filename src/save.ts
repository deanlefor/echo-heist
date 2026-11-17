import { HZ, type Heist } from "./sim.ts";
import { levels, type Level } from "./levels.ts";
export type Result = {
  loops: number;
  ticks: number;
  bonus: boolean;
  medal: number;
};
export type Save = {
  selected: number;
  muted: boolean;
  records: Record<number, Result>;
};
const key = "echo-heist.v1";
export function readSave(): Save {
  const fallback: Save = { selected: 0, muted: false, records: {} };
  try {
    const data = JSON.parse(localStorage.getItem(key) || "null");
    if (!data || typeof data !== "object") return fallback;
    if (
      Number.isInteger(data.selected) &&
      data.selected >= 0 &&
      data.selected < levels.length
    )
      fallback.selected = data.selected;
    fallback.muted = data.muted === true;
    for (const [k, r] of Object.entries(data.records || {}) as [
      string,
      Result,
    ][]) {
      if (
        Object.hasOwn(levels, k) && /^\d+$/.test(k) &&
        r &&
        Number.isInteger(r.loops) &&
        r.loops > 0 &&
        Number.isInteger(r.ticks) &&
        r.ticks > 0 &&
        typeof r.bonus === "boolean"
      )
        fallback.records[Number(k)] = {
          ...r,
          medal: timeMedal(levels[Number(k)], r.ticks),
        };
    }
  } catch {
    /* Private storage and invalid saves still allow local play. */
  }
  return fallback;
}
export function writeSave(s: Save) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    /* Storage can be disabled. */
  }
}
export const tiers = ["bronze", "silver", "gold"] as const;
export const medals = ["Cleared", "Bronze", "Silver", "Gold"];
export function timeMedal(level: Level, ticks: number) {
  return tiers.filter(tier => ticks <= level.medalTimes[tier] * HZ).length;
}
export function formatTime(ticks: number) {
  return (ticks / HZ).toFixed(2) + "s";
}
export function result(s: Heist): Result {
  return {
    loops: s.attempts,
    ticks: s.elapsed,
    bonus: s.bonus,
    medal: timeMedal(s.level, s.elapsed),
  };
}
export function better(a: Result, b?: Result) {
  if (!b || a.ticks !== b.ticks) return !b || a.ticks < b.ticks;
  if (a.loops !== b.loops) return a.loops < b.loops;
  return a.bonus && !b.bonus;
}
