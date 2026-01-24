"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AvatarPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ================================
     GUARD — REQUIRE AUTH
  ================================= */
  useEffect(() => {
    if (loading) return;

    if (!user?.uid) {
      alert("⚠️ Bạn chưa đăng nhập.");
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  /* ================================
     FILE CHANGE
  ================================= */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("❌ Chỉ được chọn file ảnh.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("❌ Ảnh không được vượt quá 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  /* ================================
     UPLOAD AVATAR (AUTH-CENTRIC)
  ================================= */
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("⚠️ Vui lòng chọn ảnh trước.");
      return;
    }

    if (!user?.accessToken) {
      alert("❌ Không có access token.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }

      alert("✅ Ảnh đại diện đã được cập nhật!");
      router.back();
    } catch (err: any) {
      console.error("❌ Upload avatar error:", err);
      alert("❌ Lỗi tải ảnh: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  /* ================================
     UI
  ================================= */
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        ⏳ Đang tải...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={preview || "/api/getAvatar"}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />

          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer hover:bg-orange-600 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            📸
          </label>
        </div>

        <h1 className="text-lg font-semibold text-gray-800 mb-2">
          @{user.username}
        </h1>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg w-full disabled:opacity-50"
        >
          {uploading ? "⏳ Đang tải lên..." : "📤 Lưu ảnh đại diện"}
        </button>

        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline text-sm block mx-auto"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
