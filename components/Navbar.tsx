"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("pi_user");
    const savedRole = localStorage.getItem("titi_role");

    if (savedUser && savedRole) {
      try {
        const parsed = JSON.parse(savedUser);
        const name = parsed?.user?.username || null;
        setUsername(name);

        // ✅ Điều hướng đúng trang theo vai trò
        if (savedRole === "seller") {
          router.replace("/seller");
        } else {
          router.replace("/customer");
        }
      } catch (err) {
        console.error("Lỗi đọc thông tin người dùng:", err);
      }
    } else {
      router.push("/pilogin");
    }
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-2xl p-6 w-[90%] max-w-md text-center">
        <h1 className="text-2xl font-bold text-purple-700 mb-6">Tài khoản của tôi</h1>
        <p className="mb-6 text-gray-600">
          {username ? `Xin chào, ${username}` : "Bạn chưa đăng nhập"}
        </p>

        {/* ✅ Nút đăng nhập */}
        {!username && (
          <button
            onClick={() => router.push("/pilogin")}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg mb-3"
          >
            🔑 Đăng nhập
          </button>
        )}

        {/* ✅ Nút Đăng hàng — chỉ hiện khi username là nguyenminhduc1991111 */}
        {username === "nguyenminhduc1991111" && (
          <button
            onClick={() => router.push("/seller")}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-2 rounded-lg font-semibold"
          >
            🛒 Đăng hàng
          </button>
        )}
      </div>
    </main>
  );
}
