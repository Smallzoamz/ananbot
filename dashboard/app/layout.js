import { Quicksand, Itim } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const itim = Itim({
  variable: "--font-itim",
  subsets: ["thai", "latin"],
  weight: ["400"],
});

import AuthProvider from "./components/AuthProvider";
import { LanguageProvider } from "./context/LanguageContext";
import MascotWrapper from "./components/MascotWrapper";

export const metadata = {
  metadataBase: new URL('https://ananbot.xyz'),
  title: {
    default: "An An Bot | Premium Management Panel",
    template: "%s | An An Bot"
  },
  description: "The most bubbly all-in-one Discord bot. Manage your server with heart, precision, and beautiful aesthetic layouts.",
  keywords: ["Discord Bot", "An An Bot", "Server Management", "Discord Levels", "Aesthetic Bot", "Role Management", "Discord Community"],
  authors: [{ name: "Papa AnAn", url: "https://ananbot.xyz" }],
  creator: "An An Dev Team",
  publisher: "An An Dev Team",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://ananbot.xyz',
  },
  openGraph: {
    title: {
      default: "An An Bot | Premium Management Panel",
      template: "%s | An An Bot"
    },
    description: "Manage your server with heart, precision, and beautiful aesthetic layouts.",
    url: 'https://ananbot.xyz',
    siteName: 'An An Bot',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://ananbot.xyz/images/og-banner.png?v=3',
        width: 1200,
        height: 630,
        alt: 'An An Bot - The Ultimate Aesthetic Discord Bot',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: "An An Bot | Premium Management Panel",
      template: "%s | An An Bot"
    },
    description: "Manage your server with heart, precision, and beautiful aesthetic layouts.",
    images: ['https://ananbot.xyz/images/og-banner.png?v=3'],
    creator: '@ananbot', // สมมติว่ามี Twitter
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  }
};

import JsonLd from "../components/JsonLd"; // Optimization: Client-side only injection

export default function RootLayout({ children }) {
  // jsonLd logic moved to components/JsonLd.js for performance optimization

  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${itim.variable}`}>
        <LanguageProvider>
          <AuthProvider>
            <JsonLd />
            {children}
            <MascotWrapper />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
