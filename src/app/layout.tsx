import type { Metadata, Viewport } from "next";
import { Manrope, Roboto } from "next/font/google";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

// Manrope is the primary Aptiverse typeface: geometric humanist sans,
// Open Font Licence, free for commercial use. Weights 400 / 500 / 600
// cover the entire type scale defined in src/theme/typography.ts
// (regular, medium, bold-equivalent). Exposed as a CSS variable so
// the MUI theme can reference it via var(--font-manrope) without
// caring about the generated class name.
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-manrope",
});

// Roboto is kept as a metric-similar fallback if Manrope ever fails
// to load (cached webfont gone, blocked, etc). Two fonts of similar
// metric class catches the swap without layout shift.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: {
    default: "Aptiverse — Grow with confidence",
    template: "%s · Aptiverse",
  },
  description:
    "AI-powered student success platform built for South African FET-phase learners (Grades 10–12). SBA prep, goals, mastery, wellbeing, and bursary navigation in one calm, empowering space.",
  applicationName: "Aptiverse",
  keywords: [
    "Aptiverse",
    "SBA",
    "Grade 10",
    "Grade 11",
    "Grade 12",
    "FET phase",
    "High school",
    "South Africa",
    "Bursary",
    "NSFAS",
    "Tutor",
    "AI study",
  ],
  authors: [{ name: "Aptiverse" }],
  openGraph: {
    title: "Aptiverse — Grow with confidence",
    description:
      "Holistic student success: SBA prep, goals, wellbeing, tutors, bursaries.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F6963" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1219" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${roboto.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
