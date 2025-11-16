"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Clock, Package, Truck, Star, RotateCcw } from "lucide-react";

export default function CustomerDashboard() {
  const { user, piReady } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  const [avatar, setAvatar] = useState<string | null>(null);

  // 🟢 Lấy avatar thật từ API
  useEffect(() => {
    if (!user?.username) return;

    fetch(`/api/getAvatar?username=${encodeURIComponent(user.username)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatar(data.avatar);
      })
      .catch(() => console.log("⚠️ Không thể tải avatar"));
  }, [user]);

  // 🛑 Chưa login → chuyển đến PiLogin
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user)
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Đang tải...
      </main>
    );

  return (
    <div className="min-h-screen bg-gray-100 pb-10">

      {/* Header */}
      <div className="bg-orange-500 text-white p-6 text-center shadow">

        {/* 🟢 Avatar */}
        <div
          onClick={() => router.push("/customer/profile")}
          className="w-20 h-20 bg-white rounded-full mx-auto mb-3 overflow-hidden cursor-pointer flex items-center justify-center text-orange-500 font-bold text-2xl hover:opacity-90 transition"
        >
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>

        {/* 🟢 Username chính thức */}
        <h1 className="text-xl font-semibold">@{user.username}</h1>
      </div>

      {/* Đơn hàng */}
      <div className="bg-white mt-4 rounded-lg shadow mx-3">
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-800 text-lg">
            {translate("my_orders") || "Đơn hàng của tôi"}
          </h2>
          <button
            onClick={() => router.push("/customer/orders")}
            className="text-blue-600 text-sm hover:underline"
          >
            {translate("see_all") || "Xem tất cả"} →
          </button>
        </div>

        <div className="grid grid-cols-5 text-center py-4">

          <button
            onClick={() => router.push("/customer/pending")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Clock size={28} />
            <span className="text-sm mt-1">{translate("waiting_confirm") || "Chờ xác nhận"}</span>
          </button>

          <button
            onClick={() => router.push("/customer/pickup")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Package size={28} />
            <span className="text-sm mt-1">{translate("waiting_pickup") || "Chờ lấy hàng"}</span>
          </button>

          <button
            onClick={() => router.push("/customer/shipping")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Truck size={28} />
            <span className="text-sm mt-1">{translate("delivering") || "Đang giao"}</span>
          </button>

          <button
            onClick={() => router.push("/customer/review")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <Star size={28} />
            <span className="text-sm mt-1">{translate("review") || "Đánh giá"}</span>
          </button>

          {/* 🔄 Trả hàng */}
          <button
            onClick={() => router.push("/customer/returns")}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500"
          >
            <RotateCcw size={28} />
            <span className="text-sm mt-1">{translate("return_order") || "Trả hàng"}</span>
          </button>

        </div>
      </div>

      {/* Ví người dùng */}
      <div className="bg-white mx-3 mt-4 p-4 rounded-lg shadow text-center">
        <p className="text-gray-700">
          💰 {translate("wallet_label") || "Ví Pi"}:{" "}
          <b>{user?.wallet_address || "Chưa liên kết"}</b>
        </p>
      </div>
    </div>
  );
}
