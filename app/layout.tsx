import { JsonLd } from "@/components/JsonLd";
import {
  SITE_DESCRIPTION,
  SITE_IMAGE,
  SITE_JSON_LD,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { DisablePageZoom } from "@/components/DisablePageZoom";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  /* Keyboard / browser UI overlays instead of resizing the layout. */
  interactiveWidget: "overlays-content",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Designer, Artist and Curator`,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Muna Nzeribe", url: SITE_URL }],
  creator: "Muna Nzeribe",
  keywords: [
    "Muna Nzeribe",
    "Munachiso Nzeribe",
    "Efuru at the Threshold",
    "Flora Nwapa",
    "Efuru",
    "Àrokò Literary Arts",
    "DIDI Museum",
    "Mama, in Your Absence",
    "designer",
    "artist",
    "curator",
    "Toronto",
    "Lagos",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/site-icon-2026.png", type: "image/png" }],
    apple: [{ url: "/site-icon-2026.png", sizes: "180x180" }],
    shortcut: "/site-icon-2026.png",
  },
  openGraph: {
    title: `${SITE_NAME} | Designer, Artist and Curator`,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: SITE_IMAGE.url,
        width: SITE_IMAGE.size[0],
        height: SITE_IMAGE.size[1],
        type: "image/jpeg",
        alt: "Muna Nzeribe portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Designer, Artist and Curator`,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/site-icon-2026.png" />
        <link rel="icon" href="/site-icon-2026.png" type="image/png" />
        <link
          rel="preload"
          href="/fonts/ltc-garamont-display-ot.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ARIALMTEXTRABOLD.TTF"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <JsonLd data={SITE_JSON_LD} />
        <DisablePageZoom />
        <div id="__next">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
