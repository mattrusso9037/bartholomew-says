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
      <body className="min-h-full font-serif">
        {children}
      </body>
    </html>
  );
}
