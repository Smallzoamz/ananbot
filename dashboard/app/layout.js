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
  title: "An An Bot | Premium Management Panel",
  description: "Advanced guild management with heart and precision.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${itim.variable}`}>
        <LanguageProvider>
          <AuthProvider>
            {children}
            <MascotWrapper />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
