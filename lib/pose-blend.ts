import type { AnimationAction } from "three";

/** Blend from the currently visible mixture, including interrupted transitions. */
export class PoseBlend {
  private sources: { action: AnimationAction; weight: number }[] = [];
  private target: AnimationAction | null = null;
  private elapsed = 0;

  reset() { this.target = null; this.sources = []; }

  start(target: AnimationAction, actions: AnimationAction[]) {
    this.sources = actions.map(action => ({ action, weight: action.getEffectiveWeight() * Number(action.enabled && action.isScheduled()) }));
    for (const { action } of this.sources) action.stopFading();
    this.target = target;
    this.elapsed = 0;
  }

  update(delta: number) {
    if (!this.target) return;
    this.elapsed += Math.min(Math.max(delta, 0), 0.05);
    const t = Math.min(1, this.elapsed / 1.6);
    const mix = t * t * (3 - 2 * t);
    for (const { action, weight } of this.sources) {
      action.setEffectiveWeight(weight * (1 - mix) + Number(action === this.target) * mix);
      if (t === 1 && action !== this.target) action.stop();
    }
    if (t === 1) this.target = null;
  }
}
