import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import BottomNav from "../components/BottomNav";  // ✅ thêm import
// nếu bạn còn Navbar (header) thì import vào đây nếu cần

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
      <body className="relative pb-16">  {/* pb-16 để chừa khoảng cho BottomNav */}
        <AuthProvider>
          {children}
          <BottomNav />        {/* ✅ chèn thanh điều hướng dưới ở đây */}
        </AuthProvider>
      </body>
    </html>
  );
}
