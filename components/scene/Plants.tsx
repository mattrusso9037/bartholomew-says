"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Mesh, MeshStandardMaterial } from "three";

export function Plants({
  compact = false,
}: {
  reducedMotion?: boolean;
  compact?: boolean;
}) {
  const { scene } = useGLTF("/models/Meshy_AI_Ivy_Crowned_Gothic_St_0919174215_texture.glb");

  const shelf = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = (mesh.material as MeshStandardMaterial).clone();
          mat.roughness = 0.88;
          mat.metalness = 0.04;
          mesh.material = mat;
        }
      }
    });
    return copy;
  }, [scene]);

  const scale = compact ? 1.58 : 1.72;
  const posY = -0.35613 * scale;

  return (
    <group
      name="Ivy-crowned gothic stone shelf"
      position={[0, posY, -0.06]}
      scale={scale}
    >
      <primitive object={shelf} />
    </group>
  );
}

useGLTF.preload("/models/Meshy_AI_Ivy_Crowned_Gothic_St_0919174215_texture.glb");

