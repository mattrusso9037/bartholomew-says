"use client";

import { useEffect, useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneLighting } from "./SceneLighting";
import { Bartholomew } from "./Bartholomew";
import { Books } from "./Books";
import { Plants } from "./Plants";
import { Moths } from "./Moths";

interface BartholomewSceneProps {
  reactionTrigger: number;
  reducedMotion?: boolean;
}

function DioramaGroup({
  reactionTrigger,
  reducedMotion,
}: {
  reactionTrigger: number;
  reducedMotion: boolean;
}) {
  const [layoutState, setLayoutState] = useState<{
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
  }>({
    position: [1.2, -0.56, 0],
    rotation: [0.16, -0.36, 0],
    scale: 1.08,
  });

  useEffect(() => {
    function updateResponsiveLayout() {
      const width = window.innerWidth;
      if (width >= 1280) {
        // Large desktop: diorama comfortably on right side, grounded
        setLayoutState({
          position: [1.22, -0.56, 0],
          rotation: [0.16, -0.36, 0],
          scale: 1.08,
        });
      } else if (width >= 1024) {
        // Standard desktop
        setLayoutState({
          position: [1.08, -0.58, 0],
          rotation: [0.16, -0.32, 0],
          scale: 0.98,
        });
      } else if (width >= 640) {
        // Tablet: lower and right
        setLayoutState({
          position: [0.72, -0.82, -0.2],
          rotation: [0.18, -0.26, 0],
          scale: 0.85,
        });
      } else {
        // Mobile: anchored lower right, framing without overlap
        setLayoutState({
          position: [0.42, -1.2, -0.5],
          rotation: [0.2, -0.22, 0],
          scale: 0.7,
        });
      }
    }

    updateResponsiveLayout();
    window.addEventListener("resize", updateResponsiveLayout);
    return () => window.removeEventListener("resize", updateResponsiveLayout);
  }, []);

  return (
    <group
      position={layoutState.position}
      rotation={layoutState.rotation}
      scale={layoutState.scale}
    >
      <SceneLighting reducedMotion={reducedMotion} />
      <Books reactionTrigger={reactionTrigger} reducedMotion={reducedMotion} />
      <Plants reducedMotion={reducedMotion} />
      <Bartholomew
        reactionTrigger={reactionTrigger}
        reducedMotion={reducedMotion}
      />
      <Moths reactionTrigger={reactionTrigger} reducedMotion={reducedMotion} />
    </group>
  );
}

export default function BartholomewScene({
  reactionTrigger,
  reducedMotion = false,
}: BartholomewSceneProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Pause rendering when page/tab is hidden to preserve battery and GPU
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-10"
      aria-hidden="true"
    >
      <Canvas
        camera={{
          fov: 38,
          position: [0, 0.2, 4.3],
          near: 0.1,
          far: 20,
        }}
        dpr={[1, 1.75]} // Cap DPR for high visual quality and smooth frame rates
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        frameloop={isVisible ? "always" : "never"}
        className="w-full h-full pointer-events-auto"
      >
        <Suspense fallback={null}>
          <DioramaGroup
            reactionTrigger={reactionTrigger}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
