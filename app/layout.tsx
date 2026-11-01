import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import StoreProvider from "@/lib/store/provider";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RobinKey | Fantasy League Management",
  description: "RobinKey — manage your dynasty league, roster, and cap.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    // "black" renders an opaque status bar matching our dark header.
    // "black-translucent" lets the page draw under the status bar, which
    // is what caused the faint white overlay/shadow at the very top.
    capable: true,
    statusBarStyle: "black",
    title: "AVORA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F2E22",
  // Keeps modals (and their footer buttons) from being covered when the
  // on-screen keyboard opens, instead of the keyboard just overlaying content.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} antialiased`}>
        <StoreProvider>{children}</StoreProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
