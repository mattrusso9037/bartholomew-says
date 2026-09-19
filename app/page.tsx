"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { quotes, type Quote } from "@/data/quotes";
import { getRandomQuote } from "@/lib/quotes";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { QuoteDisplay } from "@/components/quote/QuoteDisplay";
import { QuoteActions } from "@/components/quote/QuoteActions";

// Dynamically import the 3D diorama with SSR disabled for optimal loading and zero hydration errors
const BartholomewScene = dynamic(
  () => import("@/components/scene/BartholomewScene"),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotes[0]);
  const [reactionTrigger, setReactionTrigger] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // On client mount, select a random quote after paint
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setCurrentQuote(getRandomQuote());
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const handleNextQuote = () => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    // Fire the reaction trigger for Bartholomew, moths, and books
    setReactionTrigger((prev) => prev + 1);

    // Switch quote halfway through the transition for smooth cross-fading
    setTimeout(() => {
      setCurrentQuote((prev) => getRandomQuote(prev.id));
    }, 320);

    // Release button lockout after full transition completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 680);
  };

  return (
    <main className="relative w-full h-screen min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-16 select-none">
      {/* ============================================================ */}
      {/* 2D CINEMATIC GOTHIC BACKDROP & ATMOSPHERE */}
      {/* ============================================================ */}
      <div className="absolute inset-0 -z-30 overflow-hidden pointer-events-none">
        <Image
          src="/backgrounds/gothic-chamber.jpg"
          alt="Ancient moonlit gothic chamber"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 filter brightness-75 contrast-110"
        />
      </div>

      {/* Atmospheric lighting gradient overlay: ensures high text readability on left side */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none bg-gradient-to-r from-[#0a0b0e]/95 via-[#0a0b0e]/75 to-transparent lg:w-3/4"
        aria-hidden="true"
      />

      {/* Radial vignette overlay */}
      <div
        className="absolute inset-0 -z-20 pointer-events-none gothic-vignette"
        aria-hidden="true"
      />

      {/* Subtle film grain */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none film-grain opacity-35"
        aria-hidden="true"
      />

      {/* ============================================================ */}
      {/* 3D FOREGROUND DIORAMA (R3F Canvas) */}
      {/* ============================================================ */}
      <BartholomewScene
        reactionTrigger={reactionTrigger}
        reducedMotion={reducedMotion}
      />

      {/* ============================================================ */}
      {/* DOM CONTENT (Elevated above canvas) */}
      {/* ============================================================ */}
      {/* Header / Branding */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-7xl mx-auto pointer-events-auto">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#c5a059]/80 shadow-[0_0_8px_#c5a059]"
              aria-hidden="true"
            />
            <h1 className="font-sans text-xs sm:text-sm tracking-[0.28em] uppercase text-[#e8dfcf] font-semibold text-shadow-subtle">
              Bartholomew Says
            </h1>
          </div>
          <span className="font-serif italic text-xs text-[#c5a059]/75 tracking-wider pl-4">
            An unnecessarily dramatic collection of wisdom
          </span>
        </div>
      </header>

      {/* Center Left: Main Quote & Interaction */}
      <section
        aria-label="Current Quote"
        className="relative z-20 w-full max-w-xl lg:max-w-2xl mx-auto lg:mx-0 my-auto flex flex-col justify-center gap-8 pointer-events-auto"
      >
        <QuoteDisplay quote={currentQuote} reducedMotion={reducedMotion} />
        <QuoteActions
          quote={currentQuote}
          onNextQuote={handleNextQuote}
          isTransitioning={isTransitioning}
        />
      </section>

      {/* Footer Utility */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto flex items-center justify-between text-xs text-[#c5a059]/60 font-sans tracking-widest uppercase pointer-events-auto">
        <span>The Knight & The Moth Series</span>
        <span className="font-serif italic lowercase tracking-normal text-[#c9c0b1]/60">
          “silence is preferable to nonsense”
        </span>
      </footer>
    </main>
  );
}
