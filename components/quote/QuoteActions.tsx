"use client";

import { ArrowRight, RotateCcw } from "lucide-react";
import type { Quote } from "@/data/quotes";
import { ShareButton } from "@/components/share/ShareButton";

export interface QuoteActionsProps {
  quote: Quote;
  onNextQuote: () => void;
  isTransitioning: boolean;
  reachedEnd?: boolean;
  seenCount?: number;
  totalCount?: number;
  onResetQuotes?: () => void;
}

export function QuoteActions({
  quote,
  onNextQuote,
  isTransitioning,
  reachedEnd = false,
  seenCount = 1,
  totalCount = 8,
  onResetQuotes,
}: QuoteActionsProps) {
  const handlePrimaryClick = reachedEnd && onResetQuotes ? onResetQuotes : onNextQuote;
  const safeSeenCount = Math.max(1, seenCount);

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
            ? "He has exhausted his grievances. Begin anew."
            : "Unfortunately, he has more to say"}
        </span>
        {reachedEnd ? (
          <RotateCcw size={16} strokeWidth={1.4} aria-hidden="true" />
        ) : (
          <ArrowRight size={17} strokeWidth={1.3} aria-hidden="true" />
        )}
      </button>

      <div className="quote-actions-secondary">
        <ShareButton key={quote.id} quote={quote} disabled={isTransitioning} />
        {totalCount > 0 && (
          <span
            className="quote-counter"
            aria-live="polite"
            title={reachedEnd ? "All grievances heard" : `${safeSeenCount} of ${totalCount} grievances heard`}
          >
            <span className={`quote-counter-dot ${reachedEnd ? "is-complete" : ""}`} aria-hidden="true" />
            <span>
              {reachedEnd ? `All ${totalCount} grievances heard` : `${safeSeenCount} of ${totalCount} heard`}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
