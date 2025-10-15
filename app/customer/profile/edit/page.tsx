"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const info = localStorage.getItem("user_info");
      if (info) {
        try {
          const parsed = JSON.parse(info);
          setForm({
            username: parsed.username || "",
            email: parsed.email || "",
            phone: parsed.phone || "",
            address: parsed.address || "",
          });
        } catch (e) {
          console.error("⚠️ Lỗi đọc user_info:", e);
        }
      }
    }
  }, []);

  const handleSave = () => {
    if (!form.username.trim()) {
      alert("Vui lòng nhập tên người dùng!");
      return;
    }

    localStorage.setItem("user_info", JSON.stringify(form));
    alert("✅ Đã lưu thông tin cá nhân!");
    router.push("/customer/profile");
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-orange-600">
          📝 Cập nhật hồ sơ
        </h1>

        <div className="space-y-4">
          {["username", "email", "phone"].map((field) => (
            <div key={field}>
              <label className="block text-gray-700 text-sm mb-1 capitalize">
                {field === "username" ? "Tên người dùng" : field === "email" ? "Email" : "Số điện thoại"}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          ))}

          <div>
            <label className="block text-gray-700 text-sm mb-1">Địa chỉ</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 h-20"
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => router.back()}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
          >
            ← Quay lại
          </button>
          <button
            onClick={handleSave}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded"
          >
            💾 Lưu
          </button>
        </div>
      </div>
    </main>
  );
}
