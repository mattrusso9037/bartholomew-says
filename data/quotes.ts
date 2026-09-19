export type Quote = {
  id: number;
  slug?: string;
  legacyId?: string;
  text: string;
  book: "The Knight and the Moth" | "The Knave and the Moon";
};

/**
 * Temporary local quote dataset.
 * Note: These are placeholder quotations for development and will be replaced
 * with manually verified quotes from the books later.
 */
export const quotes: Quote[] = [
  {
    id: 1,
    slug: "folly-of-mortals",
    legacyId: "placeholder-1",
    text: "Placeholder Bartholomew quote regarding the unbearable folly of mortals and the distinct superiority of stone.",
    book: "The Knight and the Moth",
  },
  {
    id: 2,
    slug: "placed-gargoyle",
    legacyId: "placeholder-2",
    text: "Placeholder Bartholomew quote on why swords are exceedingly clumsy when compared to a properly placed gargoyle.",
    book: "The Knight and the Moth",
  },
  {
    id: 3,
    slug: "nocturnal-beasts",
    legacyId: "placeholder-3",
    text: "Placeholder Bartholomew quote lamenting the lack of polite conversation among nocturnal beasts and errant knights.",
    book: "The Knave and the Moon",
  },
  {
    id: 4,
    slug: "obvious-ambushes",
    legacyId: "placeholder-4",
    text: "Placeholder Bartholomew quote on the curious tendency of heroes to walk directly into the most obvious ambushes.",
    book: "The Knight and the Moth",
  },
  {
    id: 5,
    slug: "stolen-secrets",
    legacyId: "placeholder-5",
    text: "Placeholder Bartholomew quote regarding the Moon, stolen secrets, and why one should never trust a thief who smiles.",
    book: "The Knave and the Moon",
  },
  {
    id: 6,
    slug: "damp-stone",
    legacyId: "placeholder-6",
    text: "Placeholder Bartholomew quote observing that history is mostly just damp stone and people making very poor choices.",
    book: "The Knight and the Moth",
  },
  {
    id: 7,
    slug: "moth-and-candle",
    legacyId: "placeholder-7",
    text: "Placeholder Bartholomew quote advising that if a moth knows where the candle is, it has already outsmarted the knave.",
    book: "The Knave and the Moon",
  },
  {
    id: 8,
    slug: "four-hundred-years",
    legacyId: "placeholder-8",
    text: "Placeholder Bartholomew quote reminding everyone that sitting still for four hundred years requires extraordinary discipline.",
    book: "The Knight and the Moth",
  },
];
