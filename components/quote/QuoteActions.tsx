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
  reachedEnd = false,
  onResetQuotes,
}: QuoteActionsProps) {
  const handlePrimaryClick = reachedEnd && onResetQuotes ? onResetQuotes : onNextQuote;

  return (
    <div className="quote-actions">
      <button
        type="button"
        onClick={handlePrimaryClick}
        disabled={isTransitioning}
        aria-label={
          reachedEnd
            ? "Reset and hear Bartholomew's grievances from the beginning"
            : "Show another quote from Bartholomew"
        }
        className={`next-quote ${reachedEnd ? "reset-quote" : ""}`}
      >
        <span>
          {reachedEnd
            ? "I've said all I have to say. For now."
            : "Oh, but I have more to say"}
        </span>
        {reachedEnd ? (
          <RotateCcw size={16} strokeWidth={1.4} aria-hidden="true" />
        ) : (
          <ArrowRight size={17} strokeWidth={1.3} aria-hidden="true" />
        )}
      </button>

      <div className="quote-actions-secondary">
        <ShareButton key={quote.id} quote={quote} disabled={isTransitioning} />
      </div>
    </div>
  );
}
