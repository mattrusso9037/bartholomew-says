import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
import { AnimationClip, AnimationMixer, Object3D, Quaternion, Vector3 } from 'three';

async function load(name) {
  const source = await readFile(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
    .replaceAll('"three"', JSON.stringify(import.meta.resolve('three')));
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const { HeadMotion } = await load('head-motion');
const { PoseBlend } = await load('pose-blend');

test('head changes are bounded even across a discontinuous clip pose', () => {
  const motion = new HeadMotion();
  motion.update(new Quaternion(), 0);
  const target = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 2);
  for (let i = 0; i < 180; i++) {
    const previous = motion.rotation.clone();
    motion.update(target, 1 / 60);
    assert.ok(previous.angleTo(motion.rotation) <= 1.8 / 60 + 1e-6);
  }
  assert.ok(motion.rotation.angleTo(target) < 0.001);
  motion.update(new Quaternion(), 0, true);
  assert.ok(motion.rotation.angleTo(new Quaternion()) < 1e-6);
});

test('head damping remains consistent at 30 and 60 FPS', () => {
  const target = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.1);
  const sample = fps => {
    const motion = new HeadMotion();
    motion.update(new Quaternion(), 0);
    for (let i = 0; i < fps; i++) motion.update(target, 1 / fps);
    return motion.rotation;
  };
  assert.ok(sample(30).angleTo(sample(60)) < 1e-6);
});

test('interrupted blends preserve normalized weights and retire old actions', () => {
  const mixer = new AnimationMixer(new Object3D());
  const actions = ['idle', 'drowsy', 'curl'].map(name => mixer.clipAction(new AnimationClip(name, 10, [])));
  actions[0].play();
  const blend = new PoseBlend();
  blend.start(actions[1], actions);
  actions[1].reset().play();
  for (let i = 0; i < 30; i++) { blend.update(1 / 60); mixer.update(1 / 60); }
  const before = actions.map(a => a.getEffectiveWeight() * Number(a.isScheduled()));
  blend.start(actions[2], actions);
  actions[2].reset().play();
  blend.update(0);
  assert.deepEqual(actions.map(a => a.getEffectiveWeight()), before);
  for (let i = 0; i < 100; i++) {
    blend.update(1 / 60); mixer.update(1 / 60);
    const sum = actions.reduce((n, a) => n + a.getEffectiveWeight() * Number(a.isScheduled()), 0);
    assert.ok(Math.abs(sum - 1) < 1e-6);
  }
  assert.equal(actions[0].isScheduled(), false);
  assert.equal(actions[1].isScheduled(), false);
  assert.equal(actions[2].getEffectiveWeight(), 1);
});
