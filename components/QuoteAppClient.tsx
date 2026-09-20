"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Moon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
import { CathedralArrival } from "@/components/scene/CathedralArrival";
import type { CharacterPhase } from "@/lib/character-motion";

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

export function QuoteAppClient({ initialQuote }: { initialQuote?: Quote }) {
  const [currentQuote, setCurrentQuote] = useState<Quote>(initialQuote ?? quotes[0]);
  const [seenIds, setSeenIds] = useState<number[]>(initialQuote ? [initialQuote.id] : []);
  const [reactionTrigger, setReactionTrigger] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneUnavailable, setSceneUnavailable] = useState(false);
  const [backdropReady, setBackdropReady] = useState(false);
  const [arrivalDone, setArrivalDone] = useState(false);
  const [entered, setEntered] = useState(false);
  const [sleepTrigger, setSleepTrigger] = useState(0);
  const [sleepPending, setSleepPending] = useState(false);
  const [characterPhase, setCharacterPhase] = useState<CharacterPhase>("seated");
  const prefersReducedMotion = usePrefersReducedMotion();
  const reducedMotion = prefersReducedMotion || paused;

  // Initialize quote based on deep link param or localStorage seen history
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const params = new URLSearchParams(window.location.search);
      const linkedParam = params.get("quote") || params.get("q");
      const linkedQuote = getQuoteById(linkedParam);
      const storedSeen = getStoredSeenQuoteIds();

      let targetQuote: Quote;
      if (linkedQuote) {
        targetQuote = linkedQuote;
      } else if (initialQuote) {
        targetQuote = initialQuote;
      } else if (storedSeen.length > 0 && storedSeen.length < quotes.length) {
        const next = getNextQuote({ seenIds: storedSeen });
        targetQuote = next.quote;
      } else {
        targetQuote = getRandomQuote();
      }

      const updatedSeen = markQuoteAsSeen(targetQuote.id);
      setSeenIds(updatedSeen);
      setCurrentQuote(targetQuote);
      syncUrlWithQuote(targetQuote.id);
    });

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
  }, [initialQuote]);

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
  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onSceneUnavailable = useCallback(() => setSceneUnavailable(true), []);
  const onBackdropReady = useCallback(() => setBackdropReady(true), []);
  const onArrivalComplete = useCallback(() => setArrivalDone(true), []);
  const onPhaseChange = useCallback((phase: CharacterPhase) => {
    setCharacterPhase(phase);
    if (phase === "curling" || phase === "sleeping") setSleepPending(false);
  }, []);
  const resting = characterPhase === "curling" || characterPhase === "sleeping" || characterPhase === "waking";
  const sleepLabel = characterPhase === "sleeping" ? "Dreaming peacefully" : characterPhase === "waking" ? "Waking gently…" : sleepPending || characterPhase === "curling" ? "Tucking in…" : "Tuck me in";
  const tuckIn = () => {
    if (!sceneReady || sleepPending || resting) return;
    setPaused(false);
    setSleepPending(true);
    setSleepTrigger(value => value + 1);
  };

  return (
    <>
      <AnimatePresence onExitComplete={() => setEntered(true)}>
        {!arrivalDone && <CathedralArrival key="arrival" ready={backdropReady && (sceneReady || sceneUnavailable)} reducedMotion={prefersReducedMotion} onComplete={onArrivalComplete} />}
      </AnimatePresence>
      <main className="cathedral" inert={!entered} aria-busy={!arrivalDone} data-motion={reducedMotion ? "still" : "animated"}>
        <div className="cathedral-backdrop" aria-hidden="true">
          <Image src="/backgrounds/gothic-chamber.jpg" alt="" fill preload sizes="100vw" className="cathedral-image" onLoad={onBackdropReady} onError={onBackdropReady} />
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
          <QuoteDisplay quote={currentQuote} reducedMotion={reducedMotion} onSettled={onQuoteSettled} />
          <QuoteActions
            quote={currentQuote}
            onNextQuote={handleNextQuote}
            isTransitioning={isTransitioning}
            reachedEnd={reachedEnd}
            onResetQuotes={handleResetQuotes}
          />
        </section>

        <BartholomewScene
          reactionTrigger={reactionTrigger}
          sleepTrigger={sleepTrigger}
          reducedMotion={reducedMotion}
          onInteract={reachedEnd ? handleResetQuotes : handleNextQuote}
          onReady={onSceneReady}
          onUnavailable={onSceneUnavailable}
          onPhaseChange={onPhaseChange}
        />
        <div className="character-caption">
          <span className="caption-rule" aria-hidden="true" />
          <p>Bartholomew</p>
          <span className="character-aside">Excellent company. By most accounts.</span>
          <motion.button type="button" className="tuck-in" onClick={tuckIn} disabled={!sceneReady || sleepPending || resting} whileHover={reducedMotion ? undefined : { y: -1 }} whileTap={reducedMotion ? undefined : { scale: .97 }}>
            <Moon size={13} strokeWidth={1.2} aria-hidden="true" />{sleepLabel}
          </motion.button>
          <span className="sr-only" role="status" aria-live="polite">{resting || sleepPending ? sleepLabel : ""}</span>
        </div>

        <footer className="colophon">
          <span>The Knight &amp; The Moth <i>Series</i></span>
        </footer>
      </main>
    </>
  );
}
