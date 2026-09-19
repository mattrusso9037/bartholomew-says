"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import {
  Group,
  LoopOnce,
  LoopRepeat,
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

export function Bartholomew({
  reducedMotion = false,
}: BartholomewProps) {
  // Load the Step_to_Sit transition model and the Chair_Sit_Idle model
  const sitGltf = useGLTF(
    "/models/Meshy_AI_Grumblethorn_Step_to_Sit_Transitio.glb"
  );
  const idleGltf = useGLTF(
    "/models/Meshy_AI_Grumblethorn_Chair_Sit_Idle_M.glb"
  );

  // Align Chair_Sit_Idle root motion so it continues seamlessly from Step_to_Sit end pose
  const clips = useMemo(() => {
    const sitClip = sitGltf.animations[0];
    const rawIdleClip = idleGltf.animations[0];

    // Clone idle clip to safely transform its tracks without mutating cached assets
    const idleClip = rawIdleClip.clone();

    // Step_to_Sit end transform vs Chair_Sit_Idle start transform on Hips
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

  const { actions, mixer } = useAnimations(clips, sitGltf.scene);
  const root = useRef<Group>(null);

  // Setup shadow casting/receiving and stone material aesthetics
  useEffect(() => {
    sitGltf.scene.traverse((child) => {
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
  }, [sitGltf.scene]);

  // Sequence: Play sitting transition once, then seamlessly loop idle animation
  useEffect(() => {
    const sitAction = actions["Step_to_Sit_Transition"] || actions[clips[0].name];
    const idleAction = actions["Chair_Sit_Idle_M"] || actions[clips[1].name];
    if (!sitAction || !idleAction) return;

    idleAction.setLoop(LoopRepeat, Infinity);

    if (reducedMotion) {
      idleAction.reset().play();
      return;
    }

    // Play sit transition once, clamping on the final frame
    sitAction.reset();
    sitAction.setLoop(LoopOnce, 1);
    Object.assign(sitAction, { clampWhenFinished: true });
    sitAction.fadeIn(0.2).play();

    // Crossfade seamlessly into idle animation as sit completes
    const onFinished = (e: { action: unknown }) => {
      if (e.action === sitAction) {
        idleAction.reset();
        idleAction.crossFadeFrom(sitAction, 0.5, true).play();
      }
    };

    mixer.addEventListener("finished", onFinished);

    return () => {
      mixer.removeEventListener("finished", onFinished);
      sitAction.fadeOut(0.3);
      idleAction.fadeOut(0.3);
    };
  }, [actions, mixer, clips, reducedMotion]);

  return (
    <group
      ref={root}
      position={[0.549, 0.815, 0.419]}
      rotation={[0, -1.88, 0]}
      name="Bartholomew"
    >
      <primitive object={sitGltf.scene} scale={0.88} />
    </group>
  );
}
