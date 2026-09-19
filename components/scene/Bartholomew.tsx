"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import {
  Group,
  LoopOnce,
  LoopRepeat,
  MathUtils,
  PlaneGeometry,
  Quaternion,
  Vector3,
  type MeshStandardMaterial,
  type SkinnedMesh,
} from "three";

interface BartholomewProps {
  reactionTrigger?: number;
  reducedMotion?: boolean;
  onInteract?: () => void;
}

/**
 * Cozy gothic velvet blanket draped over sleeping Bartholomew on top of the books,
 * sculpted so it covers his body, back, and wings, leaving only his head visible.
 */
function SleepingBlanket({
  visible,
  reducedMotion,
}: {
  visible: boolean;
  reducedMotion: boolean;
}) {
  const blanketRef = useRef<Group>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const trimMaterialRef = useRef<MeshStandardMaterial>(null);
  const opacityRef = useRef(0);
  const targetOpacity = visible ? 1 : 0;

  // Generate contoured draped blanket geometry with cloth ripples
  const blanketGeometry = useMemo(() => {
    const width = 0.88;
    const depth = 0.92;
    const segX = 36;
    const segZ = 36;
    const geom = new PlaneGeometry(width, depth, segX, segZ);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      const u = x / (width * 0.5);
      const v = z / (depth * 0.5);

      const falloffX = Math.cos(Math.min(Math.abs(u), 1) * Math.PI * 0.5);
      const falloffZ = Math.cos(Math.min(Math.abs(v), 1) * Math.PI * 0.5);
      const drape = Math.pow(Math.max(0, falloffX), 0.5) * Math.pow(Math.max(0, falloffZ), 0.5);

      // Curvature mound over sleeping back and folded wings
      const mound = 0.32 * Math.exp(-((u - 0.05) ** 2 * 1.5 + (v + 0.1) ** 2 * 1.6));
      // Organic cloth wave wrinkles
      const ripples = 0.016 * Math.sin(u * 8 + v * 7) + 0.012 * Math.cos(v * 11);

      const height = (mound + ripples) * drape;
      pos.setY(i, height);
    }

    geom.computeVertexNormals();
    return geom;
  }, []);

  useFrame((state, delta) => {
    if (!blanketRef.current) return;
    const clampedDelta = Math.min(delta, 0.05);

    // Smooth opacity fade in / out
    if (reducedMotion) {
      opacityRef.current = targetOpacity;
    } else {
      opacityRef.current = MathUtils.damp(
        opacityRef.current,
        targetOpacity,
        1.6,
        clampedDelta
      );
    }

    const currentOp = opacityRef.current;
    if (materialRef.current) {
      materialRef.current.opacity = currentOp;
      materialRef.current.transparent = currentOp < 0.99;
      materialRef.current.depthWrite = currentOp > 0.85;
    }
    if (trimMaterialRef.current) {
      trimMaterialRef.current.opacity = currentOp;
      trimMaterialRef.current.transparent = currentOp < 0.99;
      trimMaterialRef.current.depthWrite = currentOp > 0.85;
    }

    // Smooth vertical drape settling & breathing heave
    const breath = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * 1.4) * 0.014 * currentOp;
    const verticalSettle = (1 - currentOp) * 0.05;

    blanketRef.current.position.y = 0.82 - verticalSettle + breath;
    blanketRef.current.scale.y = 1 + breath * 0.8;
    blanketRef.current.visible = currentOp > 0.01;
  });

  return (
    <group ref={blanketRef} position={[-0.05, 0.82, -0.04]} rotation={[0, -0.22, 0]}>
      {/* Deep gothic velvet quilt covering body, wings, and tail */}
      <mesh geometry={blanketGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          ref={materialRef}
          color="#22111b"
          roughness={0.92}
          metalness={0.04}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Decorative antique gold embroidered collar where head emerges */}
      <mesh position={[-0.02, 0.18, 0.36]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.62, 20]} />
        <meshStandardMaterial
          ref={trimMaterialRef}
          color="#c49d58"
          roughness={0.42}
          metalness={0.65}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

// Deterministic hash to distribute mode randomly across quotes without violating React 19 purity
function getModeFromTrigger(trigger: number): "sitting" | "sleeping" {
  const hash = ((trigger * 2654435761) >>> 0) % 100;
  return hash < 50 ? "sleeping" : "sitting";
}

