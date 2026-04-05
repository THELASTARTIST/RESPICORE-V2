// app/layout.tsx
import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RespiCore - Respiratory Health Platform",
  description:
    "Track, monitor, and improve your respiratory health with AI-powered acoustic analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${syne.className} bg-slate-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}