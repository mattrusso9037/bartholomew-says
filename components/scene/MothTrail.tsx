"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, ShaderMaterial } from "three";

export function MothTrail({ anchor, compact, reducedMotion }: { anchor: RefObject<Group | null>; compact: boolean; reducedMotion: boolean }) {
  const cursor = useRef(0), sinceEmission = useRef(0);
  const particles = useMemo(() => {
    const count = compact ? 12 : 24;
    const geometry = new BufferGeometry();
    const positions = new Float32Array(count*3), alpha = new Float32Array(count), age = new Float32Array(count).fill(10);
    geometry.setAttribute("position", new BufferAttribute(positions,3));
    geometry.setAttribute("aAlpha", new BufferAttribute(alpha,1));
    const material = new ShaderMaterial({
      transparent: true, depthWrite: false, blending: AdditiveBlending,
      vertexShader: `attribute float aAlpha; varying float vAlpha;
        void main(){ vAlpha=aAlpha; vec4 p=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*p; gl_PointSize=clamp(26.0/-p.z,2.0,7.0); }`,
      fragmentShader: `varying float vAlpha;
        void main(){vec2 p=gl_PointCoord-.5; float core=exp(-dot(p,p)*38.0); float rays=exp(-abs(p.x)*70.0-abs(p.y)*9.0)+exp(-abs(p.y)*70.0-abs(p.x)*9.0); gl_FragColor=vec4(1.0,.79,.43,(core*.75+rays*.16)*vAlpha);}`,
    });
    return { count, geometry, material, positions, alpha, age };
  }, [compact]);
  const simulation = useRef<typeof particles | null>(null);
  useEffect(() => {
    simulation.current = particles;
    return () => { particles.geometry.dispose(); particles.material.dispose(); };
  }, [particles]);
  useFrame((_, rawDelta) => {
    const particles = simulation.current;
    if (!particles) return;
    if (reducedMotion || !anchor.current) return;
    const delta = Math.min(rawDelta,.05);
    sinceEmission.current += delta;
    if (sinceEmission.current > (compact ? .15 : .075)) {
      sinceEmission.current = 0;
      const i = cursor.current++ % particles.count;
      particles.positions.set(anchor.current.position.toArray(), i*3);
      particles.age[i] = 0;
    }
    for (let i=0;i<particles.count;i++) {
      particles.age[i] += delta;
      particles.positions[i*3+1] -= delta * .023;
      particles.alpha[i] = Math.max(0,1-particles.age[i]/1.65) ** 2 * .34;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.geometry.attributes.aAlpha.needsUpdate = true;
  });
  return <points geometry={particles.geometry} material={particles.material} frustumCulled={false} visible={!reducedMotion} />;
}