export function Bartholomew({
  reactionTrigger = 0,
  reducedMotion = false,
}: BartholomewProps) {
  const mode = getModeFromTrigger(reactionTrigger);

  // Load models:
  // 1. Sitting: Step_to_Sit transition + Chair_Sit_Idle
  const sitGltf = useGLTF(
    "/models/Meshy_AI_Grumblethorn_Step_to_Sit_Transitio.glb"
  );
  const idleGltf = useGLTF(
    "/models/Meshy_AI_Grumblethorn_Chair_Sit_Idle_M.glb"
  );

  // 2. Sleeping: Meshy_AI_Grumblethorn_01a0ba80_86b6_76e9_9d-sleep.glb
  const sleepGltf = useGLTF(
    "/models/Meshy_AI_Grumblethorn_01a0ba80_86b6_76e9_9d-sleep.glb"
  );

  // Align Chair_Sit_Idle root motion to continue smoothly from Step_to_Sit
  const sittingClips = useMemo(() => {
    const sitClip = sitGltf.animations[0];
    const rawIdleClip = idleGltf.animations[0];
    const idleClip = rawIdleClip.clone();

    const q1 = new Quaternion(-0.05165, 0.69134, 0.04873, 0.71903);
    const q2 = new Quaternion(-0.12927, 0.01185, 0.03038, 0.99107);
    const qDelta = q1.clone().multiply(q2.clone().invert());
    const p1 = new Vector3(-0.2547, 0.3918, 0.7663);
    const p2 = new Vector3(0.1945, 0.3767, -0.2949);

    idleClip.tracks.forEach((track) => {
      if (track.name.includes("Hips.position")) {
        const v = track.values;
        for (let i = 0; i < v.length; i += 3) {
          const p = new Vector3(v[i], v[i + 1], v[i + 2]);
          const pNew = p1.clone().add(p.sub(p2).applyQuaternion(qDelta));
          v[i] = pNew.x;
          v[i + 1] = pNew.y;
          v[i + 2] = pNew.z;
        }
      } else if (track.name.includes("Hips.quaternion")) {
        const v = track.values;
        for (let i = 0; i < v.length; i += 4) {
          const q = new Quaternion(v[i], v[i + 1], v[i + 2], v[i + 3]);
          const qNew = qDelta.clone().multiply(q);
          v[i] = qNew.x;
          v[i + 1] = qNew.y;
          v[i + 2] = qNew.z;
          v[i + 3] = qNew.w;
        }
      }
    });

    return [sitClip, idleClip];
  }, [sitGltf.animations, idleGltf.animations]);

  const { actions: sitActions, mixer: sitMixer } = useAnimations(
    sittingClips,
    sitGltf.scene
  );
  const { actions: sleepActions } = useAnimations(
    sleepGltf.animations,
    sleepGltf.scene
  );

  // Setup stone materials and shadow casting/receiving on both models
  useEffect(() => {
    [sitGltf.scene, sleepGltf.scene].forEach((sc) => {
      sc.traverse((child) => {
        if ((child as SkinnedMesh).isSkinnedMesh || (child as SkinnedMesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.name === "output_unwrapped") {
            const mat = (child as SkinnedMesh).material as MeshStandardMaterial;
            if (mat) {
              mat.roughness = 0.78;
              mat.metalness = 0.12;
              mat.envMapIntensity = 0.85;
              if (mat.normalScale) {
                mat.normalScale.set(1.2, 1.2);
              }
            }
          }
        }
      });
    });
  }, [sitGltf.scene, sleepGltf.scene]);

  // Handle Sitting Animation Playback
  useEffect(() => {
    if (mode !== "sitting") return;

    const sitAction = sitActions["Step_to_Sit_Transition"] || sitActions[sittingClips[0].name];
    const idleAction = sitActions["Chair_Sit_Idle_M"] || sitActions[sittingClips[1].name];
    if (!sitAction || !idleAction) return;

    idleAction.setLoop(LoopRepeat, Infinity);

    if (reducedMotion) {
      idleAction.reset().play();
      return;
    }

    sitAction.reset();
    sitAction.setLoop(LoopOnce, 1);
    Object.assign(sitAction, { clampWhenFinished: true });
    sitAction.fadeIn(0.2).play();

    const onFinished = (e: { action: unknown }) => {
      if (e.action === sitAction) {
        idleAction.reset();
        idleAction.crossFadeFrom(sitAction, 0.5, true).play();
      }
    };

    sitMixer.addEventListener("finished", onFinished);

    return () => {
      sitMixer.removeEventListener("finished", onFinished);
      sitAction.fadeOut(0.3);
      idleAction.fadeOut(0.3);
    };
  }, [mode, sitActions, sitMixer, sittingClips, reducedMotion]);

  // Handle Sleeping Animation Playback
  useEffect(() => {
    if (mode !== "sleeping") return;

    const sleepAction =
      sleepActions["01a0ba80-86b6-76e9-9d67-8c5fc8356091"] ||
      Object.values(sleepActions)[0];

    if (!sleepAction) return;

    sleepAction.setLoop(LoopRepeat, Infinity);
    sleepAction.reset().fadeIn(0.4).play();

    return () => {
      sleepAction?.fadeOut(0.4);
    };
  }, [mode, sleepActions]);

  return (
    <group name="BartholomewCharacter">
      {/* 1. Sitting Mode: Bartholomew stepping and sitting on top of books */}
      <group
        name="SittingBartholomew"
        visible={mode === "sitting"}
        position={[0.549, 0.815, 0.419]}
        rotation={[0, -1.88, 0]}
      >
        <primitive object={sitGltf.scene} scale={0.88} />
      </group>

      {/* 2. Sleeping Mode: Bartholomew curled asleep on top of books with draped blanket */}
      <group
        name="SleepingBartholomew"
        visible={mode === "sleeping"}
      >
        <group
          position={[-0.06, 0.84, -0.06]}
          rotation={[0, 1.80, 0]}
        >
          <primitive object={sleepGltf.scene} scale={0.85} />
        </group>

        {/* Velvet Blanket smoothly draping over his body, leaving only his head visible */}
        <SleepingBlanket
          visible={mode === "sleeping"}
          reducedMotion={reducedMotion}
        />
      </group>
    </group>
  );
}
