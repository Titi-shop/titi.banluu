"use client";
import { useEffect, useState } from "react";

/**
 * Trang hiển thị các đơn hàng đang được giao cho người mua.
 * - Hiển thị thông tin đơn hàng (sản phẩm, tổng tiền, ngày đặt, trạng thái)
 * - Cho phép người mua xác nhận “Đã nhận hàng” để hoàn tất đơn.
 */
export default function CustomerShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🧾 Lấy danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      // ✅ Lọc các đơn đang giao (trạng thái: "Đang giao")
      const filtered = data.filter((o: any) => o.status === "Đang giao");
      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Người mua xác nhận đã nhận hàng → chuyển sang trạng thái "Hoàn tất"
  const confirmReceived = async (id: number) => {
    if (!confirm("Xác nhận rằng bạn đã nhận được hàng?")) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "Hoàn tất" }),
      });

      if (!res.ok) throw new Error("Không thể cập nhật trạng thái.");

      alert("✅ Cảm ơn bạn! Đơn hàng đã được xác nhận hoàn tất.");
      fetchOrders(); // làm mới danh sách
    } catch (error) {
      console.error("❌ Lỗi xác nhận:", error);
      alert("Có lỗi xảy ra khi xác nhận đơn hàng.");
    }
  };

  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        ⏳ Đang tải danh sách đơn hàng...
      </p>
    );

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-5 text-center">
        🚚 Đơn hàng đang giao
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          Bạn chưa có đơn hàng nào đang giao.
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-5 shadow bg-white hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">
                  🧾 Mã đơn: #{order.id}
                </h2>
                <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                  {order.status}
                </span>
              </div>

              <p>
                <b>📦 Người bán:</b> TiTi Shop
              </p>
              <p>
                <b>💰 Tổng tiền:</b> {order.total} Pi
              </p>
              <p>
                <b>🕒 Ngày tạo:</b>{" "}
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString()
                  : "Không xác định"}
              </p>

              <div className="mt-2">
                <b>🧺 Sản phẩm:</b>
                <ul className="ml-6 list-disc text-gray-700">
                  {order.items?.map((item: any, idx: number) => (
                    <li key={idx}>
                      {item.name} — {item.price} Pi × {item.quantity || 1}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => confirmReceived(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                >
                  ✅ Tôi đã nhận hàng
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
