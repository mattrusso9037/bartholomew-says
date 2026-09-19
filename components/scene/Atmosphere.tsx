"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points } from "three";

export function Atmosphere({ compact, reducedMotion }: { compact: boolean; reducedMotion: boolean }) {
  const ref = useRef<Points>(null);
  const positions = useMemo(() => {
    const count = compact ? 12 : 32;
    return new Float32Array(Array.from({ length: count * 3 }, (_, i) => {
      const seed = Math.sin(i * 127.1 + 45.2) * 43758.5453;
      const n = seed - Math.floor(seed);
      return i % 3 === 0 ? (n - 0.5) * 3.8 : i % 3 === 1 ? n * 2.9 : (n - 0.5) * 2;
    }));
  }, [compact]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.035) * 0.12;
    ref.current.position.y = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.12) * 0.06;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#d9c69e" size={0.007} transparent opacity={0.28} depthWrite={false} />
    </points>
  );
}
