"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Moon, Pause, Play } from "lucide-react";
import { quotes, type Quote } from "@/data/quotes";
import { getRandomQuote } from "@/lib/quotes";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { QuoteDisplay } from "@/components/quote/QuoteDisplay";
import { QuoteActions } from "@/components/quote/QuoteActions";

const BartholomewScene = dynamic(() => import("@/components/scene/BartholomewScene"), { ssr: false, loading: () => null });

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotes[0]);
  const [reactionTrigger, setReactionTrigger] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const reducedMotion = prefersReducedMotion || paused;

  useEffect(() => {
    const handle = requestAnimationFrame(() => setCurrentQuote(getRandomQuote()));
    return () => cancelAnimationFrame(handle);
  }, []);

  const handleNextQuote = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setReactionTrigger((prev) => prev + 1);
    setCurrentQuote((prev) => getRandomQuote(prev.id));
  };
  const onQuoteSettled = useCallback(() => setIsTransitioning(false), []);

  return (
    <main className="cathedral" data-motion={reducedMotion ? "still" : "animated"}>
      <div className="cathedral-backdrop" aria-hidden="true">
        <Image src="/backgrounds/gothic-chamber.jpg" alt="" fill preload sizes="100vw" className="cathedral-image" />
      </div>
      <div className="cathedral-shade" aria-hidden="true" />
      <div className="cathedral-haze" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <div className="page-frame" aria-hidden="true" />

      <header className="masthead">
        <div className="brand">
          <span className="brand-seal" aria-hidden="true"><Moon size={21} strokeWidth={1} /></span>
          <div>
            <h1>Bartholomew <em>Says</em></h1>
            <p>An unnecessarily dramatic collection of wisdom</p>
          </div>
        </div>
        <span className="masthead-note">A quiet corner of the cathedral</span>
      </header>

      <section className="quote-section" aria-label="Current quote">
        <div className="eyebrow"><span /> Stone wings. Strong opinions.</div>
        <QuoteDisplay quote={currentQuote} reducedMotion={reducedMotion} onSettled={onQuoteSettled} />
        <QuoteActions quote={currentQuote} onNextQuote={handleNextQuote} isTransitioning={isTransitioning} />
      </section>

      <BartholomewScene
        reactionTrigger={reactionTrigger}
        reducedMotion={reducedMotion}
        onInteract={handleNextQuote}
      />
      <div className="character-caption" aria-hidden="true">
        <span className="caption-rule" />
        <p>Bartholomew</p>
        <span>Excellent company. Allegedly.</span>
      </div>

      <footer className="colophon">
        <span>The Knight &amp; The Moth <i>Series</i></span>
        <span className="colophon-aside">“silence is preferable to nonsense”</span>
        <button type="button" className="motion-toggle" aria-label={paused ? "Resume atmosphere" : "Pause atmosphere"} aria-pressed={paused} disabled={prefersReducedMotion} onClick={() => setPaused((value) => !value)}>
          {reducedMotion ? <Play size={12} /> : <Pause size={12} />}<span>{reducedMotion ? "Stillness" : "Atmosphere"}</span>
        </button>
      </footer>
    </main>
  );
}
