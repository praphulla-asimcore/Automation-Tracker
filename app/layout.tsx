import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hexa Finance Automation Tracker",
  description: "Track Hexa Finance Operations automation progress — 13 modules, 4 phases, 7 Jul 2026 deadline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fc]">{children}</body>
    </html>
  );
}
