import type { Metadata } from "next";
import { getQuoteById } from "@/lib/quotes";
import { QuoteAppClient } from "@/components/QuoteAppClient";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const quoteParam = typeof params.quote === "string" ? params.quote : typeof params.q === "string" ? params.q : undefined;
  const quote = quoteParam ? getQuoteById(quoteParam) : null;

  if (quote) {
    const title = `“${quote.text}” — Bartholomew Says`;
    const location = quote.chapter != null && quote.page != null ? ` · Ch. ${quote.chapter}, p. ${quote.page}` : "";
    const description = `“${quote.text}” — from ${quote.book}${location}`;
    const ogImageUrl = `/api/og?quote=${quote.id}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `“${quote.text}” — Bartholomew Says`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `“${quote.text}” — Bartholomew Says`,
          },
        ],
      },
    };
  }

  // Default metadata for the main route
  return {
    title: "Bartholomew Says",
    description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
    openGraph: {
      title: "Bartholomew Says",
      description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Bartholomew Says - An Unnecessarily Dramatic Collection of Wisdom",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Bartholomew Says",
      description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "Bartholomew Says - An Unnecessarily Dramatic Collection of Wisdom",
        },
      ],
    },
  };
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const quoteParam = typeof params.quote === "string" ? params.quote : typeof params.q === "string" ? params.q : undefined;
  const initialQuote = quoteParam ? (getQuoteById(quoteParam) ?? undefined) : undefined;

  return <QuoteAppClient initialQuote={initialQuote} />;
}
