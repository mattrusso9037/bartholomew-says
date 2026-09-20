"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import type { Quote } from "@/data/quotes";
import { ShareButton } from "@/components/share/ShareButton";

export interface QuoteActionsProps {
  quote: Quote;
  onNextQuote: () => void;
  isTransitioning: boolean;
  reachedEnd?: boolean;
  onResetQuotes?: () => void;
}

export function QuoteActions({
  quote,
  onNextQuote,
  isTransitioning,
}: QuoteActionsProps) {
  return (
    <div className="quote-actions">
      <button
        type="button"
        onClick={onNextQuote}
        disabled={isTransitioning}
        aria-label="Show another quote from Bartholomew"
        className="next-quote"
      >
        <span>Oh, but I have more to say</span>
        <ArrowRight size={17} strokeWidth={1.3} aria-hidden="true" />
      </button>

      <div className="quote-actions-secondary">
        <ShareButton key={quote.id} quote={quote} disabled={isTransitioning} />
      </div>
    </div>
  );
}
