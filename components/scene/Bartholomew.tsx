"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { AnimationMixer, AnimationUtils, Euler, LoopOnce, LoopPingPong, MathUtils, Quaternion, Vector2, type AnimationAction, type Bone, type MeshStandardMaterial, type SkinnedMesh } from "three";
import { CharacterDirector, type CharacterPhase } from "@/lib/character-motion";
import { SleepingBlanket } from "./SleepingBlanket";

export interface BartholomewProps {
  reactionTrigger?: number;
  reducedMotion?: boolean;
  compact?: boolean;
  onInteract?: () => void;
  onPhaseChange?: (phase: CharacterPhase) => void;
}

export function Bartholomew({ reactionTrigger = 0, reducedMotion = false, compact = false, onInteract, onPhaseChange }: BartholomewProps) {
  const gltf = useGLTF("/models/bartholomew-animated.glb");
  const pointer = useRef(new Vector2());
  const gaze = useRef(new Vector2());
  const blanketAmount = useRef(0);
  const phase = useRef<CharacterPhase>("seated");
  const trigger = useRef(reactionTrigger);
  const reaction = useRef(5);
  const actions = useRef<Record<string, AnimationAction>>({});
  const rig = useMemo(() => {
    const scene = clone(gltf.scene);
    const eyeGaze = { value: new Vector2() };
    let mesh: SkinnedMesh | undefined;
    scene.traverse((child) => {
      if ((child as SkinnedMesh).isSkinnedMesh) {
        mesh = child as SkinnedMesh;
        mesh.material = (mesh.material as MeshStandardMaterial).clone();
        const material = mesh.material as MeshStandardMaterial;
        material.roughness = 0.9;
        material.metalness = 0.04;
        // The supplied rig has no eye bones. Move the original painted pupils
        // inside their sockets, using the mesh's bind coordinates as a mask.
        material.onBeforeCompile = shader => {
          shader.uniforms.uEyeGaze = eyeGaze;
          shader.vertexShader = `varying vec3 vEyeBindPosition;\n${shader.vertexShader}`
            .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEyeBindPosition = position;");
          shader.fragmentShader = `uniform vec2 uEyeGaze;\nvarying vec3 vEyeBindPosition;\n${shader.fragmentShader}`
            .replace("#include <map_fragment>", `
              #ifdef USE_MAP
                vec2 eyeLocal = vec2(abs(vEyeBindPosition.x) - 0.125, vEyeBindPosition.y - 1.073);
                float eyeMask = (1.0 - smoothstep(0.45, 1.0, length(eyeLocal / vec2(0.063, 0.036))))
                  * smoothstep(0.26, 0.29, vEyeBindPosition.z);
                vec2 px = dFdx(vEyeBindPosition.xy), py = dFdy(vEyeBindPosition.xy);
                float determinant = px.x * py.y - px.y * py.x;
                vec2 offset = uEyeGaze * vec2(0.012, 0.007) * eyeMask;
                vec2 screenShift = abs(determinant) > 0.00000001
                  ? vec2(py.y * offset.x - py.x * offset.y, px.x * offset.y - px.y * offset.x) / determinant
                  : vec2(0.0);
                vec2 eyeUv = vMapUv - dFdx(vMapUv) * screenShift.x - dFdy(vMapUv) * screenShift.y;
                diffuseColor *= texture2D(map, eyeUv);
              #endif
            `);
        };
        material.customProgramCacheKey = () => "bartholomew-eye-gaze-v1";
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });
    if (!mesh) throw new Error("The character asset must contain a skinned mesh.");
    const clips = gltf.animations.map(source => {
      const clip = source.clone();
      for (const track of clip.tracks) {
        if (track.name.endsWith("Hips.position")) {
          for (let i = 0; i < track.values.length; i += 3) {
            track.values[i] = 0;
            track.values[i + 2] = -0.055;
          }
        }
        if (track.name.endsWith("Hips.quaternion") && clip.name === "SitDown") {
          // Keep the seated transition in place and facing the reader.
          const q = new Quaternion(), e = new Euler(0, 0, 0, "YXZ");
          for (let i = 0; i < track.values.length; i += 4) {
            q.fromArray(track.values, i); e.setFromQuaternion(q, "YXZ"); e.y = 0;
            q.setFromEuler(e).toArray(track.values, i);
          }
        }
      }
      return clip;
    });
    const sit = clips.find(clip => clip.name === "SitDown")!;
    clips.push(AnimationUtils.subclip(sit, "Settle", (sit.duration - 1.65) * 24, sit.duration * 24, 24));
    const mixer = new AnimationMixer(scene);
    const head = mesh.skeleton.bones.find(bone => bone.name.endsWith("Head")) as Bone;
    return { scene, mesh, mixer, clips, head, eyeGaze, parentWorld: new Quaternion(), target: new Quaternion(), angles: new Euler() };
  }, [gltf]);
  const director = useRef<CharacterDirector | null>(null);
  const currentAction = useRef<AnimationAction | null>(null);

  useEffect(() => {
    // Rebind after cleanup, including React Strict Mode's setup/cleanup replay.
    actions.current = Object.fromEntries(rig.clips.map(clip => [clip.name, rig.mixer.clipAction(clip)]));
    director.current = new CharacterDirector(Math.random, actions.current.CurlUp.getClip().duration / 0.72, actions.current.Drowsy.getClip().duration / 0.8, actions.current.Settle.getClip().duration / 0.6);
    const idle = actions.current.Seated;
    idle.reset().setLoop(LoopPingPong, Infinity).setEffectiveTimeScale(0.65).play();
    currentAction.current = idle;
    rig.mixer.update(0);
    return () => {
      rig.mixer.stopAllAction();
      rig.mixer.uncacheRoot(rig.scene);
      (rig.mesh.material as MeshStandardMaterial).dispose();
      rig.mesh.skeleton.dispose();
    };
  }, [rig]);

  useEffect(() => {
    if (compact || reducedMotion) return;
    const move = (event: PointerEvent) => pointer.current.set(MathUtils.clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1), MathUtils.clamp(1 - event.clientY / window.innerHeight * 2, -1, 1));
    const leave = () => pointer.current.set(0, 0);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); };
  }, [compact, reducedMotion]);

  useFrame((_, rawDelta) => {
    if (reducedMotion) return;
    const delta = Math.min(rawDelta, 0.05);
    if (reactionTrigger !== trigger.current) {
      trigger.current = reactionTrigger;
      director.current?.requestAttention();
      reaction.current = 0;
    }
    reaction.current = Math.min(5, reaction.current + delta);
    const next = director.current?.update(delta);
    if (next) {
      phase.current = next;
      const previous = currentAction.current;
      const name = next === "seated" ? "Seated" : next === "drowsy" ? "Drowsy" : next === "stretching" || next === "settling" ? "Settle" : "CurlUp";
      const action = actions.current[name];
      if (next === "sleeping") {
        action.time = action.getClip().duration;
        action.paused = true;
      } else {
        action.reset().setEffectiveWeight(1);
        const reverse = next === "waking" || next === "stretching";
        const speed = name === "Seated" ? 0.65 : name === "Drowsy" ? 0.8 : name === "Settle" ? 0.6 : 0.72;
        action.setLoop(next === "seated" ? LoopPingPong : LoopOnce, next === "seated" ? Infinity : 1);
        action.clampWhenFinished = true;
        action.time = reverse ? action.getClip().duration : 0;
        action.setEffectiveTimeScale(reverse ? -speed : speed).play();
        if (previous && previous !== action) action.crossFadeFrom(previous, 1.6, false);
      }
      currentAction.current = action;
      onPhaseChange?.(next);
    }
    rig.mixer.update(delta);
    const curled = phase.current === "sleeping" ? 1 : phase.current === "curling" || phase.current === "waking"
      ? MathUtils.smoothstep(actions.current.CurlUp.time / actions.current.CurlUp.getClip().duration, 0.15, 0.75) : 0;
    blanketAmount.current = MathUtils.damp(blanketAmount.current, curled, 1.5, delta);
    gaze.current.x = MathUtils.damp(gaze.current.x, compact ? 0 : pointer.current.x, 2.4, delta);
    gaze.current.y = MathUtils.damp(gaze.current.y, compact ? 0 : pointer.current.y, 2.4, delta);
    rig.eyeGaze.value.copy(gaze.current).multiplyScalar(1 - curled);
    // Generated curl motion rolls the head upside down. Stabilize it after the
    // mixer, keeping the face visible and adding a restrained cursor response.
    rig.scene.updateMatrixWorld(true);
    rig.head.parent!.getWorldQuaternion(rig.parentWorld);
    const nod = Math.sin(reaction.current * 3) * Math.exp(-reaction.current * 1.8) * 0.045;
    rig.angles.set(-0.06 - gaze.current.y * 0.055 + nod, gaze.current.x * 0.12 + 0.10, -curled * 0.30);
    rig.target.setFromEuler(rig.angles).premultiply(rig.parentWorld.invert());
    rig.head.quaternion.slerp(rig.target, 0.55 + curled * 0.42);
    rig.scene.updateMatrixWorld(true);
    rig.mesh.skeleton.update();
  }, -2);

  return (
    <group name="BartholomewCharacter" onClick={onInteract}>
      <group position={[0, 0.91, -0.02]} rotation={[0, 0.13, 0]} scale={0.85}>
        <primitive object={rig.scene} />
      </group>
      <SleepingBlanket model={rig.mesh} amount={blanketAmount} reducedMotion={reducedMotion} compact={compact} />
    </group>
  );
}
