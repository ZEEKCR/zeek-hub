import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/i18n/es.json";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ZEEK Hub",
  description: "Coordinación de voluntarios de ZEEK",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${urbanist.variable} dark h-full antialiased`}>
      <body className="min-h-full">
        <NextIntlClientProvider locale="es" messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
