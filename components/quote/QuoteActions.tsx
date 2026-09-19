"use client";

import { Sparkles } from "lucide-react";
import type { Quote } from "@/data/quotes";
import { ShareButton } from "@/components/share/ShareButton";

interface QuoteActionsProps {
  quote: Quote;
  onNextQuote: () => void;
  isTransitioning: boolean;
}

export function QuoteActions({
  quote,
  onNextQuote,
  isTransitioning,
}: QuoteActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
      {/* Primary Action: Another Quote */}
      <button
        type="button"
        onClick={onNextQuote}
        disabled={isTransitioning}
        aria-label="Show another quote from Bartholomew"
        className="btn-gothic-primary group relative px-5 py-3 rounded-sm text-xs sm:text-sm font-medium tracking-wide uppercase text-[#f2ede4] flex items-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Sparkles
          className={`w-3.5 h-3.5 text-[#c5a059] transition-transform duration-500 ${
            isTransitioning ? "rotate-180 scale-110" : "group-hover:rotate-45"
          }`}
          aria-hidden="true"
        />
        <span className="font-sans font-medium tracking-wider">
          Unfortunately, he has more to say
        </span>
      </button>

      {/* Secondary Action: Share */}
      <ShareButton quote={quote} />
    </div>
  );
}
