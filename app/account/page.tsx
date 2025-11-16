"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 🔍 Kiểm tra đăng nhập
    const piUser = localStorage.getItem("pi_user");
    const isLoggedIn = localStorage.getItem("titi_is_logged_in");

    if (piUser && isLoggedIn === "true") {
      // ✅ Đã đăng nhập Pi → chuyển đến customer
      router.replace("/customer");
    } else {
      // 🚪 Chưa đăng nhập → chuyển đến PiLogin
      router.replace("/pilogin");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
      <p>⏳ Đang kiểm tra tài khoản...</p>
    </main>
  );
}
