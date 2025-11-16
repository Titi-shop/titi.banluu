"use client";
import { useState } from "react";

export default function PiTest() {
  const [status, setStatus] = useState("🔹 Pi SDK ready...");

  const login = async () => {
    const scopes = ["username", "payments"];
    const auth = await window.Pi.authenticate(scopes, (p) => console.log("Incomplete:", p));
    alert(`✅ Login thành công: ${auth.user.username}`);
  };

  const pay = async () => {
    const payment = {
      amount: 0.01,
      memo: "Test thanh toán 0.01 Pi",
      metadata: { reason: "SDK test" },
    };
    const callbacks = {
      onReadyForServerApproval: async (pid) => {
        await fetch("/api/pi/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: pid }),
        });
      },
      onReadyForServerCompletion: async (pid, txid) => {
        await fetch("/api/pi/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: pid, txid }),
        });
        alert("🎉 Thanh toán thành công!");
      },
      onCancel: () => alert("🚫 Đã hủy"),
      onError: (err) => alert("❌ Lỗi: " + err.message),
    };
    window.Pi.createPayment(payment, callbacks);
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold text-purple-700 mb-4">🧪 Test Pi Payment</h1>
      <button onClick={login} className="bg-orange-500 text-white px-4 py-2 rounded m-2">
        🔑 Login Pi
      </button>
      <button onClick={pay} className="bg-purple-600 text-white px-4 py-2 rounded m-2">
        💳 Pay 0.01 Pi
      </button>
      <p className="mt-4">{status}</p>
    </div>
  );
}
