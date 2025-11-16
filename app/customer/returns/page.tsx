"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Upload, Send } from "lucide-react";

export default function ReturnPage() {
  const router = useRouter();
  const { user, loading, piReady, pilogin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🟢 Lấy danh sách đơn hàng của user
  useEffect(() => {
    const username = user?.username || localStorage.getItem("titi_username");
    if (!username) return;

    fetch(`/api/orders?username=${username}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => console.warn("Không thể tải danh sách đơn hàng."));
  }, [user]);

  // 📸 Upload hình ảnh minh chứng
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-filename": file.name },
        body: file,
      });
      const data = await res.json();
      if (data.url) setImages((prev) => [...prev, data.url]);
    } catch (err) {
      alert("❌ Lỗi tải ảnh.");
    } finally {
      setUploading(false);
    }
  };

  // 📤 Gửi yêu cầu trả hàng
  const handleSubmit = async () => {
    if (!selectedOrder || !reason) {
      alert("⚠️ Vui lòng chọn đơn hàng và nhập lý do trả.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username || localStorage.getItem("titi_username"),
          orderId: selectedOrder,
          reason,
          images,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Yêu cầu trả hàng đã được gửi thành công!");
        setReason("");
        setImages([]);
        setSelectedOrder("");
      } else {
        alert("❌ Gửi thất bại: " + (data.message || ""));
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Lỗi kết nối server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải...</p>;

  if (!user)
    return (
      <main className="p-4 text-center">
        <p className="text-red-500">Bạn cần đăng nhập để yêu cầu trả hàng.</p>
        {piReady && (
          <button
            onClick={pilogin}
            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            🔐 Đăng nhập
          </button>
        )}
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ===== Tiêu đề ===== */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-orange-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 mx-auto">Yêu cầu trả hàng</h1>
      </div>

      {/* ===== Chọn đơn hàng ===== */}
      <div className="p-4">
        <label className="font-semibold">Chọn đơn hàng cần trả:</label>
        <select
          className="block w-full border p-2 rounded mt-2"
          value={selectedOrder}
          onChange={(e) => setSelectedOrder(e.target.value)}
        >
          <option value="">-- Chọn đơn hàng --</option>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.id} - {order.status}
            </option>
          ))}
        </select>
      </div>

      {/* ===== Lý do ===== */}
      <div className="p-4">
        <label className="font-semibold">Lý do trả hàng:</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border p-2 rounded mt-2"
          rows={4}
          placeholder="Mô tả lý do trả hàng..."
        />
      </div>

      {/* ===== Upload ảnh ===== */}
      <div className="p-4">
        <label className="font-semibold">Ảnh minh chứng (tùy chọn):</label>
        <div className="flex items-center gap-3 mt-2">
          <label
            htmlFor="upload-image"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded flex items-center gap-2 cursor-pointer"
          >
            <Upload size={18} /> {uploading ? "Đang tải..." : "Tải ảnh"}
          </label>
          <input id="upload-image" type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
        {images.length > 0 && (
          <div className="flex gap-3 mt-3 flex-wrap">
            {images.map((url, i) => (
              <img key={i} src={url} alt="uploaded" className="w-20 h-20 rounded object-cover border" />
            ))}
          </div>
        )}
      </div>

      {/* ===== Nút gửi ===== */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`${
            submitting ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          } text-white font-semibold py-2 px-6 rounded flex items-center gap-2`}
        >
          <Send size={18} />
          {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </div>
    </main>
  );
}
