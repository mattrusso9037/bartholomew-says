"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, ShaderMaterial } from "three";

export function MothTrail({
  anchor,
  scatterProgress,
  compact,
  reducedMotion,
}: {
  anchor: RefObject<Group | null>;
  scatterProgress?: RefObject<number>;
  compact: boolean;
  reducedMotion: boolean;
}) {
  const cursor = useRef(0);
  const sinceEmission = useRef(0);

  const particles = useMemo(() => {
    const count = compact ? 25 : 90;
    const geometry = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const alpha = new Float32Array(count);
    const size = new Float32Array(count);
    const seed = new Float32Array(count);
    const age = new Float32Array(count).fill(10);
    const vx = new Float32Array(count);
    const vy = new Float32Array(count);
    const vz = new Float32Array(count);

    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aAlpha", new BufferAttribute(alpha, 1));
    geometry.setAttribute("aSize", new BufferAttribute(size, 1));
    geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexShader: `
        attribute float aAlpha;
        attribute float aSize;
        attribute float aSeed;
        varying float vAlpha;
        varying float vSeed;
        void main() {
          vAlpha = aAlpha;
          vSeed = aSeed;
          vec4 p = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * p;
          gl_PointSize = clamp(aSize * (4.2 / -p.z), 8.0, 36.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying float vSeed;
        void main() {
          if (vAlpha <= 0.005) discard;
          vec2 p = gl_PointCoord - vec2(0.5);
          float dist = length(p);
          if (dist > 0.5) discard;

          float angle = vSeed * 6.2831853;
          float sa = sin(angle);
          float ca = cos(angle);
          vec2 rp = mat2(ca, -sa, sa, ca) * p;

          // Sparkle cross star rays
          float ray1 = exp(-abs(rp.x) * 22.0 - abs(rp.y) * 3.5);
          float ray2 = exp(-abs(rp.y) * 22.0 - abs(rp.x) * 3.5);

          vec2 diag = vec2(rp.x + rp.y, rp.x - rp.y) * 0.7071;
          float ray3 = exp(-abs(diag.x) * 26.0 - abs(diag.y) * 4.5) * 0.5;
          float ray4 = exp(-abs(diag.y) * 26.0 - abs(diag.x) * 4.5) * 0.5;

          float star = (ray1 + ray2 + ray3 + ray4) * 0.75;
          float core = exp(-dist * dist * 38.0);
          float halo = exp(-dist * 7.0) * 0.35;

          float spark = core * 1.3 + star * 0.9 + halo;
          float a = clamp(spark * vAlpha, 0.0, 1.0);

          // Golden stardust glow
          vec3 amber = vec3(1.0, 0.72, 0.28);
          vec3 whiteGold = vec3(1.0, 0.96, 0.86);
          vec3 color = mix(amber, whiteGold, clamp(core * 1.3, 0.0, 1.0));

          gl_FragColor = vec4(color, a);
        }
      `,
    });

    return { count, geometry, material, positions, alpha, size, seed, age, vx, vy, vz };
  }, [compact]);

  const simulation = useRef<typeof particles | null>(null);
  useEffect(() => {
    simulation.current = particles;
    return () => {
      particles.geometry.dispose();
      particles.material.dispose();
    };
  }, [particles]);

  useFrame((_, rawDelta) => {
    const p = simulation.current;
    if (!p || reducedMotion || !anchor.current) return;
    const delta = Math.min(rawDelta, 0.05);

    const isScattering = Boolean(scatterProgress && scatterProgress.current < 2.8);
    const mothPos = anchor.current.position;

    sinceEmission.current += delta;
    const emissionRate = isScattering ? (compact ? 0.024 : 0.014) : (compact ? 0.12 : 0.06);

    while (sinceEmission.current >= emissionRate) {
      sinceEmission.current -= emissionRate;
      const i = cursor.current++ % p.count;
      const jitter = isScattering ? 0.035 : 0.018;

      p.positions[i * 3] = mothPos.x + (Math.random() - 0.5) * jitter;
      p.positions[i * 3 + 1] = mothPos.y + (Math.random() - 0.5) * jitter;
      p.positions[i * 3 + 2] = mothPos.z + (Math.random() - 0.5) * jitter;

      p.age[i] = 0;
      p.seed[i] = Math.random();
      p.size[i] = (isScattering ? 22 : 16) + Math.random() * (isScattering ? 16 : 10);
      p.vx[i] = (Math.random() - 0.5) * (isScattering ? 0.09 : 0.04);
      p.vy[i] = -0.03 - Math.random() * (isScattering ? 0.06 : 0.03);
      p.vz[i] = (Math.random() - 0.5) * (isScattering ? 0.09 : 0.04);
    }

    const maxAge = isScattering ? 1.85 : 1.35;
    for (let i = 0; i < p.count; i++) {
      if (p.age[i] >= maxAge) {
        p.alpha[i] = 0;
        continue;
      }
      p.age[i] += delta;

      p.positions[i * 3] += p.vx[i] * delta;
      p.positions[i * 3 + 1] += p.vy[i] * delta;
      p.positions[i * 3 + 2] += p.vz[i] * delta;

      const progress = p.age[i] / maxAge;
      const life = Math.max(0, 1 - progress);
      const twinkle = 0.72 + 0.28 * Math.sin(p.age[i] * 18.0 + p.seed[i] * 25.0);
      p.alpha[i] = life * life * twinkle * (isScattering ? 0.95 : 0.45);
    }

    p.geometry.attributes.position.needsUpdate = true;
    p.geometry.attributes.aAlpha.needsUpdate = true;
    p.geometry.attributes.aSize.needsUpdate = true;
    p.geometry.attributes.aSeed.needsUpdate = true;
  });

  return (
    <points
      geometry={particles.geometry}
      material={particles.material}
      frustumCulled={false}
      visible={!reducedMotion}
    />
  );
}
