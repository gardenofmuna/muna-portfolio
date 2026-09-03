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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
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
    <html lang="en">
      <head>
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
