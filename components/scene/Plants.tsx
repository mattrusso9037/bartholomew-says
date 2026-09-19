"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PlantsProps {
  reducedMotion?: boolean;
}

export function Plants({ reducedMotion = false }: PlantsProps) {
  const ivyGroupRef = useRef<THREE.Group>(null);

  // Gentle nocturnal draft swaying the creeping ivy
  useFrame((state) => {
    if (reducedMotion || !ivyGroupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Subtle organic wind sway
    ivyGroupRef.current.rotation.z = Math.sin(time * 0.9) * 0.015;
    ivyGroupRef.current.rotation.x = Math.cos(time * 0.7) * 0.012;
  });

  return (
    <group ref={ivyGroupRef} position={[0, -0.4, 0]}>
      {/* ============================================================ */}
      {/* VINE 1: Creeping up the left side of the bottom & middle book */}
      {/* ============================================================ */}
      <group position={[-0.78, -0.12, 0.35]}>
        {/* Climbing stem runner */}
        <mesh position={[0.04, 0.16, 0]} rotation={[0, 0, 0.16]}>
          <cylinderGeometry args={[0.01, 0.014, 0.36, 6]} />
          <meshStandardMaterial
            color="#22361b"
            roughness={0.82}
            metalness={0.04}
          />
        </mesh>
        {/* Ivy Leaves */}
        {[
          { pos: [0.03, 0.04, 0.03], rot: [0.2, 0.4, 0.3], scale: 0.055 },
          { pos: [-0.01, 0.14, 0.04], rot: [-0.1, -0.3, -0.2], scale: 0.065 },
          { pos: [0.05, 0.24, 0.03], rot: [0.3, 0.2, 0.4], scale: 0.05 },
          { pos: [0.08, 0.32, 0.02], rot: [0.1, -0.4, 0.1], scale: 0.042 },
        ].map((leaf, idx) => (
          <mesh
            key={idx}
            position={leaf.pos as [number, number, number]}
            rotation={leaf.rot as [number, number, number]}
            scale={[leaf.scale, leaf.scale * 1.25, leaf.scale * 0.3]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? "#335226" : "#28421d"}
              roughness={0.72}
              metalness={0.04}
            />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* VINE 2: Creeping along the front-right book edge & desk */}
      {/* ============================================================ */}
      <group position={[0.68, -0.16, 0.32]}>
        <mesh position={[-0.03, 0.12, 0]} rotation={[0, 0, -0.18]}>
          <cylinderGeometry args={[0.01, 0.014, 0.28, 6]} />
          <meshStandardMaterial
            color="#1e3017"
            roughness={0.85}
            metalness={0.04}
          />
        </mesh>
        {[
          { pos: [-0.01, 0.03, 0.03], rot: [0.15, -0.3, -0.2], scale: 0.05 },
          { pos: [-0.05, 0.14, 0.03], rot: [-0.2, 0.4, -0.3], scale: 0.06 },
          { pos: [-0.02, 0.22, 0.02], rot: [0.25, -0.1, 0.15], scale: 0.045 },
        ].map((leaf, idx) => (
          <mesh
            key={idx}
            position={leaf.pos as [number, number, number]}
            rotation={leaf.rot as [number, number, number]}
            scale={[leaf.scale, leaf.scale * 1.2, leaf.scale * 0.3]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? "#2b4620" : "#3b5d2c"}
              roughness={0.7}
              metalness={0.04}
            />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* Moss Clumps resting in book seams and desk corners */}
      {/* ============================================================ */}
      {[
        { pos: [-0.62, 0.05, 0.38], scale: [0.08, 0.03, 0.06] },
        { pos: [0.55, -0.04, 0.42], scale: [0.07, 0.028, 0.05] },
        { pos: [-0.48, 0.22, 0.34], scale: [0.055, 0.024, 0.045] },
        { pos: [0.38, 0.18, 0.36], scale: [0.05, 0.022, 0.04] },
      ].map((moss, idx) => (
        <mesh
          key={idx}
          position={moss.pos as [number, number, number]}
          scale={moss.scale as [number, number, number]}
        >
          <sphereGeometry args={[1, 7, 7]} />
          <meshStandardMaterial
            color="#22361b"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
      ))}
    </group>
  );
}
