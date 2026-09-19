"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MothsProps {
  reactionTrigger: number;
  reducedMotion?: boolean;
}

interface MothState {
  basePos: [number, number, number];
  speed: number;
  flapSpeed: number;
  radiusX: number;
  radiusY: number;
  radiusZ: number;
  phaseOffset: number;
  scatterDirection: [number, number, number];
}

export function Moths({ reactionTrigger, reducedMotion = false }: MothsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mothRefs = useRef<(THREE.Group | null)[]>([]);
  const leftWingRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rightWingRefs = useRef<(THREE.Mesh | null)[]>([]);

  const lastTriggerRef = useRef(reactionTrigger);
  const scatterFactorRef = useRef(0);

  // Set up 5 individual moths with varied organic flight parameters
  const mothConfigs = useMemo<MothState[]>(
    () => [
      {
        basePos: [-0.35, 0.45, 0.6],
        speed: 0.85,
        flapSpeed: 24,
        radiusX: 0.32,
        radiusY: 0.22,
        radiusZ: 0.28,
        phaseOffset: 0.0,
        scatterDirection: [-0.6, 0.7, 0.4],
      },
      {
        basePos: [0.45, 0.3, 0.5],
        speed: 0.72,
        flapSpeed: 28,
        radiusX: 0.38,
        radiusY: 0.28,
        radiusZ: 0.32,
        phaseOffset: 1.8,
        scatterDirection: [0.7, 0.6, 0.3],
      },
      {
        basePos: [-0.65, -0.15, 0.75], // near candlelight
        speed: 0.95,
        flapSpeed: 30,
        radiusX: 0.25,
        radiusY: 0.18,
        radiusZ: 0.22,
        phaseOffset: 3.4,
        scatterDirection: [-0.8, 0.4, 0.5],
      },
      {
        basePos: [0.2, 0.85, 0.3], // higher near gargoyle head
        speed: 0.65,
        flapSpeed: 22,
        radiusX: 0.42,
        radiusY: 0.3,
        radiusZ: 0.35,
        phaseOffset: 4.9,
        scatterDirection: [0.2, 0.9, 0.4],
      },
      {
        basePos: [0.65, -0.2, 0.6],
        speed: 0.78,
        flapSpeed: 26,
        radiusX: 0.3,
        radiusY: 0.25,
        radiusZ: 0.28,
        phaseOffset: 2.5,
        scatterDirection: [0.75, 0.3, 0.6],
      },
    ],
    []
  );

  useFrame((state, delta) => {
    // Check for quote change reaction trigger
    if (reactionTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = reactionTrigger;
      if (!reducedMotion) {
        scatterFactorRef.current = 1.0;
      }
    }

    // Decay scatter effect
    if (!reducedMotion && scatterFactorRef.current > 0) {
      scatterFactorRef.current = Math.max(
        0,
        scatterFactorRef.current - delta * 1.8
      );
    }

    const time = state.clock.getElapsedTime();

    mothConfigs.forEach((cfg, idx) => {
      const mothGroup = mothRefs.current[idx];
      const leftWing = leftWingRefs.current[idx];
      const rightWing = rightWingRefs.current[idx];
      if (!mothGroup) return;

      if (reducedMotion) {
        // In reduced motion mode, moths rest quietly on perches
        mothGroup.position.set(
          cfg.basePos[0] * 0.8,
          cfg.basePos[1] * 0.4 - 0.2,
          cfg.basePos[2] * 0.8
        );
        if (leftWing && rightWing) {
          // Slow resting wing fold
          leftWing.rotation.y = -0.4;
          rightWing.rotation.y = 0.4;
        }
        return;
      }

      // 1. Organic trigonometric trajectory (non-synchronized looping)
      const t = time * cfg.speed + cfg.phaseOffset;
      const wanderX =
        Math.sin(t * 1.1) * cfg.radiusX + Math.cos(t * 0.45) * (cfg.radiusX * 0.4);
      const wanderY =
        Math.cos(t * 0.9) * cfg.radiusY + Math.sin(t * 1.4) * (cfg.radiusY * 0.3);
      const wanderZ =
        Math.sin(t * 0.75) * cfg.radiusZ + Math.cos(t * 1.3) * (cfg.radiusZ * 0.3);

      // 2. Scatter impulse displacement
      const scatterDisplacement = Math.sin(scatterFactorRef.current * Math.PI);
      const scatterX = cfg.scatterDirection[0] * scatterDisplacement * 0.9;
      const scatterY = cfg.scatterDirection[1] * scatterDisplacement * 0.9;
      const scatterZ = cfg.scatterDirection[2] * scatterDisplacement * 0.7;

      const posX = cfg.basePos[0] + wanderX + scatterX;
      const posY = cfg.basePos[1] + wanderY + scatterY;
      const posZ = cfg.basePos[2] + wanderZ + scatterZ;

      mothGroup.position.set(posX, posY, posZ);

      // Orientation follows movement curve
      mothGroup.rotation.y = Math.sin(t * 0.8) * 0.8 + cfg.phaseOffset;
      mothGroup.rotation.x = Math.cos(t * 0.9) * 0.3;
      mothGroup.rotation.z = Math.sin(t * 1.2) * 0.25;

      // 3. Realistic high-frequency wing flapping (12-16 Hz)
      if (leftWing && rightWing) {
        const flapMult = 1.0 + scatterFactorRef.current * 1.2;
        const flap = Math.sin(time * cfg.flapSpeed * flapMult + cfg.phaseOffset * 5);
        leftWing.rotation.y = flap * 0.9;
        rightWing.rotation.y = -flap * 0.9;
      }
    });
  });

  return (
    <group ref={groupRef} name="Moths">
      {mothConfigs.map((_, idx) => (
        <group
          key={idx}
          ref={(el) => {
            mothRefs.current[idx] = el;
          }}
          scale={[0.075, 0.075, 0.075]}
        >
          {/* Moth Body */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.05, 0.5, 6]} />
            <meshStandardMaterial
              color="#231e1c"
              roughness={0.9}
              metalness={0.05}
            />
          </mesh>

          {/* Left Wing */}
          <group
            ref={(el) => {
              leftWingRefs.current[idx] = el as unknown as THREE.Mesh;
            }}
            position={[-0.04, 0.05, 0]}
          >
            <mesh position={[-0.38, 0.1, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.7, 0.42, 0.012]} />
              <meshStandardMaterial
                color="#ede8dd"
                emissive="#f4f0e6"
                emissiveIntensity={0.25}
                roughness={0.65}
                metalness={0.0}
                transparent
                opacity={0.88}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>

          {/* Right Wing */}
          <group
            ref={(el) => {
              rightWingRefs.current[idx] = el as unknown as THREE.Mesh;
            }}
            position={[0.04, 0.05, 0]}
          >
            <mesh position={[0.38, 0.1, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.7, 0.42, 0.012]} />
              <meshStandardMaterial
                color="#ede8dd"
                emissive="#f4f0e6"
                emissiveIntensity={0.25}
                roughness={0.65}
                metalness={0.0}
                transparent
                opacity={0.88}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
