"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { CatmullRomCurve3, DoubleSide, Group, SRGBColorSpace, Vector3 } from "three";

const vines = [
  [[-0.58, 0.5, 0.18], [-0.84, 0.31, 0.36], [-0.91, 0.14, 0.55], [-1.05, -0.11, 0.76], [-0.94, -0.50, 0.77], [-1.02, -0.73, 0.79]],
  [[-0.72, 0.30, 0.30], [-1.04, 0.19, 0.12], [-1.24, 0.11, 0.28], [-1.38, -0.09, 0.47], [-1.34, -0.43, 0.62]],
  [[0.5, 0.33, 0.27], [0.73, 0.21, 0.49], [0.92, 0.10, 0.48], [1.19, -0.09, 0.64], [1.10, -0.50, 0.77]],
  [[0.67, 0.17, 0.31], [0.93, 0.10, 0.14], [1.22, 0.09, 0.10], [1.45, -0.13, 0.23]],
];

export function Plants({ reducedMotion = false, compact = false }: { reducedMotion?: boolean; compact?: boolean }) {
  const group = useRef<Group>(null);
  const texture = useTexture("/textures/ivy.png", (map) => { map.colorSpace = SRGBColorSpace; });
  const curves = useMemo(() => vines.map((points) => new CatmullRomCurve3(points.map((p) => new Vector3(...p)))), []);
  const leaves = useMemo(() => curves.flatMap((curve, vine) => Array.from({ length: compact ? 9 : 14 }, (_, i) => {
    const t = (i + 0.4) / (compact ? 9 : 14);
    const p = curve.getPoint(t);
    const side = i % 2 ? 1 : -1;
    p.x += side * 0.067;
    p.z += 0.035;
    return { p, rotation: [0.10 + Math.sin(i * 3.2) * 0.45, Math.sin(i * 4.5) * 0.5, side * (0.5 + Math.sin(i * 1.7) * 0.3)] as [number, number, number], size: (0.20 + Math.sin(i * 2.3 + vine) * 0.045) * (1 - t * 0.26) };
  })), [curves, compact]);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((leaf, i) => {
      leaf.rotation.z = leaves[i].rotation[2] + (reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.8 + i * 1.4) * 0.035);
    });
  });
  return (
    <group name="Trailing ivy">
      {curves.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 32, 0.006, 5, false]} />
          <meshStandardMaterial color="#4b5030" roughness={1} />
        </mesh>
      ))}
      <group ref={group}>
        {leaves.map(({ p, rotation, size }, i) => (
          <mesh key={i} position={p} rotation={rotation} scale={size}>
            <planeGeometry args={[1, 1, 2, 2]} />
            <meshStandardMaterial map={texture} alphaTest={0.4} side={DoubleSide} roughness={0.83} emissiveMap={texture} emissive="#61704a" emissiveIntensity={0.15} color={i % 3 ? "#c2c6a2" : "#8c9e75"} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
