import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { WhatsAppChatButton } from "@/components/WhatsAppChatButton";

export const metadata: Metadata = {
  metadataBase: new URL("https://kampalacars.com"),
  title: "Kampala Cars - Buy & Sell Cars in Kampala",
  description:
    "Your trusted marketplace for buying and selling cars in Kampala. Find your perfect vehicle or sell your car with ease.",
  verification: {
    google: "google00697eac310c1f59.html", // only the content value from Search Console
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kampala Cars - Buy & Sell Cars in Kampala",
    description: "Find your perfect vehicle or sell your car with ease.",
    url: "https://kampalacars.com",
    siteName: "Kampala Cars",
    type: "website",
    images: ["/whatsapp_logo.png"], // optional, add a 1200x630 image in /public
  },
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
