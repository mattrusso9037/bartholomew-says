"use client";

import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Color, type Mesh, type MeshStandardMaterial } from "three";

function Book({ mesh, position, rotation, scale, tint }: {
  mesh: Mesh; position: [number, number, number]; rotation: number; scale: [number, number, number]; tint: string;
}) {
  const material = useMemo(() => {
    const copy = (mesh.material as MeshStandardMaterial).clone();
    copy.color.multiply(new Color(tint));
    if (copy.map) copy.map.anisotropy = 8;
    if (copy.normalMap) copy.normalMap.anisotropy = 8;
    if (copy.roughnessMap) copy.roughnessMap.anisotropy = 8;
    return copy;
  }, [mesh.material, tint]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh geometry={mesh.geometry} material={material} position={position} rotation={[0, rotation, 0]} scale={scale} castShadow receiveShadow />;
}

export function Books() {
  const { nodes } = useGLTF("/models/leather-book.glb");
  const book = nodes["leather-book"] as Mesh;
  return (
    <group name="Leather-bound books">
      <Book mesh={book} position={[-0.07, 0.135, 0.03]} rotation={-0.08} scale={[0.96, 0.62, 0.82]} tint="#efc5b0" />
      <Book mesh={book} position={[0.025, 0.397, -0.04]} rotation={0.12} scale={[0.85, 0.58, 0.74]} tint="#9cad9c" />
      <Book mesh={book} position={[-0.025, 0.646, 0]} rotation={-0.065} scale={[0.79, 0.58, 0.70]} tint="#d4c3a7" />
    </group>
  );
}
