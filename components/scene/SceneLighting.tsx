"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  DoubleSide,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  ShaderMaterial,
  Vector2,
} from "three";

const flameVertexShader = `
  uniform float uTime;
  uniform float uWarmth;
  uniform float uFlicker;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float h = clamp(pos.y / 0.112, 0.0, 1.0);
    vHeight = h;

    // Convection wave: sway and flutter increases non-linearly with height
    float swayTime = uTime * 4.8;
    float wave = sin(swayTime - pos.y * 18.0) * 0.013;
    float jitter = (sin(uTime * 23.0) * 0.6 + sin(uTime * 41.0) * 0.4) * 0.0045;
    float swayX = (wave + jitter) * pow(h, 1.55);
    float swayZ = cos(swayTime * 0.85 - pos.y * 14.0) * 0.007 * pow(h, 1.75);

    pos.x += swayX;
    pos.z += swayZ;

    // Organic breathing and warmth expansion
    float stretch = 1.0 + uFlicker * 0.14 + uWarmth * 0.38;
    float girth = 1.0 + uWarmth * 0.28 - uFlicker * 0.04;

    pos.y *= stretch;
    pos.x *= girth;
    pos.z *= girth;

    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const flameFragmentShader = `
  uniform float uTime;
  uniform float uWarmth;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    float h = vHeight;
    float r = length(vPosition.xz);
    float normR = clamp(r / 0.022, 0.0, 1.0);

    // Thermodynamic natural flame color spectrum:
    vec3 blueRim   = vec3(0.12, 0.32, 0.98); // Complete combustion at oxygen-rich base
    vec3 deepAmber = vec3(1.00, 0.38, 0.04); // Outer mantle
    vec3 warmGold  = vec3(1.00, 0.78, 0.16); // Luminous mid body
    vec3 whiteCore = vec3(1.00, 0.98, 0.90); // Incandescent white hot center

    // Base blue zone: distinct at outer rim of lower 18% of flame
    float blueFactor = (1.0 - smoothstep(0.0, 0.18, h)) * smoothstep(0.002, 0.016, r) * 0.95;

    // Hot interior core (centered, mid-lower height)
    float coreFactor = (1.0 - smoothstep(0.0, 0.011, r)) * (1.0 - smoothstep(0.05, 0.82, h));

    // Vertical transition from amber to gold
    vec3 body = mix(deepAmber, warmGold, smoothstep(0.10, 0.62, h));
    body = mix(body, whiteCore, clamp(coreFactor * 1.5, 0.0, 1.0));
    body = mix(body, blueRim, blueFactor);

    // Alpha falloff
    float radialFalloff = 1.0 - smoothstep(0.35, 1.0, normR);
    float tipFalloff = 1.0 - smoothstep(0.88, 1.0, h);
    float alpha = clamp(radialFalloff * tipFalloff * (0.85 + coreFactor * 0.35), 0.0, 1.0);

    // Boost glow on warmth
    gl_FragColor = vec4(body * (1.15 + uWarmth * 0.45), alpha);
  }
`;

const flameCoreFragmentShader = `
  uniform float uTime;
  uniform float uWarmth;
  varying vec3 vPosition;
  varying float vHeight;

  void main() {
    float h = vHeight;
    float r = length(vPosition.xz);
    float normR = clamp(r / 0.014, 0.0, 1.0);

    vec3 intenseWhite = vec3(1.00, 0.99, 0.94);
    vec3 brightGold   = vec3(1.00, 0.88, 0.42);

    vec3 color = mix(intenseWhite, brightGold, smoothstep(0.0, 0.8, normR));
    float alpha = (1.0 - smoothstep(0.2, 1.0, normR)) * (1.0 - smoothstep(0.75, 1.0, h)) * (0.85 + uWarmth * 0.15);

    gl_FragColor = vec4(color * (1.2 + uWarmth * 0.3), clamp(alpha, 0.0, 1.0));
  }
