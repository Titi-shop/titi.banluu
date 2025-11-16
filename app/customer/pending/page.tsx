"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const router = useRouter();
  const { translate, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");
  const [processing, setProcessing] = useState<number | null>(null);

  // ✅ Lấy username hiện tại từ Pi login
  useEffect(() => {
    try {
      const info = localStorage.getItem("pi_user");
      const parsed = info ? JSON.parse(info) : null;
      const username = parsed?.user?.username || parsed?.username || "guest_user";
      setCurrentUser(username);
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    }
  }, []);

  // ✅ Lấy danh sách đơn hàng chờ xác nhận
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/orders", { method: "GET", cache: "no-store" });
        const data: Order[] = await res.json();

        const filterByLang = {
          vi: ["Chờ xác nhận", "Đã thanh toán", "Chờ xác minh"],
          en: ["Pending", "Paid", "Waiting for verification"],
          zh: ["待确认", "已付款", "待核实"],
        }[language];

        const filtered = data.filter(
          (o) =>
            o.buyer?.toLowerCase() === currentUser.toLowerCase() &&
            filterByLang.includes(o.status)
        );
        setOrders(filtered);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser, language]);

  // ✅ Hủy đơn hàng
  const handleCancel = async (orderId: number) => {
    if (!confirm("❓ Bạn có chắc muốn hủy đơn hàng này không?")) return;
    try {
      setProcessing(orderId);
      const res = await fetch(`/api/orders/cancel?id=${orderId}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Hủy thất bại");
      alert("✅ Đã hủy đơn hàng thành công!");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // 🕓 Giao diện tải
  if (loading) return <p className="text-center mt-10">⏳ Đang tải đơn hàng...</p>;
  if (error) return <p className="text-center text-red-500">❌ {error}</p>;

  // ✅ Tính tổng đơn và tổng Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce((sum, o) => sum + (parseFloat(String(o.total)) || 0), 0);

  // ✅ Hiển thị giao diện
  return (
    <main className="p-4 max-w-4xl mx-auto bg-gray-50 min-h-screen pb-24">
      {/* ===== Nút quay lại + Tiêu đề ===== */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => router.back()}
          className="text-orange-500 font-semibold text-lg mr-2"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-yellow-600 flex items-center gap-2">
          ⏳ Đơn hàng chờ xác nhận
        </h1>
      </div>

      {/* ===== Tổng đơn & Tổng Pi ===== */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-2xl font-bold text-gray-800">
            {totalPi.toFixed(2)} Pi
          </p>
        </div>
      </div>

      {/* ===== Danh sách đơn ===== */}
      {!orders.length ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng chờ xác nhận.
          <br />
          👤 Người dùng: <b>{currentUser}</b>
        </p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">
                  🧾 Mã đơn: #{order.id}
                </h2>
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={processing === order.id}
                  className={`px-3 py-1 text-white rounded-md text-sm ${
                    processing === order.id
                      ? "bg-gray-400"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {processing === order.id ? "Đang hủy..." : "❌ Hủy đơn"}
                </button>
              </div>

              <p>💰 Tổng tiền: <b>{order.total}</b> Pi</p>
              <p>📅 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length > 0 && (
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.price} Pi × {item.quantity}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-yellow-600 font-medium">
                Trạng thái: {order.status}
              </p>

              {order.note && (
                <p className="text-gray-500 italic text-sm mt-1">
                  📝 {order.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== Đệm tránh che phần chân ===== */}
      <div className="h-20"></div>
    </main>
  );
}
