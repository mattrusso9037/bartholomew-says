"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { AnimationMixer, AnimationUtils, Euler, LoopOnce, LoopPingPong, MathUtils, Quaternion, Vector2, type AnimationAction, type Bone, type Group, type MeshStandardMaterial, type SkinnedMesh } from "three";
import { CharacterDirector, type CharacterPhase } from "@/lib/character-motion";
import { blanketEnvelope } from "@/lib/blanket-motion";
import { SleepingBlanket } from "./SleepingBlanket";

export interface BartholomewProps {
  reactionTrigger?: number;
  sleepTrigger?: number;
  reducedMotion?: boolean;
  compact?: boolean;
  onInteract?: () => void;
  onPhaseChange?: (phase: CharacterPhase) => void;
}

export function Bartholomew({ reactionTrigger = 0, sleepTrigger = 0, reducedMotion = false, compact = false, onInteract, onPhaseChange }: BartholomewProps) {
  const gltf = useGLTF("/models/bartholomew-animated.glb");
  const body = useRef<Group>(null);
  const pointer = useRef(new Vector2());
  const gaze = useRef(new Vector2());
  const blanketAmount = useRef(0);
  const blanketSettle = useRef(1);
  const secondsAfterWake = useRef(Infinity);
  const wakeBlending = useRef(false);
  const phase = useRef<CharacterPhase>("seated");
  const trigger = useRef(reactionTrigger);
  const sleepRequest = useRef(sleepTrigger);
  const reaction = useRef(5);
  const actions = useRef<Record<string, AnimationAction>>({});
  const rig = useMemo(() => {
    const scene = clone(gltf.scene);
    const eyeGaze = { value: new Vector2() };
    const eyeClose = { value: 0 };
    let mesh: SkinnedMesh | undefined;
    scene.traverse((child) => {
      if ((child as SkinnedMesh).isSkinnedMesh) {
        mesh = child as SkinnedMesh;
        mesh.material = (mesh.material as MeshStandardMaterial).clone();
        const material = mesh.material as MeshStandardMaterial;
        material.roughness = 0.9;
        material.metalness = 0.04;
        if (material.map) material.map.anisotropy = 8;
        if (material.normalMap) material.normalMap.anisotropy = 8;
        // The supplied rig has no eye bones. Move the original painted pupils
        // inside their sockets, using the mesh's bind coordinates as a mask.
        // When curled or sleeping, close the eyelids with a natural crease.
        material.onBeforeCompile = shader => {
          shader.uniforms.uEyeGaze = eyeGaze;
          shader.uniforms.uEyeClose = eyeClose;
          shader.vertexShader = `varying vec3 vEyeBindPosition;\n${shader.vertexShader}`
            .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEyeBindPosition = position;");
          shader.fragmentShader = `uniform vec2 uEyeGaze;\nuniform float uEyeClose;\nvarying vec3 vEyeBindPosition;\n${shader.fragmentShader}`
            .replace("#include <map_fragment>", compact ? `
              #ifdef USE_MAP
                vec2 eyeLocal = vec2(abs(vEyeBindPosition.x) - 0.125, vEyeBindPosition.y - 1.073);
                float eyeRadius = length(eyeLocal / vec2(0.063, 0.036));
                float eyeMask = (1.0 - smoothstep(0.45, 1.0, eyeRadius))
                  * smoothstep(0.26, 0.29, vEyeBindPosition.z);
                vec2 offset = uEyeGaze * vec2(0.012, 0.007) * (1.0 - uEyeClose) * eyeMask;
                vec2 eyeUv = vMapUv - offset;
                vec4 sampledTex = texture2D(map, eyeUv);
                float slitY = -0.004 - (eyeLocal.x * eyeLocal.x) * 1.5;
                float lidDist = eyeLocal.y - slitY;
                float crease = (1.0 - smoothstep(0.0008, 0.0035, abs(lidDist))) * eyeMask * uEyeClose;
                float lidShadow = smoothstep(0.0, 0.012, lidDist) * (1.0 - smoothstep(0.012, 0.028, lidDist)) * eyeMask * uEyeClose;
                vec3 stoneEyelid = mix(sampledTex.rgb, vec3(0.55, 0.52, 0.48), 0.78);
                vec3 finalColor = mix(sampledTex.rgb, stoneEyelid, uEyeClose * eyeMask);
                finalColor *= (1.0 - crease * 0.7 - lidShadow * 0.2);
                diffuseColor.rgb *= finalColor;
                diffuseColor.a *= sampledTex.a;
              #endif
            ` : `
              #ifdef USE_MAP
                vec2 eyeLocal = vec2(abs(vEyeBindPosition.x) - 0.125, vEyeBindPosition.y - 1.073);
                float eyeRadius = length(eyeLocal / vec2(0.063, 0.036));
                float eyeMask = (1.0 - smoothstep(0.45, 1.0, eyeRadius))
                  * smoothstep(0.26, 0.29, vEyeBindPosition.z);
                vec2 px = dFdx(vEyeBindPosition.xy), py = dFdy(vEyeBindPosition.xy);
                float determinant = px.x * py.y - px.y * py.x;
                vec2 gazeOffset = uEyeGaze * vec2(0.012, 0.007) * (1.0 - uEyeClose) * eyeMask;
                float slitY = -0.004 - (eyeLocal.x * eyeLocal.x) * 1.5;
                float lidDist = eyeLocal.y - slitY;
                float lidShiftY = (lidDist > 0.0 ? 0.038 : -0.026) * uEyeClose * eyeMask;
                vec2 totalOffset = gazeOffset + vec2(0.0, lidShiftY);
                vec2 screenShift = abs(determinant) > 0.00000001
                  ? vec2(py.y * totalOffset.x - py.x * totalOffset.y, px.x * totalOffset.y - px.y * totalOffset.x) / determinant
                  : vec2(0.0);
                vec2 eyeUv = vMapUv - dFdx(vMapUv) * screenShift.x - dFdy(vMapUv) * screenShift.y;
                vec4 sampledTex = texture2D(map, eyeUv);
                float crease = (1.0 - smoothstep(0.0008, 0.0035, abs(lidDist))) * eyeMask * uEyeClose;
                float lidShadow = smoothstep(0.0, 0.012, lidDist) * (1.0 - smoothstep(0.012, 0.028, lidDist)) * eyeMask * uEyeClose;
                diffuseColor *= sampledTex;
                diffuseColor.rgb *= (1.0 - crease * 0.7 - lidShadow * 0.2);
              #endif
            `);
        };
        material.customProgramCacheKey = () => compact ? "bartholomew-eye-close-compact-v2" : "bartholomew-eye-close-v2";
        mesh.castShadow = mesh.receiveShadow = true;
        mesh.frustumCulled = false;
      }
    });
    if (!mesh) throw new Error("The character asset must contain a skinned mesh.");
    const clips = gltf.animations.map(source => {
      // Only the opening four seconds contain the descent. The remaining six
      // seconds are a resting hold, which should not delay reverse playback.
      const clip = source.name === "CurlUp"
        ? AnimationUtils.subclip(source, source.name, 0, 96, 24)
        : source.clone();
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
    return { scene, mesh, mixer, clips, head, eyeGaze, eyeClose, parentWorld: new Quaternion(), target: new Quaternion(), angles: new Euler() };
  }, [gltf, compact]);
  const director = useRef<CharacterDirector | null>(null);
  const currentAction = useRef<AnimationAction | null>(null);

  useEffect(() => {
    // Rebind after cleanup, including React Strict Mode's setup/cleanup replay.
    actions.current = Object.fromEntries(rig.clips.map(clip => [clip.name, rig.mixer.clipAction(clip)]));
    director.current = new CharacterDirector(Math.random, actions.current.CurlUp.getClip().duration / 0.62, actions.current.Drowsy.getClip().duration / 0.8, actions.current.Settle.getClip().duration / 0.6, actions.current.CurlUp.getClip().duration / 0.85);
    phase.current = "seated";
    blanketAmount.current = 0;
    blanketSettle.current = 1;
    secondsAfterWake.current = Infinity;
    wakeBlending.current = false;
    onPhaseChange?.("seated");
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
  }, [rig, onPhaseChange]);

  useEffect(() => {
    if (compact || reducedMotion) return;
    const move = (event: PointerEvent) => pointer.current.set(MathUtils.clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1), MathUtils.clamp(1 - event.clientY / window.innerHeight * 2, -1, 1));
    const leave = () => pointer.current.set(0, 0);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => { window.removeEventListener("pointermove", move); document.documentElement.removeEventListener("pointerleave", leave); };
  }, [compact, reducedMotion]);

  useFrame((_, rawDelta) => {
    const requestedSleep = sleepTrigger !== sleepRequest.current;
    if (reducedMotion && !requestedSleep) return;
    const delta = reducedMotion ? 0 : Math.min(rawDelta, 0.05);
    if (reactionTrigger !== trigger.current) {
      trigger.current = reactionTrigger;
      director.current?.requestAttention();
      reaction.current = 0;
    }
    reaction.current = Math.min(5, reaction.current + delta);
    if (requestedSleep) {
      sleepRequest.current = sleepTrigger;
      director.current?.requestSleep();
    }
    const next = director.current?.update(delta, reducedMotion);
    if (next) {
      const previousPhase = phase.current;
      phase.current = next;
      const previous = currentAction.current;
      const name = next === "seated" ? "Seated" : next === "drowsy" ? "Drowsy" : next === "stretching" || next === "settling" ? "Settle" : "CurlUp";
      const action = actions.current[name];
      if (next === "sleeping") {
        if (reducedMotion) {
          rig.mixer.stopAllAction();
          action.reset().setEffectiveWeight(1).play();
        }
        action.time = action.getClip().duration;
        action.paused = true;
      } else if (next === "seated" && previousPhase === "waking" && wakeBlending.current) {
        // The idle has already blended in during the last part of the rise.
        secondsAfterWake.current = 0;
        wakeBlending.current = false;
      } else {
        action.reset().setEffectiveWeight(1);
        const reverse = next === "waking" || next === "stretching";
        const speed = name === "Seated" ? 0.65 : name === "Drowsy" ? 0.8 : name === "Settle" ? 0.6 : reverse ? 0.85 : 0.62;
        action.setLoop(next === "seated" ? LoopPingPong : LoopOnce, next === "seated" ? Infinity : 1);
        action.clampWhenFinished = true;
        action.time = reverse ? action.getClip().duration : 0;
        action.setEffectiveTimeScale(reverse ? -speed : speed).play();
        if (previous && previous !== action) action.crossFadeFrom(previous, 1.6, false);
      }
      currentAction.current = action;
      onPhaseChange?.(next);
    }
    if (phase.current === "waking" && !wakeBlending.current && actions.current.CurlUp.time < 1.36) {
      wakeBlending.current = true;
      const idle = actions.current.Seated;
      idle.reset().setEffectiveWeight(1).setLoop(LoopPingPong, Infinity).setEffectiveTimeScale(0.65).play();
      idle.crossFadeFrom(actions.current.CurlUp, 1.6, false);
    }
    rig.mixer.update(delta);
    const curled = phase.current === "sleeping" ? 1 : phase.current === "curling" || phase.current === "waking"
      ? MathUtils.smoothstep(actions.current.CurlUp.time / actions.current.CurlUp.getClip().duration, 0.15, 0.75) : 0;
    // Sink into the book as he curls up; the cloth samples this adjusted pose.
    if (body.current) {
      body.current.position.y = 0.91 - curled * 0.10;
      body.current.updateMatrixWorld(true);
    }
    secondsAfterWake.current += delta;
    const progress = director.current ? director.current.elapsed / director.current.duration : 0;
    const blanket = blanketEnvelope(phase.current, progress, secondsAfterWake.current);
    blanketAmount.current = blanket.opacity;
    blanketSettle.current = blanket.settle;
    gaze.current.x = MathUtils.damp(gaze.current.x, compact ? 0 : pointer.current.x, 2.4, delta);
    gaze.current.y = MathUtils.damp(gaze.current.y, compact ? 0 : pointer.current.y, 2.4, delta);
    rig.eyeGaze.value.copy(gaze.current).multiplyScalar(1 - curled);
    const isSleeping = phase.current === "sleeping" || phase.current === "curling";
    const targetEyeClose = isSleeping ? Math.max(curled, phase.current === "sleeping" ? 1 : 0) : phase.current === "drowsy" ? 0.45 : 0;
    rig.eyeClose.value = MathUtils.damp(rig.eyeClose.value, targetEyeClose, 5.0, delta);
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
      <group ref={body} position={[0, 0.91, -0.02]} rotation={[0, 0.13, 0]} scale={0.85}>
        <primitive object={rig.scene} />
      </group>
      <SleepingBlanket model={rig.mesh} head={rig.head} phase={phase} amount={blanketAmount} settle={blanketSettle} reducedMotion={reducedMotion} compact={compact} />
    </group>
  );
}
