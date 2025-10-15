import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "../components/BottomNav";
import Script from "next/script"; // ✅

export const metadata = {
  title: "TiTi Shop",
  description: "Ứng dụng thương mại điện tử Pi Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ nạp Pi SDK theo cách không đồng bộ */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
      </head>
      <body className="relative pb-16">
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
