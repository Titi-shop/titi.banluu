import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext"; // 🟠 Thêm ngôn ngữ
import BottomNav from "../components/BottomNav";

export const metadata = {
  title: "TiTi Shop",
  description: "Ứng dụng thương mại điện tử Pi Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
      </head>

      <body className="relative pb-16">
        {/* ✅ Bọc toàn bộ app trong LanguageProvider để ngôn ngữ hoạt động */}
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
