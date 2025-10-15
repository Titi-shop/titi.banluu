"use client";

import { useEffect, useState } from "react";

/**
 * Trang quản lý và xử lý đơn hàng của người bán.
 * Hiển thị danh sách đơn hàng, cho phép thay đổi trạng thái (Giao, Hoàn tất, Huỷ).
 */
export default function OrderManager() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🧾 Lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Lỗi khi tải đơn hàng");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
      alert("Không thể tải danh sách đơn hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Cập nhật trạng thái đơn hàng
  const updateStatus = async (id: string | number, status: string) => {
    const confirmMsg =
      status === "Đã huỷ"
        ? "Bạn có chắc chắn muốn huỷ đơn hàng này không?"
        : `Xác nhận cập nhật trạng thái đơn hàng thành "${status}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error("Cập nhật thất bại");
      alert("✅ Đã cập nhật trạng thái đơn hàng!");
      fetchOrders();
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  // 🧮 Lọc đơn hàng theo trạng thái
  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // 🕒 Hiển thị trạng thái loading hoặc rỗng
  if (loading)
    return <p className="text-center mt-6 text-gray-500">⏳ Đang tải đơn hàng...</p>;
  if (!orders.length)
    return <p className="text-center mt-6 text-gray-500">🕳️ Chưa có đơn hàng nào.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-5">📦 Quản lý & Xử lý Đơn hàng</h1>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["all", "Chờ xác nhận", "Đang giao", "Hoàn tất", "Đã huỷ"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded border text-sm ${
              filter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "Tất cả" : status}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      <div className="space-y-5">
        {filteredOrders.map((o) => (
          <div
            key={o.id}
            className="border rounded-lg p-5 shadow-md bg-white transition hover:shadow-lg"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg">🧾 Mã đơn: #{o.id}</h2>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  o.status === "Chờ xác nhận"
                    ? "bg-yellow-100 text-yellow-700"
                    : o.status === "Đang giao"
                    ? "bg-blue-100 text-blue-700"
                    : o.status === "Hoàn tất"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {o.status}
              </span>
            </div>

            <p>
              <b>👤 Người mua:</b> {o.buyer}
            </p>
            <p>
              <b>🕒 Ngày tạo:</b>{" "}
              {o.createdAt
                ? new Date(o.createdAt).toLocaleString()
                : "Không xác định"}
            </p>
            <p>
              <b>💰 Tổng tiền:</b> {o.total} Pi
            </p>

            <div className="mt-2">
              <b>🧺 Sản phẩm:</b>
              <ul className="ml-6 list-disc text-gray-700">
                {o.items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.name} — {item.price} Pi x {item.quantity || 1}
                  </li>
                ))}
              </ul>
            </div>

            {/* Nút thao tác */}
            <div className="mt-4 flex flex-wrap gap-2">
              {o.status === "Chờ xác nhận" && (
                <button
                  onClick={() => updateStatus(o.id, "Đang giao")}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  🚚 Xác nhận giao hàng
                </button>
              )}

              {o.status === "Đang giao" && (
                <button
                  onClick={() => updateStatus(o.id, "Hoàn tất")}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  ✅ Hoàn tất đơn
                </button>
              )}

              {o.status !== "Đã huỷ" && o.status !== "Hoàn tất" && (
                <button
                  onClick={() => updateStatus(o.id, "Đã huỷ")}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  ❌ Huỷ đơn
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
