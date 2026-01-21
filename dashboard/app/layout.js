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
  keywords: ["Discord Bot", "An An Bot", "Server Management", "Discord Levels", "Aesthetic Bot", "Role Management"],
  authors: [{ name: "Papa AnAn" }],
  creator: "An An Dev Team",
  openGraph: {
    title: "An An Bot | Premium Management Panel",
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
        alt: 'An An Bot Hero Banner',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "An An Bot | Premium Management Panel",
    description: "Manage your server with heart, precision, and beautiful aesthetic layouts.",
    images: ['https://ananbot.xyz/images/og-banner.png?v=3'],
  },
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${itim.variable}`}>
        <LanguageProvider>
          <AuthProvider>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "SoftwareApplication",
                  "name": "An An Bot",
                  "applicationCategory": "UtilitiesApplication",
                  "operatingSystem": "Discord",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "1250"
                  }
                })
              }}
            />
            {children}
            <MascotWrapper />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
