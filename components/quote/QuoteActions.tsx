"use client";

import { ArrowRight } from "lucide-react";
import type { Quote } from "@/data/quotes";
import { ShareButton } from "@/components/share/ShareButton";

export function QuoteActions({ quote, onNextQuote, isTransitioning }: {
  quote: Quote; onNextQuote: () => void; isTransitioning: boolean;
}) {
  return (
    <div className="quote-actions">
      <button type="button" onClick={onNextQuote} disabled={isTransitioning} aria-label="Show another quote from Bartholomew" className="next-quote">
        <span>Unfortunately, he has more to say</span><ArrowRight size={17} strokeWidth={1.3} aria-hidden="true" />
      </button>
      <ShareButton key={quote.id} quote={quote} disabled={isTransitioning} />
    </div>
  );
}
