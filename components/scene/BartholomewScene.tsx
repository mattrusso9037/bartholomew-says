"use client";

import { Component, useEffect, useState, useSyncExternalStore, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import { SceneLighting } from "./SceneLighting";
import { Bartholomew } from "./Bartholomew";
import { Books } from "./Books";
import { Plants } from "./Plants";
import { Moths } from "./Moths";
import { Atmosphere } from "./Atmosphere";

interface SceneProps { reactionTrigger: number; reducedMotion?: boolean }
const compactQuery = "(max-width: 760px)";
function subscribeCompact(callback: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("The decorative diorama could not load:", error); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function BartholomewScene({ reactionTrigger, reducedMotion = false }: SceneProps) {
  const [visible, setVisible] = useState(true);
  const compact = useSyncExternalStore(subscribeCompact, () => window.matchMedia(compactQuery).matches, () => false);
  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  return (
    <div className="diorama" aria-hidden="true">
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
          <Suspense fallback={null}>
            <group rotation={[0, -0.22, 0]}>
              <SceneLighting reducedMotion={reducedMotion} compact={compact} />
              <Books />
              <Plants reducedMotion={reducedMotion} compact={compact} />
              <Bartholomew reactionTrigger={reactionTrigger} reducedMotion={reducedMotion} />
              <Moths reactionTrigger={reactionTrigger} reducedMotion={reducedMotion} compact={compact} />
              <Atmosphere compact={compact} reducedMotion={reducedMotion} />
            </group>
          </Suspense>
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
