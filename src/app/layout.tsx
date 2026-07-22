import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

// Match Euphoria.v4's typography. Applied directly via className so the
// font-family lands on <body> immediately and inherits down without
// CSS-variable indirection.
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aptiverse: Grow with confidence",
    template: "%s · Aptiverse",
  },
  description:
    "Aptiverse helps South African students learn well and stay well, from high school to university. Practice, mastery tracking, wellbeing, and goals in one calm place.",
  applicationName: "Aptiverse",
  keywords: [
    "Aptiverse",
    "student success",
    "High school",
    "University",
    "South Africa",
    "NSFAS",
    "Wellbeing",
    "AI study",
    "Parents",
  ],
  authors: [{ name: "Aptiverse" }],
  openGraph: {
    title: "Aptiverse: Grow with confidence",
    description:
      "Learn well and stay well. Practice, mastery, wellbeing, and goals in one calm place.",
    type: "website",
  },
};

export const viewport: Viewport = {
  // Next's defaults (width=device-width, initial-scale=1) are kept. Nothing
  // here caps maximumScale or sets userScalable: false, deliberately. Pinch
  // zoom is an accessibility right, and a student squinting at a formula on a
  // 5-inch screen is exactly the person who needs it.
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover lets the page paint under the notch and the gesture
  // bar, which is what makes env(safe-area-inset-*) resolve to anything other
  // than 0. The insets are then applied in globals.css and on the fixed
  // elements that would otherwise sit under the home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1012" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          TODO(font-licensing): this loads Euphoria's CloudFront-hosted
          Frygia stylesheet for visual parity. Frygia is licensed to
          Euphoria — replace with a self-hosted face (Manrope / Outfit /
          a purchased Frygia license) before any external launch.
        */}
        <link
          rel="preconnect"
          href="https://dt46w9nqlye04.cloudfront.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://dt46w9nqlye04.cloudfront.net/fonts/v4/stylesheet.css"
        />
      </head>
      <body className={roboto.className}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
