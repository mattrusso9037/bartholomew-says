import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Transpile ShareButton.tsx, stripping React/lucide-react imports for pure helper testing
const shareButtonTs = await readFile(new URL("../components/share/ShareButton.tsx", import.meta.url), "utf8");

// We only need the exported functions/helpers: isMobileOrTablet, copyToClipboard, shareOrCopyQuote
const cleanTs = shareButtonTs
  .replace(/import\s+[^;]+from\s+["']react["'];?/g, "")
  .replace(/import\s+[^;]+from\s+["']lucide-react["'];?/g, "")
  .replace(/import\s+type\s+[^;]+from\s+["']@\/data\/quotes["'];?/g, "export type Quote = { id: number; text: string; book: string };")
  .replace(/export function ShareButton[\s\S]*$/, ""); // Remove the React component part

const { outputText: shareJs } = ts.transpileModule(cleanTs, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }
});

const shareModule = await import(`data:text/javascript;base64,${Buffer.from(shareJs).toString("base64")}`);
const { isMobileOrTablet, shareOrCopyQuote } = shareModule;

function setupMockEnv({ userAgent, platform = "", maxTouchPoints = 0, hasShare = true, shareRejects = null }) {
  let shareCalled = false;
  let copiedText = "";

  const mockNavigator = {
    userAgent,
    platform,
    maxTouchPoints,
    clipboard: {
      writeText: async (text) => {
        copiedText = text;
      },
    },
    ...(hasShare
      ? {
          share: async () => {
            shareCalled = true;
            if (shareRejects) throw shareRejects;
            return;
          },
        }
      : {}),
  };

  const mockWindow = {
    location: { origin: "https://example.com", pathname: "/" },
    matchMedia: () => ({ matches: false }),
  };

  Object.defineProperty(globalThis, "window", { value: mockWindow, configurable: true, writable: true });
  Object.defineProperty(globalThis, "navigator", { value: mockNavigator, configurable: true, writable: true });

  return {
    mockNavigator,
    mockWindow,
    didShare: () => shareCalled,
    getCopiedText: () => copiedText,
  };
}

test("desktop Mac with navigator.share only copies to clipboard and ignores navigator.share", async () => {
  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    platform: "MacIntel",
    maxTouchPoints: 0,
    hasShare: true,
  });

  assert.equal(isMobileOrTablet(), false, "Desktop Mac should not be detected as mobile or tablet");

  const result = await shareOrCopyQuote({
    title: "Test Quote",
    text: "Something profound",
    quoteId: 1,
    book: "Book 1",
    url: "https://example.com/?quote=1",
  });

  assert.equal(result, "copied");
  assert.equal(env.didShare(), false, "navigator.share should NOT have been called on desktop");
  assert.equal(env.getCopiedText(), "https://example.com/?quote=1");
});

test("desktop Windows with navigator.share only copies to clipboard", async () => {
  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    platform: "Win32",
    maxTouchPoints: 0,
    hasShare: true,
  });

  assert.equal(isMobileOrTablet(), false, "Desktop Windows should not be detected as mobile or tablet");

  const result = await shareOrCopyQuote({
    title: "Test Quote",
    text: "Something profound",
    quoteId: 2,
    book: "Book 1",
    url: "https://example.com/?quote=2",
  });

  assert.equal(result, "copied");
  assert.equal(env.didShare(), false, "navigator.share should NOT have been called on desktop");
  assert.equal(env.getCopiedText(), "https://example.com/?quote=2");
});

test("iPhone uses navigator.share", async () => {
  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    platform: "iPhone",
    maxTouchPoints: 5,
    hasShare: true,
  });

  assert.equal(isMobileOrTablet(), true, "iPhone should be detected as mobile");

  const result = await shareOrCopyQuote({
    title: "Bartholomew Says",
    text: "Something profound",
    quoteId: 3,
    book: "Book 1",
    url: "https://example.com/?quote=3",
  });

  assert.equal(result, "shared");
  assert.equal(env.didShare(), true, "navigator.share SHOULD have been called on iPhone");
  assert.equal(env.getCopiedText(), "", "clipboard should not be written to when share succeeds");
});

test("iPad running iPadOS 13+ (desktop UA with touch points) uses navigator.share", async () => {
  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    platform: "MacIntel",
    maxTouchPoints: 5,
    hasShare: true,
  });

  assert.equal(isMobileOrTablet(), true, "iPadOS 13+ should be detected as tablet");

  const result = await shareOrCopyQuote({
    title: "Bartholomew Says",
    text: "Something profound",
    quoteId: 4,
    book: "Book 1",
    url: "https://example.com/?quote=4",
  });

  assert.equal(result, "shared");
  assert.equal(env.didShare(), true, "navigator.share SHOULD have been called on iPad");
});

test("Android tablet uses navigator.share", async () => {
  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-X800) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    platform: "Linux armv8l",
    maxTouchPoints: 10,
    hasShare: true,
  });

  assert.equal(isMobileOrTablet(), true, "Android tablet should be detected as tablet");

  const result = await shareOrCopyQuote({
    title: "Bartholomew Says",
    text: "Something profound",
    quoteId: 5,
    book: "Book 1",
    url: "https://example.com/?quote=5",
  });

  assert.equal(result, "shared");
  assert.equal(env.didShare(), true, "navigator.share SHOULD have been called on Android tablet");
});

test("mobile device returns cancelled when user aborts navigator.share", async () => {
  const abortError = new Error("Share canceled");
  abortError.name = "AbortError";

  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    platform: "iPhone",
    maxTouchPoints: 5,
    hasShare: true,
    shareRejects: abortError,
  });

  const result = await shareOrCopyQuote({
    title: "Bartholomew Says",
    text: "Something profound",
    quoteId: 6,
    book: "Book 1",
    url: "https://example.com/?quote=6",
  });

  assert.equal(result, "cancelled");
  assert.equal(env.getCopiedText(), "", "clipboard should not be written to when cancelled");
});

test("mobile device without navigator.share falls back to clipboard", async () => {
  const env = setupMockEnv({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    platform: "iPhone",
    maxTouchPoints: 5,
    hasShare: false,
  });

  const result = await shareOrCopyQuote({
    title: "Bartholomew Says",
    text: "Something profound",
    quoteId: 7,
    book: "Book 1",
    url: "https://example.com/?quote=7",
  });

  assert.equal(result, "copied");
  assert.equal(env.getCopiedText(), "https://example.com/?quote=7");
});
