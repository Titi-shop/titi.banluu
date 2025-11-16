"use client";

import { useEffect, useState } from "react";

type PiPay = { id: string; amount: number; status: string; memo?: string; from?: string; created_at?: string };

export default function PiPendingAdmin() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PiPay[]>([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/pi/pending?status=pending", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Load failed");
      setPayments(data.payments || []);
      setMsg(`Found ${data.count} pending payment(s).`);
    } catch (e: any) {
      setMsg("Error: " + e.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: "approve"|"complete"|"cancel") => {
    setLoading(true); setMsg("");
    try {
      const res = await fetch(`/api/pi/pending/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setMsg(`${action.toUpperCase()} -> ${data.status}`);
      await load();
    } catch (e: any) {
      setMsg("Action error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🧹 Dọn payment pending</h1>

      <div className="mb-3 text-sm text-gray-600">
        Trang này chỉ hiển thị & xử lý payment “pending” từ Pi API (Testnet).
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={load} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
          {loading ? "Đang tải..." : "🔄 Tải danh sách"}
        </button>
      </div>

      {msg && <div className="mb-4 text-gray-800">{msg}</div>}

      {payments.length === 0 ? (
        <div className="text-gray-500">Không có payment pending.</div>
      ) : (
        <ul className="space-y-3">
          {payments.map(p => (
            <li key={p.id} className="border rounded p-3 bg-white">
              <div><b>ID:</b> {p.id}</div>
              <div><b>Số tiền:</b> {p.amount} Pi</div>
              <div><b>Memo:</b> {p.memo || "-"}</div>
              <div><b>Tạo lúc:</b> {p.created_at || "-"}</div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => act(p.id, "approve")} className="px-3 py-1 bg-orange-500 text-white rounded">Approve</button>
                <button onClick={() => act(p.id, "complete")} className="px-3 py-1 bg-green-600 text-white rounded">Complete</button>
                <button onClick={() => act(p.id, "cancel")} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
