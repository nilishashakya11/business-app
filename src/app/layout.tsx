import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

// Fonts are self-hosted (see src/app/fonts) so builds never depend on
// fetching from Google Fonts at build time.
const sans = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/PlusJakartaSans-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/PlusJakartaSans-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/PlusJakartaSans-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/PlusJakartaSans-700.woff2", weight: "700", style: "normal" },
  ],
});

const display = localFont({
  variable: "--font-display",
  display: "swap",
  src: [
    { path: "./fonts/Outfit-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Outfit-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Outfit-700.woff2", weight: "700", style: "normal" },
  ],
});

const mono = localFont({
  variable: "--font-mono",
  display: "swap",
  src: [
    { path: "./fonts/JetBrainsMono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-500.woff2", weight: "500", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Glow & Go — Business Manager",
  description: "Appointment, billing and team management for salons and spas.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
