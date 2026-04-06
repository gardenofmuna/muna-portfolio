import type { Metadata } from "next";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://munanzeribe.xyz"),
  title: "Muna | Portfolio",
  description: "Hi! Welcome to my Portfolio!",
  icons: {
    icon: "/m-icon.jpg",
    apple: "/m-icon.jpg",
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
