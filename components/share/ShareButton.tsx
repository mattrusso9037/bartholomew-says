"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Check } from "lucide-react";
import type { Quote } from "@/data/quotes";

export interface ShareQuotePayload { title: string; text: string; quoteId: number | string; book: string; url: string }

export interface ShareOptions {
  isMobile?: boolean;
}

export function isMobileOrTablet(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  const platform = (navigator as unknown as { platform?: string }).platform || "";
  const maxTouchPoints = typeof navigator.maxTouchPoints === "number" ? navigator.maxTouchPoints : 0;

  // 1. Mobile and tablet user agents (phones, iPads, Android tablets)
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua)) {
    return true;
  }

  // 2. iPad on iPadOS 13+ (reports as Macintosh / MacIntel in userAgent, but has touch points)
  if ((/Macintosh/i.test(ua) || platform === "MacIntel") && maxTouchPoints > 1) {
    return true;
  }

  // 3. User agent client hints API if supported
  const navAny = navigator as unknown as { userAgentData?: { mobile?: boolean } };
  if (navAny.userAgentData?.mobile) {
    return true;
  }

  // 4. Coarse pointer (touchscreen device) without fine pointer
  if (
    typeof window.matchMedia === "function" &&
    maxTouchPoints > 0 &&
    window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(pointer: fine)").matches
  ) {
    return true;
  }

  return false;
}

export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }
  if (typeof document !== "undefined") {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) return;
    } catch {
      document.body.removeChild(textArea);
    }
  }
  throw new Error("Clipboard unavailable");
}

export async function shareOrCopyQuote(
  payload: ShareQuotePayload,
  options?: ShareOptions
): Promise<"shared" | "copied" | "cancelled"> {
  const allowShare = options?.isMobile ?? isMobileOrTablet();
  if (allowShare && typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: payload.title, url: payload.url });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
    }
  }
  await copyToClipboard(payload.url);
  return "copied";
}

export function ShareButton({ quote, disabled = false }: { quote: Quote; disabled?: boolean }) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const handleShare = async () => {
    setBusy(true);
    const canonicalUrl = typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?quote=${encodeURIComponent(String(quote.id))}`
      : "";
    try {
      const result = await shareOrCopyQuote({
        title: "Bartholomew Says",
        text: quote.text,
        quoteId: quote.id,
        book: quote.book,
        url: canonicalUrl,
      });
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
      <span role="status" className={status === "error" ? "share-feedback" : "sr-only"}>
        {status === "error"
          ? "Couldn’t share. You can select and copy the quote."
          : status === "copied"
          ? "Quote copied to clipboard"
          : status === "shared"
          ? "Quote shared"
          : ""}
      </span>
    </div>
  );
}