`;

function Candle({
  position,
  height,
  reducedMotion,
  compact = false,
}: {
  position: [number, number, number];
  height: number;
  reducedMotion: boolean;
  compact?: boolean;
}) {
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

  const flameMesh = useRef<Mesh>(null);
  const coreMesh = useRef<Mesh>(null);

  const flameGeometry = useMemo(() => {
    const points = [
      [0.000, 0.000],
      [0.006, 0.004],
      [0.014, 0.014],
      [0.018, 0.030],
      [0.016, 0.052],
      [0.011, 0.076],
      [0.005, 0.096],
      [0.000, 0.112],
    ].map(([x, y]) => new Vector2(x, y));
    return new LatheGeometry(points, compact ? 16 : 28);
  }, [compact]);

  const coreGeometry = useMemo(() => {
    const points = [
      [0.000, 0.000],
      [0.004, 0.004],
      [0.009, 0.012],
      [0.011, 0.024],
      [0.009, 0.040],
      [0.006, 0.056],
      [0.002, 0.068],
      [0.000, 0.076],
    ].map(([x, y]) => new Vector2(x, y));
    return new LatheGeometry(points, compact ? 12 : 20);
  }, [compact]);

  const flameMaterial = useMemo(() => {
    if (compact) return null;
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWarmth: { value: 0 },
        uFlicker: { value: 0 },
      },
      vertexShader: flameVertexShader,
      fragmentShader: flameFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [compact]);

  const coreMaterial = useMemo(() => {
    if (compact) return null;
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWarmth: { value: 0 },
        uFlicker: { value: 0 },
      },
      vertexShader: flameVertexShader,
      fragmentShader: flameCoreFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [compact]);

  const mobileFlameMaterial = useMemo(() => {
    if (!compact) return null;
    return new MeshBasicMaterial({ color: "#ff9f28", toneMapped: false });
  }, [compact]);

  const mobileCoreMaterial = useMemo(() => {
    if (!compact) return null;
    return new MeshBasicMaterial({ color: "#fff0aa", toneMapped: false });
  }, [compact]);

  useEffect(() => () => {
    flameGeometry.dispose();
    coreGeometry.dispose();
    flameMaterial?.dispose();
    coreMaterial?.dispose();
    mobileFlameMaterial?.dispose();
    mobileCoreMaterial?.dispose();
    document.body.style.cursor = "auto";
  }, [flameGeometry, coreGeometry, flameMaterial, coreMaterial, mobileFlameMaterial, mobileCoreMaterial]);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    if (!reducedMotion) time.current += clampedDelta;
    const t = time.current;

    if (compact) {
      if (!reducedMotion && halo.current) {
        const flicker = Math.sin(t * 7.4) * 0.05;
        halo.current.scale.setScalar(0.042 * (1 + flicker));
      }
      return;
    }

    warmth.current = reducedMotion ? Number(hovered.current) : MathUtils.damp(warmth.current, Number(hovered.current), 5.5, clampedDelta);
    const flicker = reducedMotion ? 0 : Math.sin(t * 7.4) * 0.06 + Math.sin(t * 13.1) * 0.035;

    if (flameMesh.current) {
      const mat = flameMesh.current.material as ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uWarmth.value = warmth.current;
      mat.uniforms.uFlicker.value = reducedMotion ? 0 : flicker;
    }

    if (coreMesh.current) {
      const mat = coreMesh.current.material as ShaderMaterial;
      mat.uniforms.uTime.value = t;
      mat.uniforms.uWarmth.value = warmth.current;
      mat.uniforms.uFlicker.value = reducedMotion ? 0 : flicker;
    }

    if (halo.current) {
      halo.current.scale.setScalar(0.045 * (1 + warmth.current * 0.75 + flicker * 0.15));
      (halo.current.material as MeshBasicMaterial).opacity = 0.22 + warmth.current * 0.55 + flicker * 0.06;
    }
    if (light.current) {
      light.current.intensity = 1.7 + flicker * 2 + warmth.current * 7.8;
      light.current.distance = 3.8 + warmth.current * 4.0;
    }
  });

  return (
    <group position={position} name="Hover candle">
      {!compact && (
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
      )}
      <mesh castShadow={!compact} receiveShadow>
        <latheGeometry args={[holder, compact ? 16 : 24]} />
        <meshStandardMaterial color="#82704c" metalness={0.8} roughness={0.43} />
      </mesh>
      <mesh position={[0, 0.32 + height / 2, 0]} castShadow={!compact}>
        <cylinderGeometry args={[0.051, 0.057, height, compact ? 14 : 24]} />
        <meshStandardMaterial color="#d6c29a" roughness={0.92} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.sin(i * 2.4) * 0.05, 0.32 + height - 0.024 - (i % 3) * 0.031, Math.cos(i * 2.4) * 0.05]} scale={[0.01, 0.04 + (i % 3) * 0.028, 0.01]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#d3bf99" roughness={0.9} />
        </mesh>
      ))}

      {/* Carbonized candle wick with glowing hot ember at tip */}
      <mesh position={[0, height + 0.335, 0]}>
        <cylinderGeometry args={[0.0035, 0.0035, 0.035, 6]} />
        <meshBasicMaterial color="#221810" />
      </mesh>
      <mesh position={[0, height + 0.353, 0]}>
        <sphereGeometry args={[0.0038, 8, 8]} />
        <meshBasicMaterial color="#ff3800" toneMapped={false} />
      </mesh>

      {/* Photorealistic teardrop flame with combustion zones (desktop shaders or mobile basic glow) */}
      <group position={[0, height + 0.351, 0]}>
        <mesh ref={flameMesh} geometry={flameGeometry} material={compact ? mobileFlameMaterial! : flameMaterial!} />
        <mesh ref={coreMesh} geometry={coreGeometry} material={compact ? mobileCoreMaterial! : coreMaterial!} position={[0, 0.002, 0]} />
        {/* Radiant atmospheric warm amber halo */}
        <mesh ref={halo} position={[0, 0.048, 0]}>
          <sphereGeometry args={[1, compact ? 12 : 16, compact ? 8 : 12]} />
          <meshBasicMaterial color="#ff9222" transparent opacity={0.24} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>

      {!compact && (
        <pointLight ref={light} position={[0, height + 0.40, 0]} color="#ffb765" intensity={1.8} distance={3.8} decay={2} />
      )}
    </group>
  );
}

export function SceneLighting({ reducedMotion = false, compact = false }: { reducedMotion?: boolean; compact?: boolean }) {
  return (
    <group name="Moonlight and candlelight">
      <hemisphereLight args={["#c0cfd6", "#514430", compact ? 1.35 : 1.05]} />
      <directionalLight
        position={[-3, 5, 3]}
        color="#c6dceb"
        intensity={compact ? 2.2 : 2.05}
        castShadow={!compact}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2.7}
        shadow-camera-right={2.7}
        shadow-camera-top={3.5}
        shadow-camera-bottom={-1.5}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-normalBias={0.025}
        shadow-bias={-0.0001}
        shadow-radius={3}
      />
      <directionalLight position={[0, 1.8, 4]} color="#e5d9bc" intensity={compact ? 0.75 : 0.5} />
      <directionalLight position={[2, 3, -3]} color="#b6cde0" intensity={compact ? 1.3 : 1.7} />
      <Candle position={[-1.19, 0, 0.05]} height={0.38} reducedMotion={reducedMotion} compact={compact} />
      <Candle position={[1.07, 0, -0.35]} height={0.63} reducedMotion={reducedMotion} compact={compact} />
    </group>
  );
}
