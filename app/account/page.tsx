"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function AccountPage() {
  const { user, login, logout } = useAuth();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-6">
      <h1 className="text-2xl font-bold mb-4">👤 Tài khoản Pi Network</h1>

      {user ? (
        <>
          <p className="text-lg">
            Xin chào, <b>{user.username}</b>
          </p>
          <p className="text-gray-600 mt-2">
            Ví Pi: {user.wallet_address || "Chưa liên kết"}
          </p>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-6 py-2 rounded mt-4 hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <button
          onClick={login}
          className="bg-yellow-500 text-white px-6 py-3 rounded hover:bg-yellow-600"
        >
          🔐 Đăng nhập với Pi Network
        </button>
      )}
    </main>
  );
}
