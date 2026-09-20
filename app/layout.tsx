import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  "https://bartholomew.softwareinfocus.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  title: "Bartholomew Says",
  description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Bartholomew Says",
    description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
    type: "website",
    siteName: "Bartholomew Says",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full font-serif">
        {children}
      </body>
    </html>
  );
}
