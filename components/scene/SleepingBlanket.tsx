"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, Group, MathUtils, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, Vector3, type Bone, type SkinnedMesh } from "three";
import type { CharacterPhase } from "@/lib/character-motion";
import staticBlanketData from "@/lib/static-blanket-mesh.json";

const WIDTH = 1.42;
const REAR = -0.58;
const FRONT = 0.46;
const CENTER_X = -0.14;

/** Pre-shaped static velvet blanket for mobile viewports to prevent CPU bone-sampling lag and WebGL context loss. */
function MobileSleepingBlanket({
  amount,
  settle,
  reducedMotion,
}: {
  amount: RefObject<number>;
  settle: RefObject<number>;
  reducedMotion: boolean;
}) {
  const root = useRef<Group>(null);
  const time = useRef(0);

  const { geometry, material, texture } = useMemo(() => {
    // Medieval gold-embroidered velvet texture
    let tex: CanvasTexture | null = null;
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#46364a";
        ctx.fillRect(0, 0, 256, 256);

        ctx.strokeStyle = "#b38f44";
        ctx.lineWidth = 5;
        ctx.strokeRect(10, 10, 236, 236);

        ctx.strokeStyle = "#80662d";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(18, 18, 220, 220);
      }
      tex = new CanvasTexture(canvas);
    }

    // Exact pre-baked draped blanket geometry contoured over Bartholomew's curled sleeping body (Y up to 1.44m)
    const geom = new BufferGeometry();
    geom.setAttribute("position", new Float32BufferAttribute(staticBlanketData.positions, 3));
    geom.setAttribute("uv", new Float32BufferAttribute(staticBlanketData.uvs, 2));
    geom.setIndex(staticBlanketData.indices);
    geom.computeVertexNormals();

    const mat = new MeshStandardMaterial({
      color: "#ffffff",
      map: tex,
      roughness: 0.88,
      metalness: 0.05,
      side: DoubleSide,
      transparent: true,
      opacity: 0,
    });

    return { geometry: geom, material: mat, texture: tex };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      texture?.dispose();
    };
  }, [geometry, material, texture]);

  useFrame((_, delta) => {
    if (!root.current) return;
    const opacity = amount.current;
    const isVisible = opacity > 0.005;
    root.current.visible = isVisible;
    if (!isVisible) return;

    material.opacity = opacity;

    if (!reducedMotion) {
      time.current += Math.min(delta, 0.05);
      const breath = Math.sin(time.current * 1.1) * 0.0035 * (1 - settle.current);
      root.current.position.y = breath;
    } else {
      root.current.position.y = 0;
    }
  });

  return (
    <group ref={root} visible={false} name="Mobile velvet blanket">
      <mesh geometry={geometry} material={material} receiveShadow />
    </group>
  );
}

