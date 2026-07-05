import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display — headings, hero copy
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Body — UI text (Montserrat is a variable font, no explicit weights needed)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

// Data / labels — mono readouts
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PVLE Command Center",
  description: "Mission control for the Pura Vida Legacy Ecosystem.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${montserrat.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg font-body text-cream">
        {children}
      </body>
    </html>
  );
}
