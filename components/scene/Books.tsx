"use client";

import { useEffect, useMemo } from "react";
import { RoundedBox, useGLTF } from "@react-three/drei";
import { Color, type Mesh, type MeshStandardMaterial } from "three";
import { useSurface } from "./materials";

function Book({ mesh, position, rotation, scale, tint }: {
  mesh: Mesh; position: [number, number, number]; rotation: number; scale: [number, number, number]; tint: string;
}) {
  const material = useMemo(() => {
    const copy = (mesh.material as MeshStandardMaterial).clone();
    copy.color.multiply(new Color(tint));
    return copy;
  }, [mesh.material, tint]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={mesh.geometry} material={material} position={position} rotation={[0, rotation, 0]} scale={scale} castShadow receiveShadow />;
}

export function Books() {
  const stone = useSurface("stone", "#57594c");
  const { nodes } = useGLTF("/models/leather-book.glb");
  const book = nodes["leather-book"] as Mesh;
  return (
    <group name="Leather-bound books">
      <RoundedBox args={[3.3, 0.19, 1.83]} radius={0.055} smoothness={3} position={[0, -0.13, -0.1]} material={stone} receiveShadow castShadow />
      <RoundedBox args={[3.2, 0.045, 1.75]} radius={0.02} smoothness={2} position={[0, -0.025, -0.1]} material={stone} receiveShadow />
      {/* Carved supports ground the ledge in the foreground shadows. */}
      {[-1.04, 1.04].map((x) => (
        <group key={x} position={[x, -0.22, -0.2]}>
          <RoundedBox args={[0.4, 0.13, 0.75]} radius={0.025} smoothness={2} position={[0, -0.04, 0]} material={stone} receiveShadow />
          <mesh position={[0, -0.49, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.16, 0.12, 0.82, 8]} />
            <primitive object={stone} attach="material" />
          </mesh>
        </group>
      ))}
      <Book mesh={book} position={[-0.07, 0.135, 0.03]} rotation={-0.08} scale={[0.96, 0.62, 0.82]} tint="#efc5b0" />
      <Book mesh={book} position={[0.025, 0.397, -0.04]} rotation={0.12} scale={[0.85, 0.58, 0.74]} tint="#9cad9c" />
      <Book mesh={book} position={[-0.025, 0.646, 0]} rotation={-0.065} scale={[0.79, 0.58, 0.70]} tint="#d4c3a7" />
    </group>
  );
}
