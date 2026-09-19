import type { Quote } from "@/data/quotes";

const BUY_LINKS: Record<Quote["book"], string> = {
  "The Knight and the Moth": "https://rachelgillig.com/the-knight-and-the-moth/",
  "The Knave and the Moon": "https://rachelgillig.com/the-knave-and-the-moon/",
};

export function Attribution({ book, chapter, page }: {
  book: Quote["book"];
  chapter?: number;
  page?: number;
}) {
  const buyUrl = BUY_LINKS[book];

  return (
    <div className="attribution">
      <span aria-hidden="true" />
      <div>
        <cite>{book}</cite>
        <div className="attribution-meta">
          {chapter != null && page != null && (
            <span className="attribution-location">Ch. {chapter}, p. {page}</span>
          )}
          <span className="attribution-author-line">
            <span className="attribution-by">by</span>
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="attribution-author"
              aria-label={`Buy ${book} by Rachel Gillig`}
            >
              Rachel Gillig
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
