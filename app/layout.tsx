import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { WhatsAppChatButton } from "@/components/WhatsAppChatButton";

export const metadata: Metadata = {
  // Lets pages use relative links in their share previews.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kampalacars.com"),
  title: "Kampala Cars - Buy & Sell Cars in Kampala",
  description:
    "Your trusted marketplace for buying and selling cars in Kampala. Find your perfect vehicle or sell your car with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <WhatsAppChatButton />
        </AuthProvider>
      </body>
    </html>
  );
}
