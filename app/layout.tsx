import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Bottleneck",
  description: "Многоканальный ИИ-анализатор",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
