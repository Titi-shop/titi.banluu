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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Pi SDK - chỉ hoạt động trong Pi Browser */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="beforeInteractive"
        />
        <Script id="pi-init" strategy="afterInteractive">
          {`
            if (typeof window !== "undefined" && window.Pi) {
              console.log("✅ Pi SDK loaded:", window.Pi);
              window.Pi.init({ version: "2.0" });
            } else {
              console.warn("⚠️ Pi SDK chưa load, hãy mở bằng Pi Browser.");
            }
          `}
        </Script>
      </head>

      <body className="relative pb-16 bg-gray-50">
        {/* ✅ Bao toàn bộ ứng dụng trong LanguageProvider */}
        <LanguageProvider>
          {/* ✅ Bao Auth và Giỏ hàng bên trong để chúng cũng đọc được ngôn ngữ */}
          <AuthProvider>
            <CartProvider>
              {/* ✅ Nội dung chính */}
              {children}

              {/* ✅ Thanh điều hướng cố định dưới màn hình */}
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
