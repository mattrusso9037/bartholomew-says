import { quotes, type Quote } from "@/data/quotes";

/**
 * Returns a random quote from the dataset, optionally excluding a specific quote ID
 * to guarantee that a new quote is selected on consecutive requests.
 */
export function getRandomQuote(excludeId?: string): Quote {
  if (quotes.length === 0) {
    throw new Error("No quotes available in dataset");
  }

  if (quotes.length === 1) {
    return quotes[0];
  }

  const eligibleQuotes = excludeId
    ? quotes.filter((q) => q.id !== excludeId)
    : quotes;

  const randomIndex = Math.floor(Math.random() * eligibleQuotes.length);
  return eligibleQuotes[randomIndex];
}

/**
 * Look up a quote by its ID.
 */
export function getQuoteById(id: string): Quote | undefined {
  return quotes.find((q) => q.id === id);
}
