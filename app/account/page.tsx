"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("pi_user");
    if (saved) {
      // Nếu đã có tài khoản → chuyển hướng sang trang customer
      router.replace("/customer");
    }
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-6 w-[90%] max-w-md text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">Tài khoản của tôi</h1>
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
