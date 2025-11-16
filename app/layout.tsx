import "./globals.css";
import Script from "next/script";
import PiRootClient from "./PiRootClient";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "🛍️ TiTi Shop",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        {/* ✅ Chỉ load Pi SDK, không dùng onLoad trong Server Component */}
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
      </head>

      <body>
        {/* ✅ Bọc AuthProvider ngoài cùng — giữ login khi chuyển trang */}
        <AuthProvider>
          <PiRootClient>{children}</PiRootClient>
        </AuthProvider>
      </body>
    </html>
  );
}
