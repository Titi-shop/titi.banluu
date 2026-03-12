import "./globals.css";
import Script from "next/script";
import PiRootClient from "./PiRootClient";
import { AuthProvider } from "@/context/AuthContext";
import AlertProvider from "@/app/components/AlertProvider";

export const metadata = {
  title: "aliali",
  description: "Ứng dụng thương mại điện tử thanh toán qua Pi Network Testnet",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <Script src="https://sdk.minepi.com/pi-sdk.js" strategy="afterInteractive" />
      </head>

      <body>
        <AuthProvider>
          <PiRootClient>{children}</PiRootClient>
        </AuthProvider>
      </body>
    </html>
  );
}
