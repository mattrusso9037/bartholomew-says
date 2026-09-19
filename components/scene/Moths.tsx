"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Group, type Mesh, type MeshStandardMaterial } from "three";
import { MothTrail } from "./MothTrail";

const homes: [number, number, number][] = [[-0.96, 1.64, 0.45], [0.99, 1.85, 0.2], [-0.65, 0.66, 0.9], [0.81, 0.78, 0.8]];

function Moth({ model, index, reactionTrigger, reducedMotion, compact }: { model: Mesh; index: number; reactionTrigger: number; reducedMotion: boolean; compact: boolean }) {
  const root = useRef<Group>(null);
  const trigger = useRef(reactionTrigger);
  const progress = useRef(5);
  const time = useRef(0);
  const flap = useRef({ value: 0.25 });
  const material = useMemo(() => {
    const material = (model.material as MeshStandardMaterial).clone();
    // The supplied model is unrigged. Bend its actual wings on the GPU, retaining
    // the original mesh, UVs and PBR maps, and rotate normals with the surface.
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFlap = flap.current;
      shader.vertexShader = "uniform float uFlap;\n" + shader.vertexShader;
      const angle = "float wingAngle = uFlap * sign(position.x) * smoothstep(0.06, 0.42, abs(position.x)); float ws = sin(wingAngle); float wc = cos(wingAngle);";
      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", `#include <beginnormal_vertex>\n${angle}\nobjectNormal.xz = mat2(wc, -ws, ws, wc) * objectNormal.xz;`);
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.xz = mat2(wc, -ws, ws, wc) * transformed.xz;");
    };
    material.customProgramCacheKey = () => "silk-moth-wing-bend-v1";
    return material;
  }, [model.material]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, rawDelta) => {
    if (!root.current) return;
    const delta = Math.min(rawDelta, .05);
    if (!reducedMotion) time.current += delta;
    if (trigger.current !== reactionTrigger) { trigger.current = reactionTrigger; progress.current = 0; }
    if (!reducedMotion) progress.current = Math.min(5, progress.current + delta);
    const scatter = reducedMotion ? 0 : progress.current * Math.exp(-progress.current * 1.65) * 2.7;
    const t = time.current * (0.28 + index * 0.035) + index * 2;
    const home = homes[index];
    root.current.position.set(home[0] + Math.sin(t) * 0.2 + (index % 2 ? 1 : -1) * scatter * 0.5, home[1] + Math.cos(t * 1.3) * 0.13 + scatter * 0.5, home[2] + Math.sin(t * 0.8) * 0.18);
    root.current.rotation.set(Math.sin(t * 0.6) * 0.22, Math.sin(t * 0.8) * 0.55, Math.sin(t) * 0.2);
    flap.current.value = Math.sin(time.current * (10 + index * 1.3) + index) * 0.65;
  });
  return <group><group ref={root} position={homes[index]} scale={index === 0 ? 0.115 : 0.087}><mesh geometry={model.geometry} material={material} /></group><MothTrail anchor={root} compact={compact} reducedMotion={reducedMotion} /></group>;
}

export function Moths({ reactionTrigger, reducedMotion = false, compact = false }: { reactionTrigger: number; reducedMotion?: boolean; compact?: boolean }) {
  const { nodes } = useGLTF("/models/silk-moth.glb");
  return <group name="Silk moths">{homes.slice(0, compact ? 3 : 4).map((_, index) => <Moth key={index} model={nodes["silk-moth"] as Mesh} index={index} reactionTrigger={reactionTrigger} reducedMotion={reducedMotion} compact={compact} />)}</group>;
}
