"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { token, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    if (!token) {
      setError("Chưa đăng nhập");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/seller/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Đăng ký thất bại");
      return;
    }

    // 🔁 reload user để role = seller
    await refreshUser();

    // 👉 chuyển sang seller dashboard
    router.replace("/seller");
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        Đăng ký bán hàng
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        Sau khi đăng ký, bạn có thể đăng sản phẩm và quản lý đơn hàng.
      </p>

      {error && (
        <div className="mb-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Đang xử lý..." : "Đăng ký bán hàng"}
      </button>
    </div>
  );
}
