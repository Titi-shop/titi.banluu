"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Trang quản lý và xử lý đơn hàng của người bán.
 * Hiển thị danh sách đơn hàng và cho phép thay đổi trạng thái (Giao, Hoàn tất, Huỷ).
 */
export default function OrderManager() {
  const { translate } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  // 🧾 Lấy danh sách đơn hàng khi load trang
  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔹 Hàm lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok)
        throw new Error(translate("order_load_error") || "Không thể tải danh sách đơn hàng");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
      alert(translate("order_load_error") || "Không thể tải danh sách đơn hàng. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Cập nhật trạng thái đơn hàng
  const updateStatus = async (id: string | number, status: string) => {
    const confirmMsg =
      status === translate("order_canceled") || status === "Đã huỷ"
        ? translate("confirm_cancel_order") || "Bạn có chắc chắn muốn huỷ đơn hàng này không?"
        : `${translate("confirm_update_order")} "${status}"?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(id), status }),
      });

      if (!res.ok) throw new Error(translate("order_update_failed") || "Cập nhật thất bại");
      alert(translate("order_update_success") || "✅ Đã cập nhật trạng thái đơn hàng!");
      fetchOrders();
    } catch (err) {
      console.error("❌ Lỗi cập nhật đơn hàng:", err);
      alert(translate("order_update_failed") || "Không thể cập nhật trạng thái. Vui lòng thử lại!");
    }
  };

  // 🔹 Lọc đơn hàng theo trạng thái
  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  // 🕒 Khi đang tải
  if (loading)
    return <p className="text-center mt-6 text-gray-500">⏳ {translate("loading_orders") || "Đang tải đơn hàng..."}</p>;

  // 🔍 Khi không có đơn
  if (!orders.length)
    return <p className="text-center mt-6 text-gray-500">🕳️ {translate("no_orders") || "Chưa có đơn hàng nào."}</p>;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-5 text-center text-blue-700">
        📦 {translate("order_manager_title") || "Quản lý & Xử lý Đơn hàng"}
      </h1>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap justify-center gap-2 mb-5">
        {[
          { key: "all", label: translate("all") || "Tất cả" },
          { key: "Chờ xác nhận", label: translate("pending") || "Chờ xác nhận" },
          { key: "Đang giao", label: translate("delivering") || "Đang giao" },
          { key: "Hoàn tất", label: translate("completed") || "Hoàn tất" },
          { key: "Đã huỷ", label: translate("canceled") || "Đã huỷ" },
        ].map((status) => (
          <button
            key={status.key}
            onClick={() => setFilter(status.key)}
            className={`px-3 py-1 rounded border text-sm ${
              filter === status.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      <div className="space-y-5">
        {filteredOrders.map((o) => (
          <div
            key={o.id}
            className="border rounded-lg p-5 bg-white shadow-md hover:shadow-lg transition"
          >
            {/* Header đơn hàng */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg">
                🧾 {translate("order_id") || "Mã đơn"}: #{o.id}
              </h2>
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

            {/* Thông tin chi tiết */}
            <p>
              <b>👤 {translate("buyer") || "Người mua"}:</b> {o.buyer}
            </p>
            <p>
              <b>🕒 {translate("created_at") || "Ngày tạo"}:</b>{" "}
              {o.createdAt
                ? new Date(o.createdAt).toLocaleString()
                : translate("unknown") || "Không xác định"}
            </p>
            <p>
              <b>💰 {translate("total") || "Tổng tiền"}:</b> {o.total} Pi
            </p>

            <div className="mt-2">
              <b>🧺 {translate("items") || "Sản phẩm"}:</b>
              <ul className="ml-6 list-disc text-gray-700">
                {o.items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.name} — {item.price} Pi × {item.quantity || 1}
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
                  🚚 {translate("confirm_shipping") || "Xác nhận giao hàng"}
                </button>
              )}

              {o.status === "Đang giao" && (
                <button
                  onClick={() => updateStatus(o.id, "Hoàn tất")}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                >
                  ✅ {translate("complete_order") || "Hoàn tất đơn"}
                </button>
              )}

              {o.status !== "Đã huỷ" && o.status !== "Hoàn tất" && (
                <button
                  onClick={() => updateStatus(o.id, "Đã huỷ")}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  ❌ {translate("cancel_order") || "Huỷ đơn"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
