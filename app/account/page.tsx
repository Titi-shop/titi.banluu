"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pi_user");
    if (saved) {
      setUser(JSON.parse(saved));
    } else {
      // Nếu chưa đăng nhập -> điều hướng về /pilogin
      router.push("/pilogin");
    }
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-6 w-[90%] max-w-md text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">Tài khoản của tôi</h1>

        {user ? (
          <>
            <p className="mb-2">👤 Xin chào, <b>{user.user.username}</b></p>
            <p className="mb-6">💰 Ví Pi: <b>{user.user.wallet_address || "Không có ví"}</b></p>

            <button
              onClick={() => {
                localStorage.removeItem("pi_user");
                alert("🚪 Đã đăng xuất!");
                setUser(null);
                router.push("/pilogin");
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        )}
      </div>
    </main>
  );
}
