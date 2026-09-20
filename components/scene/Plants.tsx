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
  const { scene } = useGLTF("/models/gothic-shelf.glb");

  const shelf = useMemo(() => {
    const copy = scene.clone(true);
    copy.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        // On mobile, avoid rendering the shelf into shadow depth map
        mesh.castShadow = !compact;
        mesh.receiveShadow = true;
        if (mesh.material) {
          const mat = (mesh.material as MeshStandardMaterial).clone();
          mat.roughness = 0.88;
          mat.metalness = 0.04;
          if (mat.map) mat.map.anisotropy = 8;
          if (mat.normalMap) mat.normalMap.anisotropy = 8;
          mesh.material = mat;
        }
      }
    });
    return copy;
  }, [scene, compact]);

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

useGLTF.preload("/models/gothic-shelf.glb");

