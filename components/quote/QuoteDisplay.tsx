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
            hidden: { opacity: 0, y: reducedMotion ? 0 : 10, filter: reducedMotion ? "blur(0px)" : "blur(3px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            exit: { opacity: 0, y: reducedMotion ? 0 : -8, filter: reducedMotion ? "blur(0px)" : "blur(3px)" },
          }}
          transition={{ duration: reducedMotion ? 0.12 : 0.48, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={(definition) => { if (definition === "visible") onSettled?.(); }}
          className="quote-content"
        >
          <blockquote><p>“{quote.text}”</p></blockquote>
          <Attribution book={quote.book} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
