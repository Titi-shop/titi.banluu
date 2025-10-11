import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; // ✅ thêm lại Navbar ở đây
import BottomNav from "../components/BottomNav"; // ✅ thêm thanh dưới

// Font setup
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO metadata
export const metadata: Metadata = {
  title: "TiTi E-Commerce",
  description: "Shop powered by Pi Network integration",
};

// Root layout
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Pi SDK */}
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
      >
        {/* ✅ Thanh Navbar luôn ở trên */}
        <Navbar />

        {/* ✅ Nội dung trang */}
        <main className="min-h-screen pb-16">{children}</main>

        {/* ✅ Thanh điều hướng dưới */}
        <BottomNav />
      </body>
    </html>
  );
}
