"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Moon, Pause, Play } from "lucide-react";
import { quotes, type Quote } from "@/data/quotes";
import {
  getQuoteById,
  getNextQuote,
  getRandomQuote,
  getStoredSeenQuoteIds,
  markQuoteAsSeen,
  resetStoredSeenQuotes,
} from "@/lib/quotes";
import { usePrefersReducedMotion } from "@/lib/useReducedMotion";
import { QuoteDisplay } from "@/components/quote/QuoteDisplay";
import { QuoteActions } from "@/components/quote/QuoteActions";

const BartholomewScene = dynamic(() => import("@/components/scene/BartholomewScene"), { ssr: false, loading: () => null });

function syncUrlWithQuote(quoteId: number) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("quote", String(quoteId));
    url.searchParams.delete("q");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // Ignore URL errors
  }
}

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotes[0]);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [reactionTrigger, setReactionTrigger] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const reducedMotion = prefersReducedMotion || paused;

  // Initialize quote based on deep link param or localStorage seen history
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const linkedParam = params.get("quote") || params.get("q");
      const linkedQuote = getQuoteById(linkedParam);
      const storedSeen = getStoredSeenQuoteIds();

      let initialQuote: Quote;
      if (linkedQuote) {
        initialQuote = linkedQuote;
      } else if (storedSeen.length > 0 && storedSeen.length < quotes.length) {
        // Pick next unseen quote from stored history
        const next = getNextQuote({ seenIds: storedSeen });
        initialQuote = next.quote;
      } else if (storedSeen.length >= quotes.length) {
        // All seen already; pick any quote but preserve seen count
        initialQuote = getRandomQuote();
      } else {
        initialQuote = getRandomQuote();
      }

      const updatedSeen = markQuoteAsSeen(initialQuote.id);
      setSeenIds(updatedSeen);
      setCurrentQuote(initialQuote);
      syncUrlWithQuote(initialQuote.id);
    });

    // Sync on browser back/forward navigation
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const param = searchParams.get("quote") || searchParams.get("q");
      const matched = getQuoteById(param);
      if (matched) {
        const nextSeen = markQuoteAsSeen(matched.id);
        setSeenIds(nextSeen);
        setCurrentQuote(matched);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const reachedEnd = quotes.length > 0 && seenIds.length >= quotes.length;

  const handleNextQuote = useCallback(() => {
    if (isTransitioning) return;
    const next = getNextQuote({ currentId: currentQuote.id, seenIds });
    const updatedSeen = markQuoteAsSeen(next.quote.id);
    setSeenIds(updatedSeen);
    setIsTransitioning(true);
    setReactionTrigger((prev) => prev + 1);
    setCurrentQuote(next.quote);
    syncUrlWithQuote(next.quote.id);
  }, [isTransitioning, currentQuote.id, seenIds]);

  const handleResetQuotes = useCallback(() => {
    if (isTransitioning) return;
    resetStoredSeenQuotes();
    const next = getRandomQuote(currentQuote.id);
    const updatedSeen = markQuoteAsSeen(next.id);
    setSeenIds(updatedSeen);
    setIsTransitioning(true);
    setReactionTrigger((prev) => prev + 1);
    setCurrentQuote(next);
    syncUrlWithQuote(next.id);
  }, [isTransitioning, currentQuote.id]);

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
        <QuoteActions
          quote={currentQuote}
          onNextQuote={handleNextQuote}
          isTransitioning={isTransitioning}
          reachedEnd={reachedEnd}
          seenCount={seenIds.length}
          totalCount={quotes.length}
          onResetQuotes={handleResetQuotes}
        />
      </section>

      <BartholomewScene
        reactionTrigger={reactionTrigger}
        reducedMotion={reducedMotion}
        onInteract={reachedEnd ? handleResetQuotes : handleNextQuote}
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
