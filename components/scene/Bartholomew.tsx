"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BartholomewProps {
  reactionTrigger: number;
  reducedMotion?: boolean;
}

/**
 * Bartholomew the Gargoyle.
 *
 * Modeled as a stylized stone gargoyle perched atop the book stack.
 * Ready for drop-in replacement with `useGLTF('/models/bartholomew.glb')`
 * once the final 3D asset is available.
 */
export function Bartholomew({
  reactionTrigger,
  reducedMotion = false,
}: BartholomewProps) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const eyesMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const lastTriggerRef = useRef(reactionTrigger);
  const reactionProgressRef = useRef(1); // 1 = at rest, 0 = start of reaction

  useFrame((state, delta) => {
    if (!rootGroupRef.current || !headGroupRef.current) return;

    const time = state.clock.getElapsedTime();

    // Check for quote change trigger
    if (reactionTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = reactionTrigger;
      if (!reducedMotion) {
        reactionProgressRef.current = 0;
      }
    }

    // Reaction animation decay (approx 700ms duration)
    let reactionLift = 0;
    let reactionHeadTilt = 0;
    let reactionWingFlare = 0;
    let reactionEyeIntensity = 0;

    if (!reducedMotion && reactionProgressRef.current < 1) {
      reactionProgressRef.current += delta * 1.5;
      const t = Math.min(1, reactionProgressRef.current);
      // Damped spring response: quick startled perk up, gentle settle
      const decay = Math.exp(-t * 4);
      reactionLift = Math.sin(t * Math.PI) * 0.09 * decay;
      reactionHeadTilt = Math.sin(t * Math.PI * 1.5) * 0.14 * decay;
      reactionWingFlare = Math.sin(t * Math.PI) * 0.12 * decay;
      reactionEyeIntensity = Math.sin(t * Math.PI) * 3.0 * decay;
    }

    if (!reducedMotion) {
      // 1. Subtle idle breathing (rhythmic chest/spine cycle)
      const breathing = Math.sin(time * 1.8) * 0.012;
      rootGroupRef.current.position.y = -0.06 + breathing + reactionLift;

      // 2. Subtle pointer tracking for head
      const targetHeadRotY = THREE.MathUtils.clamp(
        state.pointer.x * 0.35 - 0.12,
        -0.28,
        0.28
      );
      const targetHeadRotX = THREE.MathUtils.clamp(
        -state.pointer.y * 0.22 + reactionHeadTilt,
        -0.2,
        0.3
      );

      headGroupRef.current.rotation.y = THREE.MathUtils.damp(
        headGroupRef.current.rotation.y,
        targetHeadRotY,
        4,
        delta
      );
      headGroupRef.current.rotation.x = THREE.MathUtils.damp(
        headGroupRef.current.rotation.x,
        targetHeadRotX,
        4,
        delta
      );

      // 3. Subtle wing idling + reaction flare
      if (leftWingRef.current && rightWingRef.current) {
        const wingIdle = Math.sin(time * 1.8 + 0.5) * 0.012;
        leftWingRef.current.rotation.y = -0.22 - wingIdle - reactionWingFlare;
        rightWingRef.current.rotation.y = 0.22 + wingIdle + reactionWingFlare;
      }

      // 4. Amber eye glow pulse
      if (eyesMaterialRef.current) {
        const baseGlow = 1.8 + Math.sin(time * 2.2) * 0.4;
        eyesMaterialRef.current.emissiveIntensity =
          baseGlow + reactionEyeIntensity;
      }
    } else {
      // Reduced motion defaults
      rootGroupRef.current.position.y = -0.06;
      headGroupRef.current.rotation.set(0.05, -0.1, 0);
      if (eyesMaterialRef.current) {
        eyesMaterialRef.current.emissiveIntensity = 1.8;
      }
    }
  });

  return (
    <group ref={rootGroupRef} position={[0, -0.06, 0]}>
      {/* ============================================================ */}
      {/* CROUCHING LOWER BODY & HAUNCHES */}
      {/* ============================================================ */}
      <group position={[0, 0.08, -0.02]}>
        {/* Pelvis / Crouching Base */}
        <mesh position={[0, 0, 0]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[0.54, 0.32, 0.46]} />
          <meshStandardMaterial
            color="#464f5e"
            roughness={0.82}
            metalness={0.12}
          />
        </mesh>

        {/* Left Stone Haunch */}
        <mesh position={[-0.28, 0.02, 0.04]} rotation={[0.22, 0.2, -0.12]}>
          <cylinderGeometry args={[0.12, 0.15, 0.34, 7]} />
          <meshStandardMaterial
            color="#404958"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
        {/* Right Stone Haunch */}
        <mesh position={[0.28, 0.02, 0.04]} rotation={[0.22, -0.2, 0.12]}>
          <cylinderGeometry args={[0.12, 0.15, 0.34, 7]} />
          <meshStandardMaterial
            color="#404958"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>

        {/* Stone Gargoyle Tail curling to side */}
        <mesh position={[0.14, -0.06, -0.24]} rotation={[0.4, 0.6, -0.3]}>
          <torusGeometry args={[0.2, 0.038, 6, 14, Math.PI * 0.95]} />
          <meshStandardMaterial
            color="#38414f"
            roughness={0.88}
            metalness={0.1}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* UPPER TORSO & CHEST */}
      {/* ============================================================ */}
      <group position={[0, 0.36, 0.04]} rotation={[-0.08, 0, 0]}>
        {/* Ribcage / Stone Chest */}
        <mesh position={[0, 0, 0]}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color="#4c5666"
            roughness={0.8}
            metalness={0.14}
          />
        </mesh>

        {/* Left Arm & Claw resting forward on the book cover */}
        <group position={[-0.28, 0.05, 0.08]}>
          <mesh position={[-0.04, -0.14, 0.08]} rotation={[0.45, 0.1, -0.2]}>
            <cylinderGeometry args={[0.075, 0.065, 0.28, 6]} />
            <meshStandardMaterial
              color="#424c5a"
              roughness={0.84}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[-0.06, -0.3, 0.2]} rotation={[0.95, -0.1, -0.1]}>
            <boxGeometry args={[0.11, 0.18, 0.08]} />
            <meshStandardMaterial
              color="#38424f"
              roughness={0.86}
              metalness={0.12}
            />
          </mesh>
        </group>

        {/* Right Arm & Claw resting forward on the book cover */}
        <group position={[0.28, 0.05, 0.08]}>
          <mesh position={[0.04, -0.14, 0.08]} rotation={[0.45, -0.1, 0.2]}>
            <cylinderGeometry args={[0.075, 0.065, 0.28, 6]} />
            <meshStandardMaterial
              color="#424c5a"
              roughness={0.84}
              metalness={0.12}
            />
          </mesh>
          <mesh position={[0.06, -0.3, 0.2]} rotation={[0.95, 0.1, 0.1]}>
            <boxGeometry args={[0.11, 0.18, 0.08]} />
            <meshStandardMaterial
              color="#38424f"
              roughness={0.86}
              metalness={0.12}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* GARGOYLE HEAD & HORNS (Tracks pointer) */}
      {/* ============================================================ */}
      <group ref={headGroupRef} position={[0, 0.62, 0.1]}>
        {/* Head Block / Skull */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.28, 0.26, 0.3]} />
          <meshStandardMaterial
            color="#4f5a6b"
            roughness={0.78}
            metalness={0.15}
          />
        </mesh>

        {/* Snout / Gargoyle Muzzle */}
        <mesh position={[0, -0.04, 0.19]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.19, 0.14, 0.17]} />
          <meshStandardMaterial
            color="#444e5e"
            roughness={0.82}
            metalness={0.12}
          />
        </mesh>

        {/* Left Gargoyle Horn / Pointed Ear */}
        <mesh position={[-0.12, 0.18, -0.03]} rotation={[-0.2, 0.1, -0.38]}>
          <coneGeometry args={[0.055, 0.22, 6]} />
          <meshStandardMaterial
            color="#343c4a"
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
        {/* Right Gargoyle Horn / Pointed Ear */}
        <mesh position={[0.12, 0.18, -0.03]} rotation={[-0.2, -0.1, 0.38]}>
          <coneGeometry args={[0.055, 0.22, 6]} />
          <meshStandardMaterial
            color="#343c4a"
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>

        {/* Left Glowing Amber Eye Slit */}
        <mesh position={[-0.07, 0.04, 0.155]} rotation={[0, -0.2, 0.1]}>
          <boxGeometry args={[0.048, 0.018, 0.02]} />
          <meshStandardMaterial
            ref={eyesMaterialRef}
            color="#ffc038"
            emissive="#f59e0b"
            emissiveIntensity={2.0}
            roughness={0.15}
          />
        </mesh>
        {/* Right Glowing Amber Eye Slit */}
        <mesh position={[0.07, 0.04, 0.155]} rotation={[0, 0.2, -0.1]}>
          <boxGeometry args={[0.048, 0.018, 0.02]} />
          <meshStandardMaterial
            color="#ffc038"
            emissive="#f59e0b"
            emissiveIntensity={2.0}
            roughness={0.15}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* ARMORED STONE WINGS */}
      {/* ============================================================ */}
      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.16, 0.38, -0.14]}>
        {/* Wing Spar */}
        <mesh position={[-0.16, 0.22, -0.08]} rotation={[0.45, 0.32, -0.42]}>
          <boxGeometry args={[0.06, 0.5, 0.06]} />
          <meshStandardMaterial
            color="#3a4352"
            roughness={0.85}
            metalness={0.12}
          />
        </mesh>
        {/* Wing Webbing */}
        <mesh position={[-0.28, 0.2, -0.12]} rotation={[0.38, 0.22, -0.32]}>
          <boxGeometry args={[0.3, 0.42, 0.025]} />
          <meshStandardMaterial
            color="#414b5a"
            roughness={0.88}
            metalness={0.08}
          />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.16, 0.38, -0.14]}>
        {/* Wing Spar */}
        <mesh position={[0.16, 0.22, -0.08]} rotation={[0.45, -0.32, 0.42]}>
          <boxGeometry args={[0.06, 0.5, 0.06]} />
          <meshStandardMaterial
            color="#3a4352"
            roughness={0.85}
            metalness={0.12}
          />
        </mesh>
        {/* Wing Webbing */}
        <mesh position={[0.28, 0.2, -0.12]} rotation={[0.38, -0.22, 0.32]}>
          <boxGeometry args={[0.3, 0.42, 0.025]} />
          <meshStandardMaterial
            color="#414b5a"
            roughness={0.88}
            metalness={0.08}
          />
        </mesh>
      </group>
    </group>
  );
}
