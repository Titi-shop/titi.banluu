"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function AccountPage() {
  const router = useRouter();
  const { chooseRole, logout } = useAuth();

  // Khi chọn vai trò → lưu vào localStorage → điều hướng
  const handleChooseRole = (role: "seller" | "customer") => {
    chooseRole(role);
    localStorage.setItem("user_role", role);
    if (role === "seller") {
      router.push("/seller");
    } else {
      router.push("/customer");
    }
  };

  // Khi nhấn “Đăng xuất” (nếu cần)
  const handleLogout = () => {
    logout();
    localStorage.clear();
    router.push("/account");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center bg-white">
      {/* Tiêu đề */}
      <h1 className="text-3xl font-bold mb-4">👋 Chào mừng đến TiTi Shop</h1>

      {/* Mô tả */}
      <p className="text-gray-600 mb-8">Chọn vai trò để tiếp tục:</p>

      {/* Hai nút chọn vai trò */}
      <div className="flex gap-6">
        <button
          onClick={() => handleChooseRole("seller")}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow-md transition-all"
        >
          🏪 Tôi là người bán
        </button>

        <button
          onClick={() => handleChooseRole("customer")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg text-lg shadow-md transition-all"
        >
          👤 Tôi là khách hàng
        </button>
      </div>

      {/* (Tùy chọn) Nút đăng xuất khi người dùng đang đăng nhập */}
      <button
        onClick={handleLogout}
        className="mt-10 text-red-500 hover:text-red-700 text-sm underline"
      >
        🔓 Đăng xuất
      </button>
    </main>
  );
}
