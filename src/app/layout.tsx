import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/nav/bottom-nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interop — Obsidian for learning",
  description: "A mobile-first LMS where every module is markdown.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="bg-background text-foreground min-h-dvh flex flex-col">
        <Suspense fallback={null}>
          <ClerkProvider dynamic>
            <main className="flex-1 pb-20">{children}</main>
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
          </ClerkProvider>
        </Suspense>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
