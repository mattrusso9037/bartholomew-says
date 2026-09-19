"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Quote } from "@/data/quotes";
import { Attribution } from "./Attribution";

export function QuoteDisplay({ quote, reducedMotion = false, onSettled }: {
  quote: Quote; reducedMotion?: boolean; onSettled?: () => void;
}) {
  return (
    <div className="quote-stage">
      <span className="quotation-mark" aria-hidden="true">“</span>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{quote.text} From {quote.book}.</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={quote.id}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0, y: reducedMotion ? 0 : 6 },
            visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? .12 : .65, delayChildren: reducedMotion ? 0 : .07, staggerChildren: reducedMotion ? 0 : .012 } },
            exit: { opacity: 0, y: reducedMotion ? 0 : -5, transition: { duration: reducedMotion ? .12 : .32 } },
          }}
          transition={{ duration: reducedMotion ? 0.12 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={(definition) => { if (definition === "visible") onSettled?.(); }}
          className="quote-content"
        >
          <blockquote aria-label={`${quote.text}`}><p aria-hidden="true">{`${quote.text}`.split(" ").map((word, index) => (
            <span key={`${quote.id}-${index}`}><motion.span className="quote-word" variants={{ hidden: { opacity: 0, y: reducedMotion ? 0 : 6 }, visible: { opacity: 1, y: 0 }, exit: { opacity: 0 } }} transition={{ duration: reducedMotion ? .12 : .65, ease: [.22, 1, .36, 1] }}>{word}</motion.span>{" "}</span>
          ))}</p></blockquote>
          <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: reducedMotion ? 0 : .28, duration: .65 } } }}><Attribution book={quote.book} chapter={quote.chapter} page={quote.page} /></motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
