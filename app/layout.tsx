import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/providers/language-provider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "The AI Marketing Factory | AI Influencer & Video Pazarlama",
  description:
    "Web sitenizi analiz edin, markanıza özel AI Influencer oluşturun ve Instagram, TikTok, YouTube, LinkedIn için profesyonel pazarlama videoları otomatik üretin.",
  keywords: [
    "AI marketing",
    "AI influencer",
    "video marketing",
    "autonomous marketing",
    "AI video generation",
    "sosyal medya pazarlama",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_ID} />
        )}
        <LanguageProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