/** A small cloth height field fitted to the animated body, with an uncovered head. */
export function SleepingBlanket({ model, head, phase, amount, settle, reducedMotion, compact }: {
  model: SkinnedMesh; head: Bone; phase: RefObject<CharacterPhase>;
  amount: RefObject<number>; settle: RefObject<number>; reducedMotion: boolean; compact: boolean;
}) {
  if (compact) {
    return <MobileSleepingBlanket amount={amount} settle={settle} reducedMotion={reducedMotion} />;
  }
  const root = useRef<Group>(null);
  const elapsed = useRef(0);
  const sinceFit = useRef(1);
  const normalFrame = useRef(0);
  const cloth = useMemo(() => {
    const nx = compact ? 18 : 40, nz = compact ? 14 : 34;
    const geometry = new PlaneGeometry(WIDTH, FRONT - REAR, nx, nz);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(CENTER_X, 0, (FRONT + REAR) / 2);
    const pos = geometry.attributes.position;
    const rest = new Float32Array(pos.count), target = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const overhang = Math.hypot(Math.max(0, Math.abs(x) - 0.66), Math.max(0, Math.abs(z) - 0.43));
      rest[i] = 0.805 - Math.min(0.18, overhang * 1.15);
      target[i] = rest[i];
      pos.setY(i, rest[i]);
    }
    const headIndices = new Set(model.skeleton.bones.flatMap((bone, i) => /Head|Neck|headfront/.test(bone.name) ? [i] : []));
    const sampleIndices: number[] = [];
    const joints = model.geometry.attributes.skinIndex, weights = model.geometry.attributes.skinWeight;
    for (let i = 0; i < joints.count; i += compact ? 14 : 5) {
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
    return { geometry, material, rest, target, sampleIndices, nx, nz, initialized: false,
      fronts: new Float32Array(nx + 1).fill(FRONT),
      point: new Vector3(), headPoint: new Vector3(), matrix: new Matrix4(), inverse: new Matrix4() };
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
    const opacity = amount.current;
    const wasVisible = root.current.visible;
    root.current.visible = opacity > 0.005;
    if (!root.current.visible || (reducedMotion && cloth.initialized && wasVisible)) return;
    const delta = reducedMotion ? 0 : Math.min(rawDelta, 0.05);
    elapsed.current += delta;
    sinceFit.current += delta;
    cloth.material.opacity = opacity;
    const fitting = phase.current === "curling" || phase.current === "sleeping";
    if (fitting && (reducedMotion || !cloth.initialized || sinceFit.current > (compact ? 0.24 : 0.14))) {
      sinceFit.current = 0;
      root.current.updateWorldMatrix(true, false);
      cloth.inverse.copy(root.current.matrixWorld).invert();
      cloth.matrix.copy(cloth.inverse).multiply(model.matrixWorld);
      head.getWorldPosition(cloth.headPoint).applyMatrix4(cloth.inverse);
      // A curved front edge sits behind the neck. Unlike a height cap, this
      // physically leaves the face outside the cloth at every camera angle.
      const positions = cloth.geometry.attributes.position;
      for (let column = 0; column <= cloth.nx; column++) {
        const x = positions.getX(column);
        const distance = (x - cloth.headPoint.x) / 0.23;
        const notch = Math.exp(-distance * distance * 1.6);
        cloth.fronts[column] = FRONT - notch * MathUtils.clamp(FRONT - cloth.headPoint.z + 0.12, 0.3, 0.78);
        for (let row = 0; row <= cloth.nz; row++) {
          const i = row * (cloth.nx + 1) + column;
          const z = MathUtils.lerp(REAR, cloth.fronts[column], row / cloth.nz);
          positions.setZ(i, z);
          const overhang = Math.hypot(Math.max(0, Math.abs(x) - 0.66), Math.max(0, Math.abs(z) - 0.43));
          cloth.rest[i] = 0.805 - Math.min(0.18, overhang * 1.15);
        }
      }
      cloth.target.set(cloth.rest);
      for (const vertex of cloth.sampleIndices) {
        model.getVertexPosition(vertex, cloth.point).applyMatrix4(cloth.matrix);
        const p = cloth.point;
        if (p.y < 0.79) continue;
        const cx = Math.round(((p.x - CENTER_X) / WIDTH + 0.5) * cloth.nx);
        if (cx < 0 || cx > cloth.nx || p.z > cloth.fronts[cx] + 0.035) continue;
        const cz = Math.round((p.z - REAR) / (cloth.fronts[cx] - REAR) * cloth.nz);
        for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
          const x = cx + dx, z = cz + dz;
          if (x < 0 || x > cloth.nx || z < 0 || z > cloth.nz) continue;
          const index = z * (cloth.nx + 1) + x;
          const distance = Math.hypot(positions.getX(index) - p.x, positions.getZ(index) - p.z);
          cloth.target[index] = Math.max(cloth.target[index], p.y + 0.038 - distance * 0.65);
        }
      }
    }
    const positions = cloth.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), z = positions.getZ(i);
      const breath = Math.sin(elapsed.current * 1.1) * 0.009 * Math.exp(-(x*x + z*z) * 3) * (1 - settle.current);
      const folds = Math.sin(x * 23 + z * 8) * 0.008 + Math.cos(z * 21 - x * 5) * 0.005;
      const flutter = Math.sin(elapsed.current * 0.8 + x * 8 + z * 5) * 0.004 * Math.abs(x);
      // Stop sampling the rising body: the quilt slips down and stays on the
      // book for a short beat, rather than levitating with his shoulders.
      const height = MathUtils.lerp(cloth.target[i], cloth.rest[i], settle.current);
      const target = height + breath + folds + flutter;
      positions.setY(i, cloth.initialized && !reducedMotion ? MathUtils.damp(positions.getY(i), target, 6, delta) : target);
    }
    positions.needsUpdate = true;
    normalFrame.current++;
    if (!compact || normalFrame.current % 3 === 0 || !cloth.initialized) {
      cloth.geometry.computeVertexNormals();
    }
    cloth.initialized = true;
  }, -1);

  return (
    <group ref={root} visible={false} name="Breathing velvet quilt">
      <mesh geometry={cloth.geometry} material={cloth.material} castShadow={!compact} receiveShadow />
    </group>
  );
}
