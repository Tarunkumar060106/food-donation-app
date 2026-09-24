import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodRescue | Surplus food, rescued in minutes",
  description:
    "FoodRescue connects surplus food from restaurants, hostels, households and events with nearby volunteers and NGOs, with expiry-aware matching and live pickup tracking.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1813" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-[100dvh] font-sans">{children}</body>
    </html>
  );
}
