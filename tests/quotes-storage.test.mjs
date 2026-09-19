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
  assert.ok(quotes.length >= 8);
  const ids = new Set();
  const slugs = new Set();
  const legacyIds = new Set();

  quotes.forEach((q, index) => {
    // Assert strictly incremental numbers starting at 1
    assert.equal(typeof q.id, "number", `Quote ID should be a number: ${q.id}`);
    assert.equal(q.id, index + 1, `Quote ID should be sequential starting at 1: got ${q.id}, expected ${index + 1}`);
    assert.ok(!ids.has(q.id), `Duplicate quote ID found: ${q.id}`);
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

test("getQuoteById resolves numeric IDs, integer strings, canonical slugs, and legacy IDs", () => {
  // Direct numeric ID
  const quoteNum1 = getQuoteById(1);
  assert.ok(quoteNum1);
  assert.equal(quoteNum1.id, 1);
  assert.equal(quoteNum1.slug, "folly-of-mortals");

  const quoteNum4 = getQuoteById(4);
  assert.equal(quoteNum4?.id, 4);

  // Integer string ID
  const quoteStr1 = getQuoteById("1");
  assert.ok(quoteStr1);
  assert.equal(quoteStr1.id, 1);

  const quoteStr2 = getQuoteById("2");
  assert.equal(quoteStr2?.id, 2);

  // 0-index fallback
  const quote0 = getQuoteById("0");
  assert.equal(quote0?.id, 1);

  // Canonical slug
  const quoteSlug = getQuoteById("folly-of-mortals");
  assert.ok(quoteSlug);
  assert.equal(quoteSlug.id, 1);

  // Case-insensitive slug
  const quoteUpperSlug = getQuoteById("FOLLY-OF-MORTALS");
  assert.equal(quoteUpperSlug?.id, 1);

  // Legacy placeholder ID
  const quoteLegacy = getQuoteById("placeholder-1");
  assert.ok(quoteLegacy);
  assert.equal(quoteLegacy.id, 1);

  const quoteLegacy4 = getQuoteById("placeholder-4");
  assert.equal(quoteLegacy4?.id, 4);

  // Unknown or invalid IDs
  assert.equal(getQuoteById(999), undefined);
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
  for (let i = 0; i < 20; i++) {
    const quoteNum = getRandomQuote(1);
    assert.notEqual(quoteNum.id, 1);

    const quoteSlug = getRandomQuote("folly-of-mortals");
    assert.notEqual(quoteSlug.id, 1);
  }
});
