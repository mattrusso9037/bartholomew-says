import assert from "node:assert/strict";
import test from "node:test";

// Simulate the CathedralArrival progression logic
function simulateArrival({ readyAtMs, timeoutAtMs = 12000, minDurationMs = 5000 }) {
  let started = 0;
  let progress = 0;
  let completed = false;
  let completedAt = null;
  const history = [];

  const check = (now) => {
    const elapsed = Math.max(0, now - started);
    const isLoaded = now >= readyAtMs || now >= timeoutAtMs;

    let next = 0;
    if (elapsed < minDurationMs) {
      next = Math.min(95, (elapsed / minDurationMs) * 95);
    } else if (isLoaded) {
      next = 100;
    } else {
      next = 95;
    }

    progress = next;
    history.push({ time: now, elapsed, progress, isLoaded });

    if (next >= 100 && !completed) {
      completed = true;
      completedAt = now;
    }
  };

  return {
    runTo: (now) => check(now),
    getProgress: () => progress,
    isCompleted: () => completed,
    getCompletedAt: () => completedAt,
    getHistory: () => history,
  };
}

test("fast load (ready at 1s): throttles progress for 5s and completes at 5s", () => {
  const sim = simulateArrival({ readyAtMs: 1000, minDurationMs: 5000 });

  // At 1 second, assets are loaded, but progress is throttled to 19%
  sim.runTo(1000);
  assert.equal(sim.getProgress(), 19);
  assert.equal(sim.isCompleted(), false, "Must not complete before 5 seconds");

  // At 2.5 seconds, progress is throttled to 47.5%
  sim.runTo(2500);
  assert.equal(sim.getProgress(), 47.5);
  assert.equal(sim.isCompleted(), false);

  // At 4 seconds, progress is throttled to 76%
  sim.runTo(4000);
  assert.equal(sim.getProgress(), 76);
  assert.equal(sim.isCompleted(), false);

  // At 4.9 seconds, progress is throttled to ~93.1%
  sim.runTo(4900);
  assert.equal(sim.getProgress(), 93.1);
  assert.equal(sim.isCompleted(), false);

  // At exactly 5 seconds, since it is loaded, it proceeds right to 100 and completes
  sim.runTo(5000);
  assert.equal(sim.getProgress(), 100);
  assert.equal(sim.isCompleted(), true);
  assert.equal(sim.getCompletedAt(), 5000);
});

test("slow load (ready at 7s): reaches 95% at 5s, holds until 7s, then proceeds right to 100", () => {
  const sim = simulateArrival({ readyAtMs: 7000, minDurationMs: 5000 });

  // At 2.5 seconds
  sim.runTo(2500);
  assert.equal(sim.getProgress(), 47.5);
  assert.equal(sim.isCompleted(), false);

  // At 5.0 seconds: reached minimum 5 seconds, but not loaded yet -> holds at 95%
  sim.runTo(5000);
  assert.equal(sim.getProgress(), 95);
  assert.equal(sim.isCompleted(), false, "Must not complete at 5s if not loaded yet");

  // At 6.0 seconds: still holds at 95%
  sim.runTo(6000);
  assert.equal(sim.getProgress(), 95);
  assert.equal(sim.isCompleted(), false);

  // At 7.0 seconds: assets load -> proceeds right to 100
  sim.runTo(7000);
  assert.equal(sim.getProgress(), 100);
  assert.equal(sim.isCompleted(), true);
  assert.equal(sim.getCompletedAt(), 7000);
});

test("stalled load (timeout at 12s): holds at 95% until 12s timeout, then proceeds to 100", () => {
  const sim = simulateArrival({ readyAtMs: Infinity, timeoutAtMs: 12000, minDurationMs: 5000 });

  sim.runTo(5000);
  assert.equal(sim.getProgress(), 95);
  assert.equal(sim.isCompleted(), false);

  sim.runTo(11990);
  assert.equal(sim.getProgress(), 95);
  assert.equal(sim.isCompleted(), false);

  sim.runTo(12000);
  assert.equal(sim.getProgress(), 100);
  assert.equal(sim.isCompleted(), true);
  assert.equal(sim.getCompletedAt(), 12000);
});
