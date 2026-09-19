import type { Quote } from "@/data/quotes";

export function Attribution({ book }: { book: Quote["book"] }) {
  return <div className="attribution"><span aria-hidden="true" /><div><span className="attribution-label">Bartholomew, from</span><cite>{book}</cite></div></div>;
}
