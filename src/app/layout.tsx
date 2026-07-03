import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
  title: {
    default: "Incognito Chat",
    template: "%s | Incognito Chat",
  },
  description:
    "Create private, anonymous chat rooms with real-time messaging and automatic deletion.",
  applicationName: "Incognito Chat",
  keywords: [
    "anonymous chat",
    "private chat",
    "temporary chat rooms",
    "self-destructing messages",
    "real-time chat",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
