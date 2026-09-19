import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bartholomew Says",
  description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Bartholomew Says",
    description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bartholomew Says",
    description: "An unnecessarily dramatic collection of Bartholomew wisdom.",
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
      <body className="min-h-full h-full bg-[#0a0b0e] text-[#f2ede4] font-serif overflow-hidden select-none selection:bg-[#c5a059]/30 selection:text-[#f7f2ea]">
        {children}
      </body>
    </html>
  );
}
