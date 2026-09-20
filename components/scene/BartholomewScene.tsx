"use client";

import { Component, useCallback, useEffect, useState, useSyncExternalStore, Suspense, useRef, useMemo, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ACESFilmicToneMapping, PCFShadowMap, Vector3 } from "three";
import { SceneLighting } from "./SceneLighting";
import { Bartholomew } from "./Bartholomew";
import { Books } from "./Books";
import { Plants } from "./Plants";
import { Moths } from "./Moths";
import { Atmosphere } from "./Atmosphere";
import type { CharacterPhase } from "@/lib/character-motion";

interface SceneProps {
  reactionTrigger: number;
  sleepTrigger?: number;
  reducedMotion?: boolean;
  onInteract?: () => void;
  onReady?: () => void;
  onUnavailable?: () => void;
  onPhaseChange?: (phase: CharacterPhase) => void;
}
const compactQuery = "(max-width: 760px)";
function subscribeCompact(callback: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/**
 * Dynamically adjusts camera framing between sitting and sleeping modes.
 * When sleeping, smoothly dollies closer and lower to focus intimately on Bartholomew
 * resting on the grimoire, while framing the candles and atmospheric glow.
 */
function CameraController({
  mode,
  reducedMotion,
  compact,
}: {
  mode: "sitting" | "sleeping";
  reducedMotion: boolean;
  compact: boolean;
}) {
  const { camera } = useThree();
  const currentPos = useRef(new Vector3(0, 2.55, 6.7));
  const currentLookAt = useRef(new Vector3(0, 0.92, 0));

  const { targetPos, targetLookAt } = useMemo(() => {
    if (mode === "sleeping") {
      return compact
        ? {
            targetPos: new Vector3(0, 1.95, 6.6),
            targetLookAt: new Vector3(0, 0.96, 0),
          }
        : {
            targetPos: new Vector3(0.1, 1.95, 6.25),
            targetLookAt: new Vector3(0, 0.98, 0),
          };
    }
    return compact
      ? {
          targetPos: new Vector3(0, 2.08, 6.9),
          targetLookAt: new Vector3(0, 1.05, 0),
        }
      : {
          targetPos: new Vector3(0.1, 2.05, 6.45),
          targetLookAt: new Vector3(0, 1.07, 0),
        };
  }, [mode, compact]);

  useFrame((_, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    if (reducedMotion) {
      currentPos.current.copy(targetPos);
      currentLookAt.current.copy(targetLookAt);
    } else {
      currentPos.current.lerp(targetPos, 1 - Math.exp(-0.65 * clampedDelta));
      currentLookAt.current.lerp(targetLookAt, 1 - Math.exp(-0.65 * clampedDelta));
    }
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

function SceneReady({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => onReady?.()); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [onReady]);
  return null;
}

class SceneBoundary extends Component<{ children: ReactNode; onUnavailable?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("The decorative diorama could not load:", error); this.props.onUnavailable?.(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function BartholomewScene({
  reactionTrigger,
  sleepTrigger = 0,
  reducedMotion = false,
  onInteract,
  onReady,
  onUnavailable,
  onPhaseChange,
}: SceneProps) {
  const [visible, setVisible] = useState(true);
  const compact = useSyncExternalStore(subscribeCompact, () => window.matchMedia(compactQuery).matches, () => false);
  const [phase, setPhase] = useState<CharacterPhase>("seated");
  const handlePhase = useCallback((next: CharacterPhase) => { setPhase(next); onPhaseChange?.(next); }, [onPhaseChange]);
  const resting = phase === "curling" || phase === "sleeping" || phase === "waking";
  const mode = resting ? "sleeping" : "sitting";

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className="diorama" aria-hidden="true" data-character-phase={phase}>
      <SceneBoundary onUnavailable={onUnavailable}>
        <Canvas
          camera={{ fov: 34, position: [0, 2.55, 6.7], near: 0.1, far: 20 }}
          dpr={compact ? 1 : [1, 1.5]}
          shadows={{ type: PCFShadowMap }}
          gl={{
            alpha: true,
            antialias: !compact,
            powerPreference: "high-performance",
            toneMapping: ACESFilmicToneMapping,
            preserveDrawingBuffer: false,
          }}
          frameloop={!visible ? "never" : reducedMotion ? "demand" : "always"}
          onCreated={({ camera, gl }) => {
            camera.lookAt(0, 0.92, 0);
            gl.setClearColor(0x000000, 0);
            gl.toneMappingExposure = 1.05;
            const canvas = gl.domElement;
            const handleContextLost = (event: Event) => {
              event.preventDefault();
              console.warn("WebGL context lost on device. Gracefully transitioning to ambient backdrop.");
              onUnavailable?.();
            };
            canvas.addEventListener("webglcontextlost", handleContextLost, { once: true });
          }}
          fallback={<SceneReady onReady={onUnavailable} />}
        >
          <CameraController mode={mode} reducedMotion={reducedMotion} compact={compact} />
          <Suspense fallback={null}>
            <SceneReady onReady={onReady} />
            <group rotation={[0, -0.22, 0]}>
              <SceneLighting reducedMotion={reducedMotion} compact={compact} />
              <Books />
              <Plants reducedMotion={reducedMotion} compact={compact} />
              <Bartholomew
                compact={compact}
                onPhaseChange={handlePhase}
                reactionTrigger={reactionTrigger}
                sleepTrigger={sleepTrigger}
                reducedMotion={reducedMotion}
                onInteract={onInteract}
              />
              <Moths reactionTrigger={reactionTrigger} reducedMotion={reducedMotion} compact={compact} />
              <Atmosphere compact={compact} reducedMotion={reducedMotion} />
            </group>
          </Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
