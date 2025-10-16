"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // 🔹 Kiểm tra user đã đăng nhập hay chưa
    const storedUser = localStorage.getItem("pi_user");
    if (storedUser) setUser(storedUser);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-6 w-[90%] max-w-md text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">Tài khoản của tôi</h1>

        {user ? (
          <>
            <p className="mb-4">👤 Xin chào, <b>{user}</b></p>
            <button
              onClick={() => {
                localStorage.removeItem("pi_user");
                alert("🚪 Đã đăng xuất!");
                setUser(null);
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-gray-600">Bạn chưa đăng nhập</p>
            <button
              onClick={() => router.push("/pilogin")}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg"
            >
              🔑 Đăng nhập
            </button>
          </>
        )}
      </div>
    </main>
  );
}