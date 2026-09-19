"use client";

import { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import { DoubleSide, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from "three";

/** Small local PBR maps are shared by each material's meshes. No runtime texture generation. */
export function useSurface(kind: "stone" | "leather" | "pages", color = "#ffffff") {
  const source = useTexture([
    `/textures/${kind}-color.webp`,
    `/textures/${kind}-height.png`,
    `/textures/${kind}-roughness.png`,
  ]);
  const [colorSource, heightSource, roughSource] = source;
  const material = useMemo(() => {
    const [map, bumpMap, roughnessMap] = [colorSource, heightSource, roughSource].map((texture) => {
      const copy = texture.clone();
      copy.wrapS = copy.wrapT = RepeatWrapping;
      copy.anisotropy = 4;
      return copy;
    });
    map.colorSpace = SRGBColorSpace;
    return new MeshStandardMaterial({
      color, map, bumpMap, roughnessMap,
      bumpScale: kind === "stone" ? 0.035 : kind === "leather" ? 0.012 : 0.007,
      roughness: kind === "leather" ? 0.83 : 1,
      metalness: 0,
      side: DoubleSide,
    });
  }, [colorSource, heightSource, roughSource, kind, color]);
  useEffect(() => () => {
    material.map?.dispose();
    material.bumpMap?.dispose();
    material.roughnessMap?.dispose();
    material.dispose();
  }, [material]);
  return material;
}
