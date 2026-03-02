import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import GlobalSupportButton from '@/components/GlobalSupportButton';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NearbyStores - Discover Local Businesses",
  description: "Connect with stores and businesses near you",
  manifest: "/manifest.json",
  themeColor: "#ff6b35",
  icons: {
    icon: "/icons/customer-icon.png",
    apple: "/icons/customer-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NearbyStores" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <GlobalSupportButton />
      </body>
    </html>
  );
}
