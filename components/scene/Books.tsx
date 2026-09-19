"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BooksProps {
  reactionTrigger: number;
  reducedMotion?: boolean;
}

export function Books({ reactionTrigger, reducedMotion = false }: BooksProps) {
  const stackRef = useRef<THREE.Group>(null);
  const lastTriggerRef = useRef(reactionTrigger);
  const settleProgressRef = useRef(1); // 1 = settled, 0 = start of settle

  useFrame((_, delta) => {
    if (!stackRef.current) return;

    // Detect new quote reaction
    if (reactionTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = reactionTrigger;
      if (!reducedMotion) {
        settleProgressRef.current = 0;
      }
    }

    if (!reducedMotion && settleProgressRef.current < 1) {
      settleProgressRef.current += delta * 2.8;
      const progress = Math.min(1, settleProgressRef.current);
      // Damped vibration settle
      const decay = Math.exp(-progress * 5);
      const microSettleY = Math.sin(progress * Math.PI * 4) * 0.012 * decay;
      const microTremorZ = Math.cos(progress * Math.PI * 4) * 0.008 * decay;

      stackRef.current.position.y = microSettleY;
      stackRef.current.rotation.z = microTremorZ;
    } else if (stackRef.current.position.y !== 0) {
      stackRef.current.position.y = 0;
      stackRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={stackRef} position={[0, -0.4, 0]}>
      {/* Heavy carved scholar's stone desk slab that grounds the books into shadow */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[2.3, 0.38, 1.85]} />
        <meshStandardMaterial
          color="#151a24"
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>

      {/* ============================================================ */}
      {/* BOTTOM BOOK: Massive antique oxblood leather folio */}
      {/* ============================================================ */}
      <group position={[0, -0.06, 0]}>
        {/* Leather Cover */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.16, 1.15]} />
          <meshStandardMaterial
            color="#3d151c"
            roughness={0.55}
            metalness={0.12}
          />
        </mesh>
        {/* Parchment Pages Block */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[1.44, 0.14, 1.1]} />
          <meshStandardMaterial
            color="#dfd2b5"
            roughness={0.9}
            metalness={0.0}
          />
        </mesh>
        {/* Spine Raised Gold Ribs */}
        {[-0.45, -0.2, 0.05, 0.3].map((x, idx) => (
          <mesh key={idx} position={[x, 0, 0.58]}>
            <cylinderGeometry args={[0.014, 0.014, 0.17, 8]} />
            <meshStandardMaterial
              color="#d4af37"
              metalness={0.85}
              roughness={0.25}
            />
          </mesh>
        ))}
        {/* Gold Corner Caps */}
        {[
          [-0.72, 0.08, 0.54],
          [0.72, 0.08, 0.54],
          [-0.72, 0.08, -0.54],
          [0.72, 0.08, -0.54],
        ].map((pos, idx) => (
          <mesh key={idx} position={pos as [number, number, number]}>
            <boxGeometry args={[0.08, 0.015, 0.08]} />
            <meshStandardMaterial
              color="#c5a059"
              metalness={0.8}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* MIDDLE BOOK: Deep sapphire navy leather tome, askew angle */}
      {/* ============================================================ */}
      <group position={[0.05, 0.11, 0.02]} rotation={[0, -0.16, 0]}>
        {/* Cover */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.34, 0.14, 1.02]} />
          <meshStandardMaterial
            color="#142138"
            roughness={0.58}
            metalness={0.15}
          />
        </mesh>
        {/* Pages */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[1.28, 0.12, 0.98]} />
          <meshStandardMaterial
            color="#d6c7a4"
            roughness={0.92}
            metalness={0.0}
          />
        </mesh>
        {/* Gold Corner Caps */}
        <mesh position={[-0.64, 0.072, 0.48]}>
          <boxGeometry args={[0.07, 0.012, 0.07]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* TOP BOOK: Obsidian/slate leather grimoire with gold crest */}
      {/* ============================================================ */}
      <group position={[-0.03, 0.26, -0.02]} rotation={[0, 0.1, 0]}>
        {/* Cover */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 0.13, 0.92]} />
          <meshStandardMaterial
            color="#1e222b"
            roughness={0.62}
            metalness={0.14}
          />
        </mesh>
        {/* Pages */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[1.15, 0.11, 0.88]} />
          <meshStandardMaterial
            color="#d0bf9a"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>
        {/* Gold Medallion Crest on Cover */}
        <mesh position={[0, 0.068, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.006, 20]} />
          <meshStandardMaterial
            color="#e5c158"
            metalness={0.88}
            roughness={0.25}
          />
        </mesh>
        {/* Crimson Silk Ribbon Bookmark */}
        <mesh position={[0.48, -0.09, 0.38]} rotation={[0.22, 0, 0.18]}>
          <boxGeometry args={[0.045, 0.24, 0.005]} />
          <meshStandardMaterial
            color="#8c1d28"
            roughness={0.45}
            metalness={0.1}
          />
        </mesh>
      </group>
    </group>
  );
}
