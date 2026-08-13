/**
 * Deterministic demo clock. Every relative date in the prototype is derived
 * from this anchor so SSR and hydration agree, and so the Lab Tech
 * Dashboard's "fast-forward" control moves time for every view at once.
 */
export const DEMO_ANCHOR = new Date("2026-08-05T06:00:00.000Z");

let offsetDays = 0;

export function setDemoClockOffsetDays(days: number): void {
  offsetDays = days;
}

export function demoNow(): Date {
  return new Date(DEMO_ANCHOR.getTime() + offsetDays * 86_400_000);
}
