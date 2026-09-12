import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exagoal — Intelligent Examination Platform",
  description:
    "AI-powered adaptive examination platform for Indian education — curating, validating, and legitimizing assessments through a living Learning State engine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-poppins">{children}</body>
    </html>
  );
}
