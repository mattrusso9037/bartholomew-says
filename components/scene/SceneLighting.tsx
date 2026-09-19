"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SceneLightingProps {
  reducedMotion?: boolean;
}

export function SceneLighting({ reducedMotion = false }: SceneLightingProps) {
  const candleLightRef = useRef<THREE.PointLight>(null);

  // Subtle organic flicker for the candlelight near the books
  useFrame((state) => {
    if (reducedMotion || !candleLightRef.current) return;
    const time = state.clock.getElapsedTime();
    const flicker =
      Math.sin(time * 6.5) * 0.15 +
      Math.sin(time * 18.2) * 0.1 +
      Math.sin(time * 29.4) * 0.05;
    candleLightRef.current.intensity = 3.6 + flicker;
  });

  return (
    <group name="SceneLighting">
      {/* Ambient gothic cathedral shadows */}
      <ambientLight color="#243042" intensity={1.3} />

      {/* Moonlit key light from high arched window */}
      <directionalLight
        position={[-3.2, 4.5, 3.8]}
        color="#e4eeff"
        intensity={3.6}
        castShadow={false}
      />

      {/* Rim light from behind right to pick out the stone gargoyle silhouette and wing edges */}
      <directionalLight
        position={[3.5, 3.2, -2.2]}
        color="#8ab0f8"
        intensity={3.8}
      />

      {/* Warm candlelight point light placed just in front of the book stack */}
      <pointLight
        ref={candleLightRef}
        position={[0.2, 0.2, 1.3]}
        color="#ffaa3b"
        intensity={3.6}
        distance={5.5}
        decay={1.8}
      />

      {/* Soft cool fill light so stone texture and book leather are rich and visible */}
      <pointLight
        position={[-0.5, 1.6, 2.8]}
        color="#586f8c"
        intensity={1.2}
        distance={7.0}
        decay={2}
      />
    </group>
  );
}
