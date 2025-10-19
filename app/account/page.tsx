"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("pi_user");
    const isLoggedIn = localStorage.getItem("titi_is_logged_in");

    // ✅ Nếu đã đăng nhập thì luôn chuyển sang /customer
    if (savedUser && isLoggedIn === "true") {
      router.replace("/customer");
    } else {
      // ✅ Nếu chưa đăng nhập thì về trang đăng nhập
      router.push("/pilogin");
    }
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-6 w-[90%] max-w-md text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">
          Tài khoản của tôi
        </h1>
        <p className="mb-6 text-gray-600">Bạn chưa đăng nhập</p>
        <button
          onClick={() => router.push("/pilogin")}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
        >
          🔑 Đăng nhập
        </button>
      </div>
    </main>
  );
}
