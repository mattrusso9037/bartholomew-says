"use client";

import type { Quote } from "@/data/quotes";

interface AttributionProps {
  book: Quote["book"];
}

export function Attribution({ book }: AttributionProps) {
  return (
    <div className="flex items-center gap-3 tracking-wide">
      <span className="h-[1px] w-7 bg-[#c5a059]/40" aria-hidden="true" />
      <cite className="font-serif italic not-italic text-lg sm:text-xl text-[#dfb96c] tracking-normal">
        {book}
      </cite>
    </div>
  );
}
