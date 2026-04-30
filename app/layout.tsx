import type { Metadata } from "next";
import { DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

// Guard against broken localStorage shims in some server environments
if (typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined") {
  const ls = globalThis.localStorage as unknown as Record<string, unknown>;
  if (typeof ls.getItem !== "function") {
    // Replace the broken shim with a no-op implementation
    (globalThis as unknown as Record<string, unknown>).localStorage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    };
  }
}

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Marketing Visibility Audit",
  description:
    "Combined SEO + AI visibility audit powered by DataForSEO and Claude.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmMono.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
