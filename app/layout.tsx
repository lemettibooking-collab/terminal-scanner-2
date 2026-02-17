import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Terminal Scanner",
  description: "Market activity scanner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} 
antialiased min-h-screen bg-slate-950 text-slate-100`}
      >
        <header className="border-b border-slate-800 bg-slate-950/60 
backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center 
justify-between px-6 py-4">
            <Link href="/hot" className="font-semibold tracking-tight">
              terminal-scanner-2
            </Link>

            <nav className="flex items-center gap-4 text-sm">
              <Link href="/hot" className="text-slate-200 
hover:text-white">
                Hot
              </Link>
              <Link href="/settings" className="text-slate-200 
hover:text-white">
                Settings
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}

