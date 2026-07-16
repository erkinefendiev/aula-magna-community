import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aula Magna — Community Edition",
  description: "The free, self-hosted system of record for your school.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
