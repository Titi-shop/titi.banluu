import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import BottomNav from "../components/BottomNav";

export const metadata = {
  title: "TiTi Shop",
  description: "Ứng dụng thương mại điện tử Pi Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
      </head>
      <body className="relative pb-16 bg-gray-50">
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
