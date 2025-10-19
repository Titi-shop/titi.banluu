"use client";

import { useLanguage } from "../context/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Clock, Package, Truck, Star, LogOut, User } from "lucide-react";

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
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

  // 🔹 Hàm đăng xuất khỏi Pi Network
  const handleLogoutPi = async () => {
    try {
      // 1️⃣ Nếu có window.Pi thì gọi logout() của Pi Browser
      if (typeof window !== "undefined" && window.Pi && typeof window.Pi.logout === "function") {
        await window.Pi.logout();
        console.log("Đã đăng xuất khỏi Pi Network session");
      }

      // 2️⃣ Xóa localStorage
      localStorage.removeItem("pi_user");
      localStorage.removeItem("user_info");
      localStorage.removeItem("titi_is_logged_in");

      // 3️⃣ Gọi logout từ context nếu có
      if (logout) logout();

      // 4️⃣ Điều hướng về trang login
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
          <p className="text-sm opacity-90 mt-1">Thành viên TiTi Shop</p>

          {/* 🔗 Nút Hồ sơ cá nhân */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/customer/profile");
            }}
            className="mt-3 bg-white text-orange-600 text-sm px-4 py-1 rounded-full flex items-center gap-1 hover:bg-gray-100 transition"
          >
            <User size={16} />
            Hồ sơ cá nhân
          </button>
        </div>
      </div>

      {/* ===== Thanh công cụ đơn hàng ===== */}
      <div className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">Đơn mua của bạn</h2>
          <button
            onClick={() => router.push("/customer/orders")}
            className="text-blue-600 text-sm hover:underline"
          >
            Xem tất cả đơn →
          </button>
        </div>

        {/* ===== Các trạng thái đơn hàng ===== */}
        <div className="grid grid-cols-5 text-center py-4">
          <button
            onClick={() => goTo("/customer/pending")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Clock size={28} />
            <span className="text-sm mt-1">Chờ xác nhận</span>
          </button>

          <button
            onClick={() => goTo("/customer/pickup")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Package size={28} />
            <span className="text-sm mt-1">Chờ lấy hàng</span>
          </button>

          <button
            onClick={() => goTo("/customer/shipping")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Truck size={28} />
            <span className="text-sm mt-1">Đang giao</span>
          </button>

          <button
            onClick={() => goTo("/customer/review")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Star size={28} />
            <span className="text-sm mt-1">Đánh giá</span>
          </button>

          {/* 🔹 Nút đăng xuất Pi Network */}
          <button
            onClick={handleLogoutPi}
            className="flex flex-col items-center text-red-600 hover:text-red-700"
          >
            <LogOut size={28} />
            <span className="text-sm mt-1">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* ===== Ví người dùng ===== */}
      <div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow text-center">
        <p className="text-gray-700">
          💰 Ví của bạn: <b>{user?.wallet ?? "CUSTOMER-MOCK"}</b>
        </p>
      </div>
    </div>
  );
}
