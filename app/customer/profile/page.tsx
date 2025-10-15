"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any | null>(null);

  // 🔹 Khi trang load, lấy dữ liệu người dùng từ localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("user_info");
      if (info) {
        try {
          const parsed = JSON.parse(info);
          setProfile(parsed);
        } catch (e) {
          console.error("❌ Lỗi đọc dữ liệu người dùng:", e);
        }
      }
    }
  }, []);

  // ==============================
  // 🔸 Nếu chưa có thông tin người dùng
  // ==============================
  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-6 text-center">
          <h1 className="text-2xl font-bold text-purple-700 mb-2">
            👤 Hồ sơ cá nhân
          </h1>
          <p className="text-gray-600 mb-6">
            Thông tin người dùng sẽ hiển thị tại đây.
          </p>
          <button
            onClick={() => router.push("/customer/profile/edit")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full shadow"
          >
            📝 Đăng ký thông tin
          </button>
        </div>
      </main>
    );
  }

  // ==============================
  // 🔸 Nếu đã có thông tin người dùng
  // ==============================
  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-lg p-6 mt-8">
        <h1 className="text-2xl font-bold text-center text-orange-600 flex items-center justify-center gap-2 mb-6">
          👤 Hồ sơ cá nhân
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Tên người dùng:
            </label>
            <p className="font-medium text-gray-800 border rounded px-3 py-2 bg-gray-50">
              {profile.username || "Chưa có tên"}
            </p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">Email:</label>
            <p className="font-medium text-gray-800 border rounded px-3 py-2 bg-gray-50">
              {profile.email || "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">
              Số điện thoại:
            </label>
            <p className="font-medium text-gray-800 border rounded px-3 py-2 bg-gray-50">
              {profile.phone || "Chưa cập nhật"}
            </p>
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-1">Địa chỉ:</label>
            <p className="font-medium text-gray-800 border rounded px-3 py-2 bg-gray-50">
              {profile.address || "Chưa cập nhật"}
            </p>
          </div>
        </div>

        {/* ===== Nút hành động ===== */}
        <div className="text-center mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push("/customer/profile/edit")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow"
          >
            ✏️ Chỉnh sửa hồ sơ
          </button>
          <button
            onClick={() => router.push("/customer")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full shadow"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </main>
  );
}
