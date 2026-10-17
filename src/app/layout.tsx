import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Urbanist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/i18n/es.json";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const THEME_SCRIPT = `try{if(localStorage.getItem("zeek-theme")==="light"){var d=document.documentElement;d.classList.remove("dark");d.classList.add("light")}}catch(e){}`;

export const metadata: Metadata = {
  title: "ZEEK Hub",
  description: "Coordinación de voluntarios de ZEEK",
  appleWebApp: {
    capable: true,
    title: "ZEEK",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#161616",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${urbanist.variable} dark h-full antialiased`}
    >
      <head>
        <script
          // Applies the saved theme before the first paint to avoid a flash.
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body className="min-h-full">
        <NextIntlClientProvider locale="es" messages={messages}>
          {children}
        </NextIntlClientProvider>
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
