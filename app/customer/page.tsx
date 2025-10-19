"use client";

import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Clock, Package, Truck, Star, LogOut, User } from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const { translate } = useLanguage(); // ✅ lấy hàm translate
  const router = useRouter();
  const [username, setUsername] = useState("guest_user");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("pi_user") || localStorage.getItem("user_info");
      if (info) {
        try {
          const parsed = JSON.parse(info);
          setUsername(parsed?.user?.username || parsed?.username || "guest_user");
        } catch {
          setUsername("guest_user");
        }
      } else {
        router.replace("/pilogin");
      }
    }
  }, [router]);

  const goTo = (path: string) => {
    router.push(path);
  };

  const handleLogoutPi = async () => {
    try {
      if (typeof window !== "undefined" && window.Pi && typeof window.Pi.logout === "function") {
        await window.Pi.logout();
        console.log("Đã đăng xuất khỏi Pi Network session");
      }

      localStorage.removeItem("pi_user");
      localStorage.removeItem("user_info");
      localStorage.removeItem("titi_is_logged_in");

      if (logout) logout();

      router.replace("/pilogin");
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
      router.replace("/pilogin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ===== Thông tin người dùng ===== */}
      <div className="bg-orange-500 text-white p-6 text-center shadow relative">
        <div
          className="flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition"
          onClick={() => router.push("/customer/profile")}
        >
          <div className="w-16 h-16 bg-white rounded-full mb-3 flex items-center justify-center text-orange-500 font-bold text-xl">
            {username.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-semibold">{username}</h1>
          <p className="text-sm opacity-90 mt-1">{translate("customer_title")}</p>

          {/* 🔗 Hồ sơ cá nhân */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/customer/profile");
            }}
            className="mt-3 bg-white text-orange-600 text-sm px-4 py-1 rounded-full flex items-center gap-1 hover:bg-gray-100 transition"
          >
            <User size={16} />
            {translate("account")}
          </button>
        </div>
