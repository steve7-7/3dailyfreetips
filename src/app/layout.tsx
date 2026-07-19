import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Toaster } from "@/components/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "GoalEdge — Smarter Football Predictions",
    template: "%s | GoalEdge",
  },
  description:
    "Data-driven football predictions, premium tip analysis, and Paystack-powered subscriptions. Free and premium plans.",
  keywords: ["football predictions", "soccer tips", "premium predictions", "paystack", "betting tips"],
  authors: [{ name: "GoalEdge" }],
  creator: "GoalEdge",
  publisher: "GoalEdge",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "GoalEdge — Smarter Football Predictions",
    description: "Data-driven football predictions with real odds and in-depth analysis.",
    siteName: "GoalEdge",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "GoalEdge Logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GoalEdge — Smarter Football Predictions",
    description: "Data-driven football predictions with real odds and in-depth analysis.",
    creator: "@goaledge",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
