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
        {/* ✅ Giữ nguyên phần meta cũ */}

        {/* ✅ Thêm SDK Pi Network (load trước khi app render) */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
          async={false}
        />

        {/* ✅ Sau khi SDK load xong, khởi tạo Pi SDK */}
        <Script id="pi-init" strategy="afterInteractive">
          {`
            if (window.Pi) {
              console.log("✅ Pi SDK loaded:", window.Pi);
              // Khởi tạo SDK với version hiện tại
              window.Pi.init({ version: "2.0" });
            } else {
              console.warn("⚠️ Pi SDK chưa load, hãy mở bằng Pi Browser.");
            }
          `}
        </Script>
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
