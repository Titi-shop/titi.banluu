"use client";

import { useState } from "react";

export default function ClearPendingPage() {
  const [paymentId, setPaymentId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!paymentId.trim()) {
      alert("⚠️ Vui lòng nhập paymentId!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/pi/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: paymentId.trim() }),
      });

      const text = await res.text();
      setMessage(`✅ Kết quả: ${text}`);
    } catch (err: any) {
      setMessage(`💥 Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl font-bold text-center text-gray-800 mb-4">
        🧹 Huỷ giao dịch Pi đang pending
      </h1>

      <p className="text-gray-600 text-sm mb-4">
        Nếu bạn bị lỗi <strong>"A pending payment needs to be handled"</strong>,
        hãy dán mã <code>paymentId</code> của giao dịch cũ vào ô dưới đây để huỷ.
      </p>

      <input
        type="text"
        placeholder="Nhập paymentId..."
        value={paymentId}
        onChange={(e) => setPaymentId(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-orange-500 outline-none"
      />

      <button
        onClick={handleCancel}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-semibold ${
          loading
            ? "bg-gray-400"
            : "bg-orange-600 hover:bg-orange-700 active:bg-orange-800"
        }`}
      >
        {loading ? "Đang huỷ..." : "Huỷ giao dịch"}
      </button>

      {message && (
        <div className="mt-4 p-3 border rounded bg-white text-sm text-gray-700">
          {message}
        </div>
      )}
    </main>
  );
}
