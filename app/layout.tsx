import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tombola — Tour des Héraults | ABIL",
  description:
    "Tombola du tournoi Tour des Héraults : achetez des tickets qui portent le nom des joueurs et tentez de gagner de nombreux lots.",
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
