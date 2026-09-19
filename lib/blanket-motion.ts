import type { CharacterPhase } from "./character-motion";

function smooth(value: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

/** Independent cloth timing: arrive at the shoulder, then stay on the book after waking. */
export function blanketEnvelope(phase: CharacterPhase, progress: number, secondsAfterWake: number) {
  if (phase === "curling") return { opacity: smooth(progress, 0.22, 0.48), settle: 0 };
  if (phase === "sleeping") return { opacity: 1, settle: 0 };
  if (phase === "waking") return { opacity: 1, settle: smooth(progress, 0.08, 0.8) };
  return { opacity: 1 - smooth(secondsAfterWake, 1.6, 3.2), settle: 1 };
}
