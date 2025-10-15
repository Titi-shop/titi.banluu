"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [info, setInfo] = useState({
    username: "guest_user",
    email: "Chưa cập nhật",
    phone: "Chưa cập nhật",
    address: "Chưa cập nhật",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setInfo({
            username: parsed.username || "guest_user",
            email: parsed.email || "Chưa cập nhật",
            phone: parsed.phone || "Chưa cập nhật",
            address: parsed.address || "Chưa cập nhật",
          });
        } catch (err) {
          console.error("❌ Lỗi đọc user_info:", err);
        }
      }
    }
  }, []);

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-orange-600">
          👤 Hồ sơ cá nhân
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700">Tên người dùng:</label>
            <input
              type="text"
              value={info.username}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Email:</label>
            <input
              type="text"
              value={info.email}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Số điện thoại:</label>
            <input
              type="text"
              value={info.phone}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700">Địa chỉ:</label>
            <textarea
              value={info.address}
              readOnly
              className="w-full border px-3 py-2 rounded bg-gray-100 h-20"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => router.push("/customer/profile/edit")}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded flex items-center gap-1"
          >
            ✏️ Chỉnh sửa hồ sơ
          </button>
          <button
            onClick={() => router.back()}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    </main>
  );
}
