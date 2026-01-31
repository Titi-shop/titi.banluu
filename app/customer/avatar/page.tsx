"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken } from "@/lib/piAuth";

export default function AvatarPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  /* ================================
     GUARD — UI ONLY
  ================================= */
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  /* ================================
     FILE CHANGE
  ================================= */
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
     UPLOAD AVATAR — NETWORK FIRST
  ================================= */
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("⚠️ Vui lòng chọn ảnh trước.");
      return;
    }

    try {
      setUploading(true);

      // ✅ NETWORK-FIRST: lấy token trực tiếp từ Pi SDK
      const token = await getPiAccessToken();

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("UPLOAD_FAILED");
      }

      alert("✅ Ảnh đại diện đã được cập nhật!");
      router.back();
    } catch (err) {
      console.error("❌ Upload avatar error:", err);
      alert("❌ Không thể tải ảnh đại diện");
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
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow w-80 text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <img
            src={preview || "/api/getAvatar"}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-orange-500"
          />

          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
            📸
          </label>
        </div>

        <h1 className="font-semibold mb-3">
          @{user.username}
        </h1>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-orange-500 text-white py-2 rounded disabled:opacity-50"
        >
          {uploading ? "⏳ Đang tải..." : "📤 Lưu ảnh"}
        </button>

        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
