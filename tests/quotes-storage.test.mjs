import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Transpile quotes data and lib
const dataTs = await readFile(new URL("../data/quotes.ts", import.meta.url), "utf8");
const libTs = await readFile(new URL("../lib/quotes.ts", import.meta.url), "utf8");

// Mock or inline module loader
const { outputText: dataJs } = ts.transpileModule(dataTs, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
});
const dataModule = await import(`data:text/javascript;base64,${Buffer.from(dataJs).toString("base64")}`);
const { quotes } = dataModule;

// Transpile lib replacing @/data/quotes import
const libTranspiledSource = libTs.replace(
  /from ["']@\/data\/quotes["']/,
  `from "data:text/javascript;base64,${Buffer.from(dataJs).toString("base64")}"`
);
const { outputText: libJs } = ts.transpileModule(libTranspiledSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
});
const libModule = await import(`data:text/javascript;base64,${Buffer.from(libJs).toString("base64")}`);
const {
  getQuoteById,
  getNextQuote,
  getRandomQuote,
} = libModule;

test("quotes dataset has valid incremental numeric IDs", () => {
  assert.ok(quotes.length >= 1);
  const ids = new Set();
  const slugs = new Set();
  const legacyIds = new Set();

  quotes.forEach((q, index) => {
    // IDs must be positive integers, unique, and ascending (gaps are allowed for rejected entries)
    assert.equal(typeof q.id, "number", `Quote ID should be a number: ${q.id}`);
    assert.ok(Number.isInteger(q.id) && q.id > 0, `Quote ID should be a positive integer: ${q.id}`);
    assert.ok(!ids.has(q.id), `Duplicate quote ID found: ${q.id}`);
    if (index > 0) {
      const prevId = quotes[index - 1].id;
      assert.ok(q.id > prevId, `Quote IDs must be in ascending order: ${prevId} -> ${q.id}`);
    }
    ids.add(q.id);

    if (q.slug) {
      assert.ok(!slugs.has(q.slug), `Duplicate slug found: ${q.slug}`);
      slugs.add(q.slug);
    }

    if (q.legacyId) {
      assert.ok(!legacyIds.has(q.legacyId), `Duplicate legacy ID found: ${q.legacyId}`);
      legacyIds.add(q.legacyId);
    }
  });
});

test("getQuoteById resolves numeric IDs and integer strings", () => {
  const first = quotes[0];
  const second = quotes[1];

  // Direct numeric ID
  const quoteNum = getQuoteById(first.id);
  assert.ok(quoteNum);
  assert.equal(quoteNum.id, first.id);

  // Second quote
  const quoteNum2 = getQuoteById(second.id);
  assert.equal(quoteNum2?.id, second.id);

  // Integer string of first ID
  const quoteStr = getQuoteById(String(first.id));
  assert.ok(quoteStr);
  assert.equal(quoteStr.id, first.id);

  // 0-index fallback always returns first quote
  const quote0 = getQuoteById("0");
  assert.equal(quote0?.id, first.id);

  // Slug lookup (only if slug is present)
  if (first.slug) {
    const quoteSlug = getQuoteById(first.slug);
    assert.ok(quoteSlug);
    assert.equal(quoteSlug.id, first.id);

    const quoteUpperSlug = getQuoteById(first.slug.toUpperCase());
    assert.equal(quoteUpperSlug?.id, first.id);
  }

  // Legacy ID lookup (only if legacyId is present)
  if (first.legacyId) {
    const quoteLegacy = getQuoteById(first.legacyId);
    assert.ok(quoteLegacy);
    assert.equal(quoteLegacy.id, first.id);
  }

  // Unknown or invalid IDs
  assert.equal(getQuoteById(999999), undefined);
  assert.equal(getQuoteById("non-existent-slug"), undefined);
  assert.equal(getQuoteById(""), undefined);
  assert.equal(getQuoteById(null), undefined);
  assert.equal(getQuoteById(undefined), undefined);
});

test("getNextQuote never returns duplicate quotes until all quotes are seen", () => {
  const seenIds = [];
  let currentId = undefined;

  for (let step = 0; step < quotes.length; step++) {
    const { quote, reachedEnd } = getNextQuote({ currentId, seenIds });
    assert.ok(quote, "Should always return a quote");
    assert.equal(typeof quote.id, "number");
    assert.ok(!seenIds.includes(quote.id), `Quote ${quote.id} was repeated before all quotes were seen!`);

    seenIds.push(quote.id);
    currentId = quote.id;

    if (step === quotes.length - 1) {
      assert.equal(reachedEnd, true, "Should reach end when last quote is selected");
    } else {
      assert.equal(reachedEnd, false, "Should not reach end before all quotes are selected");
    }
  }

  assert.equal(seenIds.length, quotes.length);
  assert.equal(new Set(seenIds).size, quotes.length, "All quotes in dataset must be distinct");

  // Once all quotes are seen, reachedEnd remains true
  const afterEnd = getNextQuote({ currentId, seenIds });
  assert.equal(afterEnd.reachedEnd, true);
});

test("getRandomQuote respects excludeId when possible", () => {
  const firstId = quotes[0].id;
  for (let i = 0; i < 20; i++) {
    const quoteNum = getRandomQuote(firstId);
    assert.notEqual(quoteNum.id, firstId);

    if (quotes[0].slug) {
      const quoteSlug = getRandomQuote(quotes[0].slug);
      assert.notEqual(quoteSlug.id, firstId);
    }
  }
});
