import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Exercise the production director without adding a test-runner dependency.
const source = await readFile(new URL("../lib/character-motion.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { CharacterDirector } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const blanketSource = await readFile(new URL("../lib/blanket-motion.ts", import.meta.url), "utf8");
const blanketJs = ts.transpileModule(blanketSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { blanketEnvelope } = await import(`data:text/javascript;base64,${Buffer.from(blanketJs).toString("base64")}`);

function advance(director, seconds) {
  const transitions = [];
  for (let i = 0; i < Math.ceil(seconds * 60); i++) {
    const phase = director.update(1 / 60);
    if (phase) transitions.push(phase);
  }
  return transitions;
}

test("sleep completes before reversing, and settles back into the seated idle", () => {
  const director = new CharacterDirector(() => 0, 14, 30, 3);
  assert.deepEqual(advance(director, 71), ["curling", "sleeping", "waking", "seated"]);
});

test("attention wakes a sleeping character only after a calm minimum hold", () => {
  const director = new CharacterDirector(() => 0, 14, 30, 3);
  advance(director, 29);
  assert.equal(director.phase, "sleeping");
  director.requestAttention();
  assert.deepEqual(advance(director, 3), []);
  assert.deepEqual(advance(director, 2), ["waking"]);
});

test("an attention request during curling preserves the transition", () => {
  const director = new CharacterDirector(() => 0, 14, 30, 3);
  advance(director, 17);
  director.requestAttention();
  assert.deepEqual(advance(director, 10), []);
  assert.equal(director.phase, "curling");
  assert.deepEqual(advance(director, 8), ["sleeping", "waking"]);
});

test("visits do not repeat consecutively and a reverse stretch always settles forward", () => {
  const director = new CharacterDirector(() => 0.999, 14, 30, 3);
  const phases = advance(director, 600);
  const visits = phases.filter(p => ["curling", "drowsy", "stretching"].includes(p));
  assert.ok(visits.length >= 6);
  visits.forEach((phase, i) => { if (i) assert.notEqual(phase, visits[i - 1]); });
  phases.slice(0, -1).forEach((phase, i) => { if (phase === "stretching") assert.equal(phases[i + 1], "settling"); });
  if (director.phase === "stretching") assert.deepEqual(advance(director, 4), ["settling"]);
});

test("a hidden-tab gap cannot skip the animation or the resting interval", () => {
  const director = new CharacterDirector(() => 0, 14, 30, 3);
  director.update(1800);
  assert.equal(director.phase, "seated");
  assert.equal(director.elapsed, 0.05);
  director.update(0);
  assert.equal(director.elapsed, 0.05);
});

test("the shortened reverse clip has its own wake duration", () => {
  const director = new CharacterDirector(() => 0, 6.4, 30, 3, 4.7);
  advance(director, 21);
  assert.equal(director.phase, "sleeping");
  director.requestAttention();
  advance(director, 5);
  assert.equal(director.phase, "waking");
  assert.equal(director.duration, 4.7);
  advance(director, 5);
  assert.equal(director.phase, "seated");
});

test("the blanket arrives during descent and never appears on unrelated idles", () => {
  assert.equal(blanketEnvelope("curling", 0.2, Infinity).opacity, 0);
  assert.ok(blanketEnvelope("curling", 0.35, Infinity).opacity > 0);
  assert.equal(blanketEnvelope("curling", 0.6, Infinity).opacity, 1);
  for (const phase of ["seated", "drowsy", "stretching", "settling"]) {
    assert.equal(blanketEnvelope(phase, 0.5, Infinity).opacity, 0);
  }
});

test("the blanket settles during waking and only fades after he is seated", () => {
  assert.deepEqual(blanketEnvelope("sleeping", 0.9, Infinity), { opacity: 1, settle: 0 });
  assert.deepEqual(blanketEnvelope("waking", 0, Infinity), { opacity: 1, settle: 0 });
  assert.deepEqual(blanketEnvelope("waking", 1, Infinity), { opacity: 1, settle: 1 });
  assert.deepEqual(blanketEnvelope("seated", 0, 1.5), { opacity: 1, settle: 1 });
  assert.ok(blanketEnvelope("seated", 0, 2.5).opacity < 1);
  assert.equal(blanketEnvelope("seated", 0, 3.3).opacity, 0);
});

test("the consolidated asset contains every required clip on one shared skin", async () => {
  const bytes = await readFile(new URL("../public/models/bartholomew-animated.glb", import.meta.url));
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  assert.deepEqual(gltf.animations.map(a => a.name).sort(), ["CurlUp", "Drowsy", "Seated", "SitDown"]);
  assert.equal(gltf.skins.length, 1);
  assert.ok(bytes.length < 7 * 1024 * 1024);
  for (const animation of gltf.animations) {
    assert.ok(animation.channels.length > 0);
    for (const channel of animation.channels) assert.ok(gltf.nodes[channel.target.node]);
  }
});
