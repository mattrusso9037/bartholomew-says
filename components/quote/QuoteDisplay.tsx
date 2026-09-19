"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Quote } from "@/data/quotes";
import { Attribution } from "./Attribution";

interface QuoteDisplayProps {
  quote: Quote;
  reducedMotion?: boolean;
}

export function QuoteDisplay({
  quote,
  reducedMotion = false,
}: QuoteDisplayProps) {
  return (
    <div className="relative min-h-[220px] sm:min-h-[260px] md:min-h-[300px] flex flex-col justify-center">
      {/* Decorative Gothic Opening Quote Mark */}
      <span
        className="font-serif select-none pointer-events-none text-6xl sm:text-7xl md:text-8xl text-[#c5a059]/20 absolute -top-8 -left-4 sm:-left-8 leading-none"
        aria-hidden="true"
      >
        “
      </span>

      <AnimatePresence mode="wait">
        <motion.div
          key={quote.id}
          initial={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 12, filter: "blur(6px)" }
          }
          animate={
            reducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, filter: "blur(0px)" }
          }
          exit={
            reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: -10, filter: "blur(5px)" }
          }
          transition={{
            duration: reducedMotion ? 0.2 : 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex flex-col gap-6"
        >
          {/* Main Quote Text */}
          <blockquote className="relative z-10">
            <p className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] leading-[1.28] tracking-[-0.01em] text-[#f4efe6] text-shadow-gothic font-normal">
              “{quote.text}”
            </p>
          </blockquote>

          {/* Book Attribution */}
          <Attribution book={quote.book} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
