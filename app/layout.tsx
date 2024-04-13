import React from "react";
import "./globals.css";
import "../styles/prism.css";
import { ClerkProvider } from "@clerk/nextjs";
// eslint-disable-next-line camelcase
import { Inter, Space_Grotesk } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "https://i.ibb.co/ZfXMSPS/opengraph-image.png",
      },
    ],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <title>DevOverFlow</title>
      <meta
        name="description"
        content="A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world"
      />

      <meta property="og:url" content="https://code-unite13.vercel.app/" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="DevOverFlow" />
      <meta
        property="og:description"
        content="A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world"
      />
      <meta
        property="og:image"
        content="https://opengraph.b-cdn.net/production/documents/87af9e85-66b1-44d3-8413-2a107ff2e95f.png?token=Aa5VEkb297BQ91kjV08USY2eiiSWBOfAQD2AtpYrtLg&height=776&width=1200&expires=33249010308"
      />

      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:domain" content="code-unite13.vercel.app" />
      <meta property="twitter:url" content="https://code-unite13.vercel.app/" />
      <meta name="twitter:title" content="DevOverFlow" />
      <meta
        name="twitter:description"
        content="A community-driven platform for asking and answering questions about programming get help,share knowledge and colloborate with developers from around  the world"
      />
      <meta
        name="twitter:image"
        content="https://opengraph.b-cdn.net/production/documents/87af9e85-66b1-44d3-8413-2a107ff2e95f.png?token=Aa5VEkb297BQ91kjV08USY2eiiSWBOfAQD2AtpYrtLg&height=776&width=1200&expires=33249010308"
      ></meta>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <ClerkProvider
          appearance={{
            elements: {
              formButtonPrimary: "primary-gradient",
              footerActionLink: "primary-text-gradient hover-text-primary-500",
            },
          }}
        >
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
