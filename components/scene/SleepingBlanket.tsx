"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, Group, MathUtils, Matrix4, MeshPhysicalMaterial, PlaneGeometry, Vector3, type SkinnedMesh } from "three";

/** A small cloth height field fitted to the animated body, with an uncovered head. */
export function SleepingBlanket({ model, amount, reducedMotion, compact }: {
  model: SkinnedMesh; amount: RefObject<number>; reducedMotion: boolean; compact: boolean;
}) {
  const root = useRef<Group>(null);
  const elapsed = useRef(0);
  const sinceFit = useRef(1);
  const cloth = useMemo(() => {
    const nx = compact ? 30 : 44, nz = compact ? 26 : 38;
    const geometry = new PlaneGeometry(2.08, 1.7, nx, nz);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    const rest = new Float32Array(pos.count), target = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const overhang = Math.hypot(Math.max(0, Math.abs(x) - 0.68), Math.max(0, Math.abs(z) - 0.47));
      rest[i] = 0.795 - Math.min(0.47, overhang * 1.4);
      target[i] = rest[i];
      pos.setY(i, rest[i]);
    }
    const headIndices = new Set(model.skeleton.bones.flatMap((bone, i) => /Head|Neck|headfront/.test(bone.name) ? [i] : []));
    const sampleIndices: number[] = [];
    const joints = model.geometry.attributes.skinIndex, weights = model.geometry.attributes.skinWeight;
    for (let i = 0; i < joints.count; i += compact ? 9 : 5) {
      let headWeight = 0;
      for (let c = 0; c < 4; c++) if (headIndices.has(joints.getComponent(i, c))) headWeight += weights.getComponent(i, c);
      if (headWeight < 0.25) sampleIndices.push(i);
    }
    const material = new MeshPhysicalMaterial({ color: "#403242", roughness: 0.94, metalness: 0, sheen: 0.85, sheenColor: "#8d7385", sheenRoughness: 0.85, side: DoubleSide, transparent: true, opacity: 0 });
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vClothUv;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvClothUv = uv;");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vClothUv;")
        .replace("#include <color_fragment>", `#include <color_fragment>
          float weave = sin(vClothUv.x * 1450.0) * sin(vClothUv.y * 1400.0);
          float seam = min(fract((vClothUv.x + vClothUv.y) * 10.0), fract((vClothUv.x - vClothUv.y) * 10.0));
          float edge = min(min(vClothUv.x, 1.0-vClothUv.x), min(vClothUv.y, 1.0-vClothUv.y));
          float hem = (1.0-smoothstep(0.005, 0.008, abs(edge-0.025))) + (1.0-smoothstep(0.002, 0.004, abs(edge-0.043)));
          diffuseColor.rgb *= 0.94 + weave * 0.055 + smoothstep(0.0, 0.055, seam) * 0.06;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.38,0.27,0.12), clamp(hem,0.0,1.0)*0.85);
        `);
    };
    return { geometry, material, rest, target, sampleIndices, nx, nz, point: new Vector3(), matrix: new Matrix4() };
  }, [model, compact]);
  const simulation = useRef<typeof cloth | null>(null);
  useEffect(() => {
    simulation.current = cloth;
    return () => { cloth.geometry.dispose(); cloth.material.dispose(); };
  }, [cloth]);

  useFrame((_, rawDelta) => {
    const cloth = simulation.current;
    if (!cloth) return;
    if (!root.current) return;
    const opacity = MathUtils.smoothstep(amount.current, 0.12, 0.9);
    root.current.visible = opacity > 0.005;
    if (!root.current.visible || reducedMotion) return;
    const delta = Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    sinceFit.current += delta;
    cloth.material.opacity = opacity;
    if (sinceFit.current > (compact ? 0.3 : 0.18)) {
      sinceFit.current = 0;
      root.current.updateWorldMatrix(true, false);
      cloth.matrix.copy(root.current.matrixWorld).invert().multiply(model.matrixWorld);
      cloth.target.set(cloth.rest);
      for (const vertex of cloth.sampleIndices) {
        model.getVertexPosition(vertex, cloth.point).applyMatrix4(cloth.matrix);
        const p = cloth.point;
        if (p.y < 0.79) continue;
        const cx = Math.round((p.x / 2.08 + 0.5) * cloth.nx);
        const cz = Math.round((p.z / 1.7 + 0.5) * cloth.nz);
        for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
          const x = cx + dx, z = cz + dz;
          if (x < 0 || x > cloth.nx || z < 0 || z > cloth.nz) continue;
          const index = z * (cloth.nx + 1) + x;
        // Keep a low central opening for the face, with higher shoulders and a
        // slightly fuller back so the cloth still reads as a curled-up nest.
        const shoulder = MathUtils.smoothstep(Math.abs(p.x), 0.08, 0.62) * 0.31;
        const neckline = 0.82 + shoulder + Math.max(0, -p.z) * 0.15;
        const fitted = Math.min(p.y + 0.085, neckline);
        cloth.target[index] = Math.max(cloth.target[index], fitted - Math.hypot(dx, dz) * 0.019);
        }
      }
    }
    const positions = cloth.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      const breath = Math.sin(elapsed.current * 1.1) * 0.014 * Math.exp(-(x*x + z*z) * 3);
      const folds = Math.sin(x * 23 + z * 8) * 0.009 + Math.cos(z * 21 - x * 5) * 0.006;
      const flutter = Math.sin(elapsed.current * 0.8 + x * 8 + z * 5) * 0.004 * Math.abs(x);
      positions.setY(i, MathUtils.damp(positions.getY(i), cloth.target[i] + breath + folds + flutter + (1-opacity)*0.065, 5, delta));
    }
    positions.needsUpdate = true;
    cloth.geometry.computeVertexNormals();
  }, -1);

  return <group ref={root} visible={false} name="Breathing velvet quilt"><mesh geometry={cloth.geometry} material={cloth.material} castShadow receiveShadow /></group>;
}
