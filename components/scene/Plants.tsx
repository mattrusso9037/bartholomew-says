"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CatmullRomCurve3, Color, DoubleSide, InstancedMesh, Object3D, PlaneGeometry, SRGBColorSpace, TubeGeometry, Vector3 } from "three";

const runners = [
  [[-.57,.67,-.13],[-.79,.51,.18],[-.90,.27,.39],[-1.08,.08,.54],[-1.23,-.13,.71],[-1.17,-.52,.78],[-1.29,-.94,.81]],
  [[-.91,.23,.21],[-1.15,.1,.12],[-1.40,.03,.34],[-1.50,-.24,.60],[-1.41,-.59,.66]],
  [[-.70,.38,.38],[-.82,.19,.55],[-.77,-.03,.72],[-.57,-.14,.77],[-.51,-.43,.80]],
  [[.59,.54,-.1],[.76,.33,.12],[.87,.19,.31],[1.06,.03,.51],[1.29,-.14,.62],[1.22,-.60,.74],[1.37,-.90,.79]],
  [[.74,.2,.1],[1.07,.09,-.01],[1.35,.01,.10],[1.52,-.17,.27],[1.49,-.54,.43]],
  [[.83,.15,.37],[.68,.04,.60],[.80,-.14,.75],[.72,-.40,.83]],
];

export function Plants({ reducedMotion = false, compact = false }: { reducedMotion?: boolean; compact?: boolean }) {
  const instances = useRef<InstancedMesh>(null);
  const time = useRef(0);
  const map = useTexture("/textures/ivy.png", texture => { texture.colorSpace = SRGBColorSpace; });
  const foliage = useMemo(() => {
    const stems: TubeGeometry[] = [];
    const leaves: { p: Vector3; rotation: [number, number, number]; size: number; color: Color }[] = [];
    runners.forEach((path, v) => {
      const curve = new CatmullRomCurve3(path.map(p => new Vector3(...p)));
      stems.push(new TubeGeometry(curve, 40, 0.006, 5));
      const count = compact ? 8 : 13;
      for (let i = 0; i < count; i++) {
        const t = (i + .5) / count;
        const center = curve.getPoint(t);
        for (const side of [-1, 1]) {
          const p = center.clone().add(new Vector3(side * (.08 + .015 * Math.sin(i)), -.025, .035));
          const size = (.21 + Math.sin(i * 2.1 + v) * .036) * (1 - t * .36);
          stems.push(new TubeGeometry(new CatmullRomCurve3([center, center.clone().lerp(p,.6).add(new Vector3(0,.01,0)), p]), 5, .0025, 3));
          leaves.push({ p, size, rotation: [.20 + Math.sin(i * 2 + v) * .38, side * .28 + Math.sin(i * 1.3) * .38, side * (.65 + Math.sin(i * 2.4) * .3)], color: new Color().setHSL(.22 + Math.sin(i+v)*.025, .22, .57 + Math.sin(i*3+v)*.10) });
        }
      }
    });
    const stem = mergeGeometries(stems);
    stems.forEach(g => g.dispose());
    const leaf = new PlaneGeometry(1, 1, 8, 8);
    const pos = leaf.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x=pos.getX(i),y=pos.getY(i);
      pos.setZ(i, .11 * Math.sin((y+.5)*Math.PI) - .15 * x*x + .035 * Math.sin(x*6)*(y+.5));
      pos.setY(i, y+.34);
    }
    leaf.computeVertexNormals();
    return { leaf, stem, leaves, dummy: new Object3D() };
  }, [compact]);
  useEffect(() => {
    foliage.leaves.forEach((leaf, i) => instances.current?.setColorAt(i, leaf.color));
    if (instances.current?.instanceColor) instances.current.instanceColor.needsUpdate = true;
    return () => { foliage.leaf.dispose(); foliage.stem.dispose(); };
  }, [foliage]);
  useFrame((_, delta) => {
    if (!instances.current) return;
    if (!reducedMotion) time.current += Math.min(delta,.05);
    foliage.leaves.forEach((leaf, i) => {
      const sway = Math.sin(time.current * .55 + i * .73) * .027;
      foliage.dummy.position.copy(leaf.p);
      foliage.dummy.rotation.set(leaf.rotation[0] + sway * .6, leaf.rotation[1] + sway, leaf.rotation[2] + sway * .7);
      foliage.dummy.scale.setScalar(leaf.size);
      foliage.dummy.updateMatrix();
      instances.current!.setMatrixAt(i, foliage.dummy.matrix);
    });
    instances.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group name="Cathedral ivy">
      <mesh geometry={foliage.stem}><meshStandardMaterial color="#70694b" roughness={.95} /></mesh>
      <instancedMesh ref={instances} args={[foliage.leaf, undefined, foliage.leaves.length]} frustumCulled={false} receiveShadow>
        <meshStandardMaterial map={map} alphaTest={.4} side={DoubleSide} roughness={.69} emissiveMap={map} emissive="#91a774" emissiveIntensity={.20} />
      </instancedMesh>
    </group>
  );
}
