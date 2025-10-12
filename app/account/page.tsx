"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function AccountPage() {
  const { user, login, logout } = useAuth();

  const handleLogin = async () => {
    // Giả sử SDK Pi có sẵn
    const authResult = await window.Pi.authenticate(["username"], onIncompletePaymentFound);
    const userData = {
      uid: authResult.user.uid,
      username: authResult.user.username,
      accessToken: authResult.accessToken,
    };
    login(userData);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {user ? (
        <>
          <p>Xin chào {user.username}</p>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            Đăng xuất
          </button>
        </>
      ) : (
        <button onClick={handleLogin} className="bg-yellow-500 text-white px-6 py-3 rounded">
          Login
        </button>
      )}
    </div>
  );
}
