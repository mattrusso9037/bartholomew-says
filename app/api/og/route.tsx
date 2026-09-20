import { ImageResponse } from "next/og";
import { getQuoteById } from "@/lib/quotes";
import { quotes } from "@/data/quotes";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

// Load backdrop image once at module scope
let backdropDataUri = "";
try {
  const backdropPath = path.join(process.cwd(), "public/og-quote-backdrop.jpg");
  if (fs.existsSync(backdropPath)) {
    const buffer = fs.readFileSync(backdropPath);
    backdropDataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }
} catch {
  // Graceful fallback to CSS gradient if file read fails
}

// Load Cormorant Garamond font once at module scope
let fontSemiBold: ArrayBuffer | null = null;
let fontMedium: ArrayBuffer | null = null;
try {
  const semiBoldPath = path.join(process.cwd(), "public/fonts/CormorantGaramond-SemiBold.woff");
  if (fs.existsSync(semiBoldPath)) {
    fontSemiBold = fs.readFileSync(semiBoldPath).buffer;
  }
  const mediumPath = path.join(process.cwd(), "public/fonts/CormorantGaramond-Medium.woff");
  if (fs.existsSync(mediumPath)) {
    fontMedium = fs.readFileSync(mediumPath).buffer;
  }
} catch {
  // Satori will fall back to system serif
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get("quote");

  // If no quote ID, serve standard og-image or default quote
  const quote = quoteId ? (getQuoteById(quoteId) ?? quotes[0]) : null;

  if (!quote) {
    // If no quote specified, return the main brand og-image.png directly (no redirect for scrapers)
    try {
      const mainOgPath = path.join(process.cwd(), "public/og-image.png");
      if (fs.existsSync(mainOgPath)) {
        const fileBuffer = fs.readFileSync(mainOgPath);
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      }
    } catch {
      // fallback to first quote
    }
  }

  const activeQuote = quote ?? quotes[0];

  // Calculate proportional font size based on quote length
  const length = activeQuote.text.length;
  let quoteFontSize = 34;
  let lineHeight = 1.36;
  if (length < 65) {
    quoteFontSize = 42;
    lineHeight = 1.3;
  } else if (length < 120) {
    quoteFontSize = 36;
    lineHeight = 1.34;
  } else if (length < 180) {
    quoteFontSize = 30;
    lineHeight = 1.38;
  } else if (length < 240) {
    quoteFontSize = 26;
    lineHeight = 1.4;
  } else {
    quoteFontSize = 22;
    lineHeight = 1.42;
  }

  const fonts: { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700; style: "normal" | "italic" }[] = [];
  if (fontSemiBold) {
    fonts.push({
      name: "Cormorant Garamond",
      data: fontSemiBold,
      weight: 600,
      style: "normal",
    });
  }
  if (fontMedium) {
    fonts.push({
      name: "Cormorant Garamond",
      data: fontMedium,
      weight: 500,
      style: "normal",
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0d0c0b",
          backgroundImage: backdropDataUri ? `url(${backdropDataUri})` : undefined,
          backgroundSize: "1200px 630px",
          backgroundPosition: "center",
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          padding: "36px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Subtle decorative inner border */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            left: "24px",
            right: "24px",
            bottom: "24px",
            border: "1px solid rgba(212, 175, 55, 0.22)",
            borderRadius: "4px",
            display: "flex",
          }}
        />

        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "12px",
            height: "12px",
            borderTop: "2px solid #d4af37",
            borderLeft: "2px solid #d4af37",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            width: "12px",
            height: "12px",
            borderBottom: "2px solid #d4af37",
            borderLeft: "2px solid #d4af37",
            display: "flex",
          }}
        />

        {/* Left Content Area (width 680px gives plenty of breathing room for Bartholomew on right) */}
        <div
          style={{
            width: "680px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px 24px 20px 16px",
            boxSizing: "border-box",
            zIndex: 10,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {/* Golden Moon Icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d4af37"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  letterSpacing: "3.5px",
                  textTransform: "uppercase",
                  color: "#d4af37",
                  fontWeight: 600,
                }}
              >
                Bartholomew Says
              </span>
            </div>
            <div
              style={{
                flex: 1,
                height: "1px",
                backgroundColor: "rgba(212, 175, 55, 0.25)",
                marginLeft: "8px",
                display: "flex",
              }}
            />
          </div>

          {/* Quote Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              margin: "auto 0",
              padding: "16px 0",
            }}
          >
            <span
              style={{
                fontSize: `${quoteFontSize}px`,
                lineHeight: lineHeight,
                color: "#f5f0e6",
                fontWeight: 500,
                letterSpacing: "0.2px",
                fontStyle: "italic",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
              }}
            >
              “{activeQuote.text}”
            </span>
          </div>

          {/* Attribution Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "1px",
                backgroundColor: "#d4af37",
                marginBottom: "8px",
                opacity: 0.6,
                display: "flex",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  color: "#d4af37",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                {activeQuote.book}
              </span>
              {activeQuote.chapter != null && activeQuote.page != null && (
                <span
                  style={{
                    fontSize: "16px",
                    color: "#b0a595",
                    fontWeight: 400,
                  }}
                >
                  · Ch. {activeQuote.chapter}, p. {activeQuote.page}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: "15px",
                color: "#8c8273",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              by Rachel Gillig
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length > 0 ? fonts : undefined,
      headers: {
        "Cache-Control": "public, immutable, no-transform, max-age=31536000",
      },
    }
  );
}
