"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Group } from "three";
import type { Mesh } from "three";

export function Bartholomew({ reactionTrigger, reducedMotion = false }: { reactionTrigger: number; reducedMotion?: boolean }) {
  const { nodes } = useGLTF("/models/bartholomew.glb");
  const model = nodes.bartholomew as Mesh;
  const root = useRef<Group>(null);
  const lastTrigger = useRef(reactionTrigger);
  const progress = useRef(4);

  useFrame(({ clock }, delta) => {
    if (!root.current) return;
    if (lastTrigger.current !== reactionTrigger) { lastTrigger.current = reactionTrigger; progress.current = 0; }
    progress.current = Math.min(4, progress.current + Math.min(delta, 0.05));
    const reaction = reducedMotion ? 0 : Math.sin(progress.current * 3.3) * Math.exp(-progress.current * 1.65);
    const idle = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.65);
    root.current.rotation.set(reaction * -0.024, -0.08 + reaction * 0.075, idle * 0.002);
    root.current.scale.y = 1 + idle * 0.0015;
  });

  return (
    <group ref={root} position={[0, 0.785, -0.035]} rotation={[0, -0.08, 0]} name="Bartholomew">
      <mesh geometry={model.geometry} material={model.material} position={[0, 0.8479, 0]} scale={0.89} castShadow receiveShadow />
    </group>
  );
}
