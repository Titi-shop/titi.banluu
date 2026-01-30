"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { user, pilogin, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     HANDLE REGISTER
  ========================= */
  const handleRegister = async () => {
    setError(null);

    // 1️⃣ Chưa đăng nhập → gọi Pi Login
    if (!user) {
      await pilogin();
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("pi_access_token");
      if (!token) {
        setError("Phiên đăng nhập không hợp lệ");
        return;
      }

      // 2️⃣ Gọi API đăng ký seller
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Đăng ký bán hàng thất bại");
        return;
      }

      // 3️⃣ Reload app để AuthContext load role mới
      window.location.href = "/seller";
    } catch (err) {
      console.error("SELLER REGISTER ERROR:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        Đăng ký bán hàng
      </h1>

      <p className="text-sm text-gray-600 mb-6">
        Sau khi đăng ký, bạn có thể đăng sản phẩm và quản lý đơn hàng.
      </p>

      {!user && (
        <div className="mb-4 text-sm text-red-600">
          Chưa đăng nhập
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading || submitting}
        className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium
                   hover:bg-orange-600 disabled:opacity-50"
      >
        {loading || submitting
          ? "Đang xử lý..."
          : user
          ? "Đăng ký bán hàng"
          : "Đăng nhập để đăng ký"}
      </button>
    </div>
  );
}
