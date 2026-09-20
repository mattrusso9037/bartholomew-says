"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/** Lightweight HTML/SVG remains visible while the heavier WebGL assets load. */
export function CathedralArrival({ ready, reducedMotion, onComplete }: {
  ready: boolean; reducedMotion: boolean; onComplete: () => void;
}) {
  const started = useRef(0);
  const [progress, setProgress] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const progressRef = useRef(0);
  useEffect(() => {
    started.current = performance.now();
    let frame = 0;
    let last = started.current;
    const tick = (now: number) => {
      const delta = Math.min(64, now - last) / 1000;
      last = now;
      const completing = ready || timedOut;
      const target = completing ? 100 : 95;
      // 0 to 95 is deliberately independent of byte size. This makes the
      // reveal feel consistent on fast and slow connections alike. Once the
      // scene is ready, finish the remaining distance promptly even when it
      // became ready before the simulated 95% hold point.
      const rate = reducedMotion ? 1000 : completing ? 72 : 18;
      const next = Math.min(target, progressRef.current + rate * delta);
      progressRef.current = next;
      setProgress(next);
      if (next < 100) frame = window.requestAnimationFrame(tick);
      else onComplete();
    };
    frame = window.requestAnimationFrame(tick);
    const timeout = window.setTimeout(() => setTimedOut(true), 12000);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timeout); };
  }, [onComplete, ready, reducedMotion, timedOut]);

  return (
    <motion.div className="cathedral-arrival" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.035 }} transition={{ duration: reducedMotion ? 0.15 : 0.85, ease: "easeInOut" }}>
      <div className="arrival-frame" aria-hidden="true" />
      <motion.div className="arrival-content" animate={{ scale: ready || timedOut ? 1.035 : 1 }} transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}>
        <div className="arrival-emblem" aria-hidden="true">
          <motion.div className="arrival-halo" animate={reducedMotion ? { opacity: 0.5 } : { opacity: [0.25, 0.65, 0.25], scale: [0.94, 1.04, 0.94] }} transition={reducedMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }} />
          <svg viewBox="0 0 180 240" fill="none" className="arrival-window">
            <path d="M20 223V112C20 67 53 33 90 12C127 33 160 67 160 112V223H20Z" stroke="currentColor" opacity=".2" />
            <path d="M31 218V114C31 75 58 43 90 24C122 43 149 75 149 114V218" stroke="currentColor" strokeWidth="1" opacity=".18" />
            <motion.path d="M31 218V114C31 75 58 43 90 24C122 43 149 75 149 114V218" stroke="currentColor" strokeWidth="1.2" pathLength={1} initial={false} animate={{ pathLength: progress / 100 }} transition={{ duration: reducedMotion ? 0 : 0.08, ease: "linear" }} />
            <path d="M44 219H136M90 25V49M31 164H50M130 164H149" stroke="currentColor" opacity=".35" />
            <motion.path d="M105 66A28 28 0 1 0 120 108A29 29 0 0 1 105 66Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity=".055" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: reducedMotion ? 0 : 0.3 }} />
            {[[57, 80], [126, 58], [68, 129], [119, 147], [44, 181], [134, 196]].map(([x, y], i) => (
              <motion.path key={i} d={`M${x - 3} ${y}h6M${x} ${y - 3}v6`} stroke="currentColor" strokeWidth=".8" animate={reducedMotion ? { opacity: .45 } : { opacity: [.12, .85, .12] }} transition={reducedMotion ? { duration: 0 } : { duration: 2.8, delay: i * .35, repeat: Infinity, ease: "easeInOut" }} />
            ))}
            <motion.g animate={reducedMotion ? {} : { y: [0, -5, 0] }} transition={reducedMotion ? { duration: 0 } : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
              <path d="M89 171C77 151 56 151 60 166C62 175 75 178 89 176C77 179 74 192 84 185L90 177M91 171C103 151 124 151 120 166C118 175 105 178 91 176C103 179 106 192 96 185L90 177" fill="currentColor" fillOpacity=".35" stroke="currentColor" strokeWidth=".7" />
              <path d="M90 169V181M89 170L85 164M91 170L95 164" stroke="currentColor" />
            </motion.g>
          </svg>
        </div>
        <p className="arrival-eyebrow">A quiet corner of the cathedral</p>
        <p className="arrival-title">A little moonlight.<br /><em>A moment of magic.</em></p>
        <p className="arrival-status" role="status" aria-live="polite">{progress >= 100 ? "The candles are lit." : progress >= 95 ? "Opening the cathedral…" : "Lighting the candles…"}</p>
      </motion.div>
    </motion.div>
  );
}
