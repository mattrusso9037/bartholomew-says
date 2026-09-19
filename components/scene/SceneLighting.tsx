"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils, Mesh, PointLight, Vector2 } from "three";

function Candle({ position, height, reducedMotion }: { position: [number, number, number]; height: number; reducedMotion: boolean }) {
  const flame = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const halo = useRef<Mesh>(null);
  const hovered = useRef(false);
  const warmth = useRef(0);
  const time = useRef(height * 18);
  const invalidate = useThree(state => state.invalidate);
  const holder = useMemo(() => [
    [0, 0], [0.14, 0], [0.145, 0.023], [0.11, 0.04], [0.055, 0.06], [0.028, 0.095],
    [0.028, 0.16], [0.052, 0.18], [0.052, 0.20], [0.035, 0.215], [0.032, 0.27], [0.10, 0.29], [0.11, 0.31], [0.065, 0.32],
  ].map(([x, y]) => new Vector2(x, y)), []);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    if (!reducedMotion) time.current += clampedDelta;
    const t = time.current;
    warmth.current = reducedMotion ? Number(hovered.current) : MathUtils.damp(warmth.current, Number(hovered.current), 5.5, clampedDelta);
    const flicker = reducedMotion ? 0 : Math.sin(t * 7.4) * 0.06 + Math.sin(t * 13.1) * 0.035;
    if (flame.current) {
      flame.current.scale.set(
        1 + warmth.current * 0.65,
        1 + flicker + warmth.current * 0.85,
        1 + warmth.current * 0.65
      );
      flame.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 4.8) * 0.055;
    }
    if (halo.current) {
      (halo.current.material as import("three").MeshBasicMaterial).opacity = 0.25 + warmth.current * 0.55;
    }
    if (light.current) {
      light.current.intensity = 1.7 + flicker * 2 + warmth.current * 7.8;
      light.current.distance = 3.8 + warmth.current * 4.0;
    }
  });

  return (
    <group position={position} name="Hover candle">
      <mesh
        position={[0, (height + 0.45) / 2, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          hovered.current = true;
          document.body.style.cursor = "pointer";
          invalidate();
        }}
        onPointerOut={() => {
          hovered.current = false;
          document.body.style.cursor = "auto";
          invalidate();
        }}
      >
        <cylinderGeometry args={[0.26, 0.26, height + 0.7, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[holder, 24]} />
        <meshStandardMaterial color="#82704c" metalness={0.8} roughness={0.43} />
      </mesh>
      <mesh position={[0, 0.32 + height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.051, 0.057, height, 24]} />
        <meshStandardMaterial color="#d6c29a" roughness={0.92} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.sin(i * 2.4) * 0.05, 0.32 + height - 0.024 - (i % 3) * 0.031, Math.cos(i * 2.4) * 0.05]} scale={[0.01, 0.04 + (i % 3) * 0.028, 0.01]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#d3bf99" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, height + 0.335, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.035, 6]} />
        <meshBasicMaterial color="#3b2816" />
      </mesh>
      <group ref={flame} position={[0, height + 0.35, 0]}>
        <mesh position={[0, 0.047, 0]} scale={[0.021, 0.063, 0.018]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#ffb950" transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.025, 0.009]} scale={[0.012, 0.033, 0.012]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial color="#fff2c5" toneMapped={false} />
        </mesh>
        <mesh ref={halo} position={[0, 0.042, 0]} scale={[0.045, 0.085, 0.045]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#ff9c2b" transparent opacity={0.25} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} position={[0, height + 0.41, 0]} color="#ffb765" intensity={1.8} distance={3.8} decay={2} />
    </group>
  );
}

export function SceneLighting({ reducedMotion = false, compact = false }: { reducedMotion?: boolean; compact?: boolean }) {
  return (
    <group name="Moonlight and candlelight">
      <hemisphereLight args={["#c0cfd6", "#514430", 1.05]} />
      <directionalLight position={[-3, 5, 3]} color="#c6dceb" intensity={2.05} castShadow shadow-mapSize={[compact ? 512 : 1024, compact ? 512 : 1024]} shadow-camera-left={-2.7} shadow-camera-right={2.7} shadow-camera-top={3.5} shadow-camera-bottom={-1.5} shadow-camera-near={0.5} shadow-camera-far={12} shadow-normalBias={0.025} shadow-bias={-0.0001} shadow-radius={3} />
      <directionalLight position={[0, 1.8, 4]} color="#e5d9bc" intensity={0.5} />
      <directionalLight position={[2, 3, -3]} color="#b6cde0" intensity={1.7} />
      <Candle position={[-1.19, 0, 0.05]} height={0.38} reducedMotion={reducedMotion} />
      <Candle position={[1.07, 0, -0.35]} height={0.63} reducedMotion={reducedMotion} />
    </group>
  );
}
