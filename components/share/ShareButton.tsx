"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Check } from "lucide-react";
import type { Quote } from "@/data/quotes";

export interface ShareQuotePayload { title: string; text: string; quoteId: string; book: string; url: string }

export async function shareOrCopyQuote(payload: ShareQuotePayload): Promise<"shared" | "copied" | "cancelled"> {
  const shareText = `“${payload.text}” — from ${payload.book} | Bartholomew Says`;
  if (navigator.share) {
    try {
      await navigator.share({ title: payload.title, text: shareText, url: payload.url });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
    }
  }
  if (!navigator.clipboard) throw new Error("Clipboard unavailable");
  await navigator.clipboard.writeText(`${shareText}\n${payload.url}`);
  return "copied";
}

export function ShareButton({ quote, disabled = false }: { quote: Quote; disabled?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const handleShare = async () => {
    setBusy(true);
    try {
      const result = await shareOrCopyQuote({ title: "Bartholomew Says", text: quote.text, quoteId: quote.id, book: quote.book, url: window.location.href });
      setStatus(result === "cancelled" ? "idle" : result);
    } catch { setStatus("error"); }
    finally { setBusy(false); }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2800);
  };
  return (
    <div className="share-action">
      <button type="button" onClick={handleShare} disabled={disabled || busy} aria-label="Share this quote" className="share-quote">
        {status === "copied" || status === "shared" ? <Check size={13} aria-hidden="true" /> : <Share2 size={13} strokeWidth={1.4} aria-hidden="true" />}
        <span>{status === "copied" ? "Copied" : status === "shared" ? "Shared" : "Share this quote"}</span>
      </button>
      <span role="status" className={status === "error" ? "share-feedback" : "sr-only"}>{status === "error" ? "Couldn’t share. You can select and copy the quote." : status === "copied" ? "Quote copied to clipboard" : ""}</span>
    </div>
  );
}
