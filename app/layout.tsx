import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/providers/language-provider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "CreatorPersonaAI | AI Influencer & Video Generator",
  description:
    "Create AI Influencers, write scripts, and generate professional marketing videos for TikTok, Instagram, YouTube, and LinkedIn.",
  keywords: [
    "AI influencer",
    "AI video generator",
    "video marketing",
    "AI creator",
    "CreatorPersonaAI",
    "social media marketing",
  ],
  metadataBase: new URL("https://creatorpersonaai.com"),
  openGraph: {
    title: "CreatorPersonaAI | AI Influencer & Video Generator",
    description:
      "Create AI influencers, write scripts, and generate professional marketing videos in minutes. No camera, no crew — just AI.",
    url: "https://creatorpersonaai.com",
    siteName: "CreatorPersonaAI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CreatorPersonaAI | AI Influencer & Video Generator",
    description:
      "Create AI influencers, write scripts, and generate professional marketing videos in minutes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <LanguageProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LanguageProvider>
        <CookieConsent />
      </body>
    </html>
  );
}

