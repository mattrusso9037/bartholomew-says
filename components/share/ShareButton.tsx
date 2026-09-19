"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { Quote } from "@/data/quotes";

interface ShareButtonProps {
  quote: Quote;
}

export interface ShareQuotePayload {
  title: string;
  text: string;
  quoteId: string;
  book: string;
  url: string;
}

/**
 * Dispatches quote sharing via Web Share API or falls back to clipboard copying.
 * Structured to cleanly accept a future `cardImageUrl` when server-generated
 * social cards are implemented.
 */
export async function shareOrCopyQuote(payload: ShareQuotePayload): Promise<"shared" | "copied"> {
  const shareText = `“${payload.text}” — from ${payload.book} | Bartholomew Says`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: shareText,
        url: payload.url,
      });
      return "shared";
    } catch (err: unknown) {
      // User aborted share sheet, or Web Share failed; fallback to clipboard if not aborted
      if (err instanceof Error && err.name === "AbortError") {
        return "shared";
      }
    }
  }

  // Fallback to Clipboard API
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(`${shareText}\n${payload.url}`);
    return "copied";
  }

  return "copied";
}

export function ShareButton({ quote }: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared">("idle");

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const payload: ShareQuotePayload = {
      title: "Bartholomew Says",
      text: quote.text,
      quoteId: quote.id,
      book: quote.book,
      url,
    };

    const result = await shareOrCopyQuote(payload);
    setStatus(result);

    setTimeout(() => {
      setStatus("idle");
    }, 2200);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share this quote"
        className="btn-gothic-secondary px-4 py-2.5 rounded-sm text-xs sm:text-sm tracking-wider uppercase font-medium text-[#c9c0b1] flex items-center gap-2 cursor-pointer focus:outline-none"
      >
        {status === "copied" ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#c5a059]" />
            <span className="text-[#dfb96c]">Copied</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5 text-[#c5a059]" />
            <span>Share this quote</span>
          </>
        )}
      </button>

      {/* Temporary Feedback Notification */}
      {status === "copied" && (
        <span
          role="status"
          className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#12141a] border border-[#c5a059]/40 text-[#f2ede4] text-xs font-sans rounded shadow-lg whitespace-nowrap animate-fade-in"
        >
          Copied to clipboard
        </span>
      )}
    </div>
  );
}
