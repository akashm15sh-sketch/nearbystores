import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import GlobalSupportButton from '@/components/GlobalSupportButton';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NearbyStores - Discover Local Businesses",
  description: "Connect with stores and businesses near you",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <GlobalSupportButton />
      </body>
    </html>
  );
}
