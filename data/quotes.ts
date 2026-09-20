export type Quote = {
  id: number;
  slug?: string;
  legacyId?: string;
  text: string;
  book: "The Knight and the Moth" | "The Knave and the Moon";
  chapter?: number;
  page?: number;
};

/**
 * Bartholomew quotations sourced from the books.
 * Only quotes with confirmed IDs in the quote database are included.
 */
export const quotes: Quote[] = [
  {
    id: 1,
    text: "Fear not, Bartholomew! Every day has its dog.",
    book: "The Knight and the Moth",
    chapter: 12,
    page: 147,
  },
  {
    id: 2,
    text: "I confess horses are not the intelligent beasts I imagined them to be. Though I don't think that merits the abuse they suffer postmortem.",
    book: "The Knight and the Moth",
    chapter: 12,
    page: 143,
  },
  {
    id: 3,
    text: "Bartholomew does not know how to swim. But worry not—. She has always excelled at drowning.",
    book: "The Knight and the Moth",
    chapter: 19,
    page: 244,
  },
  {
    id: 4,
    text: "Oh, Bartholomew. He's dreamy.",
    book: "The Knight and the Moth",
    chapter: 16,
    page: 202,
  },
  {
    id: 5,
    text: "I am years beyond my wisdom.",
    book: "The Knight and the Moth",
    chapter: 26,
    page: 318,
  },
  {
    id: 6,
    text: "It is important for a squire to carry a knight's weapons. I will carry them for you, Bartholomew. I will shoulder any weight you give me.",
    book: "The Knight and the Moth",
    chapter: 20,
    page: 246,
  },
  {
    id: 7,
    text: "Don't worry, Bartholomew. If you accidentally kill her, I will not be upset.",
    book: "The Knight and the Moth",
    chapter: 18,
    page: 227,
  },
  {
    id: 8,
    text: "How undignified. Did anyone see me fall?",
    book: "The Knight and the Moth",
    chapter: 15,
    page: 193,
  },
  {
    id: 9,
    text: "Do something, Bartholomew! Bite off his leg if you must!",
    book: "The Knight and the Moth",
    chapter: 15,
    page: 195,
  },
  {
    id: 10,
    text: "Sometimes, Bartholomew, I think her quite the bitch.",
    book: "The Knight and the Moth",
    chapter: 7,
    page: 75,
  },
  {
    id: 11,
    text: "Overhead, the gargoyle was soaring and spinning, bidding \"welfare\" instead of \"farewell\" to the fading night.",
    book: "The Knight and the Moth",
    chapter: 10,
    page: 113,
  },
  {
    id: 12,
    text: "By the seat of my skirts.",
    book: "The Knight and the Moth",
    chapter: 23,
    page: 289,
  },
  {
    id: 13,
    text: "I say, Bartholomew. Is a road still a road if no one rode upon it?",
    book: "The Knight and the Moth",
    chapter: 15,
    page: 187,
  },
  {
    id: 14,
    text: "If you wish to divine before the bitch—excuse me—before the abbess arrives, best get cracking.",
    book: "The Knight and the Moth",
    chapter: 7,
    page: 75,
  },
  {
    id: 15,
    text: "Oh, Bartholomew.",
    book: "The Knight and the Moth",
    chapter: 10,
    page: 121,
  },
  {
    id: 16,
    text: "Look, Bartholomew, Hair! Not one hair, a great many, and all upon an adorable little creature. I want to catch it and put it in my mouth and let it build a nest there.",
    book: "The Knave and the Moon",
    chapter: 3,
    page: 23,
  },
];
