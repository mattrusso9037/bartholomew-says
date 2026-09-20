import { Quaternion } from "three";

/** Retain the displayed orientation across clip changes and parent-bone motion. */
export class HeadMotion {
  readonly rotation = new Quaternion();
  private initialized = false;

  reset() { this.initialized = false; }

  update(target: Quaternion, delta: number, still = false) {
    if (!this.initialized || still) {
      this.rotation.copy(target);
      this.initialized = true;
    } else {
      const dt = Math.min(Math.max(delta, 0), 0.05);
      const angle = this.rotation.angleTo(target);
      // Exponential damping, with an angular speed limit for abrupt source poses.
      const step = Math.min(angle * (1 - Math.exp(-9 * dt)), 1.8 * dt);
      if (angle > 1e-7) this.rotation.slerp(target, step / angle);
    }
    return this.rotation;
  }
}
