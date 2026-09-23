import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tutor Ledger | Session Reporting",
  description:
    "Log tutoring sessions, track attendance, and prepare monthly reports. A fictional LVAEP workflow demo.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
