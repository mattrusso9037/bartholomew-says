export type CharacterPhase = "seated" | "drowsy" | "curling" | "sleeping" | "waking" | "stretching" | "settling";

/** Simulation time pauses the schedule with tab hiding and Stillness. */
export class CharacterDirector {
  phase: CharacterPhase = "seated";
  elapsed = 0;
  duration = 20;
  private wakeRequested = false;
  private lastVisit: "drowsy" | "curling" | "stretching" = "drowsy";
  constructor(private random: () => number, private curlDuration: number, private drowsyDuration: number, private settleDuration: number) {
    this.duration = this.rest(14, 22);
  }
  private rest(min: number, max: number) { return min + this.random() * (max - min); }
  requestAttention() { this.wakeRequested = true; }
  update(delta: number): CharacterPhase | null {
    this.elapsed += Math.min(Math.max(delta, 0), 0.05);
    if (this.phase === "sleeping" && this.wakeRequested && this.elapsed > 5) this.duration = this.elapsed;
    if (this.elapsed < this.duration) return null;
    let next: CharacterPhase;
    switch (this.phase) {
      case "seated": {
        const options = (["drowsy", "curling", "stretching"] as const).filter(p => p !== this.lastVisit);
        next = options[Math.min(options.length - 1, Math.floor(this.random() * options.length))];
        this.lastVisit = next;
        this.wakeRequested = false;
        break;
      }
      case "drowsy": next = "seated"; break;
      case "curling": next = "sleeping"; break;
      case "sleeping": next = "waking"; break;
      case "waking": next = "seated"; this.wakeRequested = false; break;
      case "stretching": next = "settling"; break;
      case "settling": next = "seated"; break;
    }
    this.phase = next;
    this.elapsed = 0;
    this.duration = next === "seated" ? this.rest(18, 34)
      : next === "sleeping" ? this.rest(24, 42)
      : next === "drowsy" ? this.drowsyDuration
      : next === "stretching" || next === "settling" ? this.settleDuration
      : this.curlDuration;
    return next;
  }
}
