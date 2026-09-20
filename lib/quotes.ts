import { quotes, type Quote } from "@/data/quotes";

export const SEEN_QUOTES_STORAGE_KEY = "bartholomew_seen_quotes";

/**
 * Returns a random quote from the dataset, optionally excluding a specific quote ID.
 */
export function getRandomQuote(excludeId?: number | string): Quote {
  if (quotes.length === 0) {
    throw new Error("No quotes available in dataset");
  }

  if (quotes.length === 1) {
    return quotes[0];
  }

  const eligibleQuotes = excludeId !== undefined
    ? quotes.filter((q) => q.id !== Number(excludeId) && q.slug !== excludeId)
    : quotes;

  const pool = eligibleQuotes.length > 0 ? eligibleQuotes : quotes;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Look up a quote by its numeric ID, canonical slug, legacy ID, or zero/one-based index.
 */
export function getQuoteById(id: number | string | null | undefined): Quote | undefined {
  if (id === null || id === undefined) return undefined;

  // Direct number lookup
  if (typeof id === "number") {
    return quotes.find((q) => q.id === id);
  }

  const normalized = id.trim().toLowerCase();
  if (!normalized) return undefined;

  // 1. Direct match on incremental numeric ID if input is an integer string
  const num = parseInt(normalized, 10);
  if (!Number.isNaN(num) && String(num) === normalized) {
    const directNumMatch = quotes.find((q) => q.id === num);
    if (directNumMatch) return directNumMatch;
    // Fallback: 0 index returns first quote
    if (num === 0 && quotes.length > 0) return quotes[0];
  }

  // 2. Match on canonical slug (e.g. "folly-of-mortals")
  const slugMatch = quotes.find((q) => q.slug?.toLowerCase() === normalized);
  if (slugMatch) return slugMatch;

  // 3. Match on legacy placeholder ID (e.g. "placeholder-1")
  const legacyMatch = quotes.find((q) => q.legacyId?.toLowerCase() === normalized);
  if (legacyMatch) return legacyMatch;

  return undefined;
}

/**
 * Retrieve the list of seen quote IDs (numbers) from localStorage.
 * Automatically migrates legacy string IDs if found in storage.
 */
export function getStoredSeenQuoteIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEEN_QUOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const validIds = new Set(quotes.map((q) => q.id));
      const resolvedNumbers: number[] = [];

      for (const item of parsed) {
        if (typeof item === "number" && validIds.has(item)) {
          if (!resolvedNumbers.includes(item)) resolvedNumbers.push(item);
        } else if (typeof item === "string") {
          const matched = getQuoteById(item);
          if (matched && !resolvedNumbers.includes(matched.id)) {
            resolvedNumbers.push(matched.id);
          }
        }
      }
      return resolvedNumbers;
    }
  } catch {
    // Gracefully handle storage disabled, private mode, or corrupt JSON
  }
  return [];
}

/**
 * Mark a quote as seen in localStorage and return the updated seen array.
 */
export function markQuoteAsSeen(quoteId: number): number[] {
  const current = getStoredSeenQuoteIds();
  if (current.includes(quoteId)) {
    return current;
  }
  const updated = [...current, quoteId];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SEEN_QUOTES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Fail silently if localStorage quota is exceeded or restricted
    }
  }
  return updated;
}

/**
 * Reset seen quotes in localStorage.
 */
export function resetStoredSeenQuotes(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(SEEN_QUOTES_STORAGE_KEY);
    } catch {
      // Fail silently
    }
  }
}

/**
 * Select the next quote prioritizing unseen quotes so no duplicates appear
 * until the user has discovered every quote in the collection.
 * When all quotes have been seen, seamlessly starts a fresh shuffled round,
 * ensuring the immediate previous quote is never repeated back-to-back.
 */
export function getNextQuote({
  currentId,
  seenIds = [],
}: {
  currentId?: number;
  seenIds?: number[];
}): { quote: Quote; reachedEnd: boolean; resetOccurred: boolean } {
  if (quotes.length === 0) {
    throw new Error("No quotes available in dataset");
  }

  const seenSet = new Set(seenIds);
  const unseen = quotes.filter((q) => !seenSet.has(q.id));

  // If there are still unseen quotes available in the current cycle
  if (unseen.length > 0) {
    const pool = unseen.length > 1 && currentId !== undefined
      ? unseen.filter((q) => q.id !== currentId)
      : unseen;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    const willHaveSeenCount = seenSet.has(selected.id) ? seenSet.size : seenSet.size + 1;
    return {
      quote: selected,
      reachedEnd: willHaveSeenCount >= quotes.length,
      resetOccurred: false,
    };
  }

  // All quotes have been seen: seamlessly reshuffle for the next cycle
  const candidates = currentId !== undefined
    ? quotes.filter((q) => q.id !== currentId)
    : quotes;
  const pool = candidates.length > 0 ? candidates : quotes;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  return {
    quote: selected,
    reachedEnd: true,
    resetOccurred: true,
  };
}
