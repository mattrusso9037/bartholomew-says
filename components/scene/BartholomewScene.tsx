"use client";

import { Component, useEffect, useState, useSyncExternalStore, Suspense, useRef, useMemo, type ReactNode } from "react";
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
  reducedMotion?: boolean;
  onInteract?: () => void;
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

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("The decorative diorama could not load:", error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function BartholomewScene({
  reactionTrigger,
  reducedMotion = false,
  onInteract,
}: SceneProps) {
  const [visible, setVisible] = useState(true);
  const compact = useSyncExternalStore(subscribeCompact, () => window.matchMedia(compactQuery).matches, () => false);
  const [phase, setPhase] = useState<CharacterPhase>("seated");
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
      <SceneBoundary>
        <Canvas
          camera={{ fov: 34, position: [0, 2.55, 6.7], near: 0.1, far: 20 }}
          dpr={compact ? [1, 1.25] : [1, 1.65]}
          shadows={{ type: PCFShadowMap }}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power", toneMapping: ACESFilmicToneMapping }}
          frameloop={!visible ? "never" : reducedMotion ? "demand" : "always"}
          onCreated={({ camera, gl }) => { camera.lookAt(0, 0.92, 0); gl.setClearColor(0x000000, 0); gl.toneMappingExposure = 1.05; }}
          fallback={<span />}
        >
          <CameraController mode={mode} reducedMotion={reducedMotion} compact={compact} />
          <Suspense fallback={null}>
            <group rotation={[0, -0.22, 0]}>
              <SceneLighting reducedMotion={reducedMotion} compact={compact} />
              <Books />
              <Plants reducedMotion={reducedMotion} compact={compact} />
              <Bartholomew
                compact={compact}
                onPhaseChange={setPhase}
                reactionTrigger={reactionTrigger}
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
