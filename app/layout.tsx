import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://munanzeribe.xyz"),
  title: "Muna | Portfolio",
  description: "Hi! Welcome to my Portfolio!",
  icons: {
    icon: [{ url: "/site-icon-2026.png", type: "image/png" }],
    apple: [{ url: "/site-icon-2026.png", sizes: "180x180" }],
    shortcut: "/site-icon-2026.png",
  },
  openGraph: {
    title: "Muna | Portfolio",
    description: "Hi! Welcome to my Portfolio!",
    url: "/",
    siteName: "Muna | Portfolio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/WEBSITE-IMAGE.webp",
        width: 1200,
        height: 630,
        alt: "Muna — portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Muna | Portfolio",
    description: "Hi! Welcome to my Portfolio!",
    images: ["/WEBSITE-IMAGE.webp"],
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
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  );
}
