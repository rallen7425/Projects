import type { Metadata, Viewport } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";
import AppHeader from "@/components/AppHeader";
import TopTabNav from "@/components/TopTabNav";
import { SavedStoriesProvider } from "@/components/SavedStoriesProvider";

export const metadata: Metadata = {
  title: "Distilled",
  description: "Your personal news briefing",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Distilled",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2d59a6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-white font-sans">
        <SavedStoriesProvider>
          <div className="flex flex-col max-w-[430px] mx-auto" style={{ height: "100dvh" }}>
            <AppHeader />
            <TopTabNav />
            <main className="flex-1 overflow-y-auto" style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}>
              {children}
            </main>
            <TabBar />
          </div>
        </SavedStoriesProvider>
      </body>
    </html>
  );
}
