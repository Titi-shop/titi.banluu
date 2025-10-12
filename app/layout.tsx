import "./globals.css";
import { AuthProvider } from "../context/AuthContext"; // ✅ dùng AuthProvider

export const metadata = {
  title: "TiTi Shop",
  description: "Ứng dụng thương mại điện tử Pi Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Thêm script SDK Pi Network */}
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
      </head>
      <body>
        {/* ✅ Bọc toàn bộ app trong AuthProvider để giữ login */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
