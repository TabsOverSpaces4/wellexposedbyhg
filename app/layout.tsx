import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ExposedByHG — Photography by Harsh Gupta",
    template: "%s | ExposedByHG",
  },
  description:
    "A cinematic photography showcase by Harsh Gupta. Landscapes, portraits, and moments captured through the lens of an enthusiast photographer.",
  keywords: [
    "photography",
    "Harsh Gupta",
    "ExposedByHG",
    "landscape photography",
    "portrait photography",
    "photo gallery",
    "cinematic photography",
  ],
  authors: [{ name: "Harsh Gupta" }],
  creator: "Harsh Gupta",
  metadataBase: new URL("https://wellexposedbyhg.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ExposedByHG",
    title: "ExposedByHG — Photography by Harsh Gupta",
    description:
      "A cinematic photography showcase by Harsh Gupta. Landscapes, portraits, and moments captured through the lens of an enthusiast photographer.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ExposedByHG — Photography by Harsh Gupta",
    description:
      "A cinematic photography showcase by Harsh Gupta. Landscapes, portraits, and moments captured through the lens of an enthusiast photographer.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
