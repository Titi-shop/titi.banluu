"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string | number;
  buyer: string;
  seller?: string;
  createdAt: string;
  total: number;
  status: string;
  items?: OrderItem[];
  shipping?: {
    name: string;
    phone: string;
    address: string;
  };
}

export default function SellerOrdersPage() {
  const { translate } = useLanguage();
  const { user, piReady } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  // ✅ Xác thực & kiểm tra role
  useEffect(() => {
    if (!piReady) return;
    if (!user) {
      router.push("/pilogin");
      return;
    }

    const verifyRole = async () => {
      try {
        const res = await fetch(`/api/users/role?username=${user.username}`);
        const data = await res.json();
        if (data.role === "seller") {
          setIsSeller(true);
          await fetchOrders(user.username);
        } else {
          router.push("/customer");
        }
      } catch {
        router.push("/pilogin");
      } finally {
        setLoading(false);
      }
    };

    verifyRole();
  }, [piReady, user, router]);

  // ✅ Tải đơn hàng của seller
  const fetchOrders = async (sellerUsername: string) => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      const safeOrders = (Array.isArray(data) ? data : []).map((o: any) => ({
        ...o,
        items: o.items || [],
        status: o.status || "Chờ xác nhận",
      }));

      const filtered = safeOrders.filter(
        (o) =>
          !o.seller ||
          o.seller?.toLowerCase() === sellerUsername.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    }
  };

  // ✅ Cập nhật trạng thái đơn
  const updateOrderStatus = async (orderId: any, newStatus: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, seller: user?.username }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      alert("❌ Lỗi khi cập nhật đơn hàng!");
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (!piReady || loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ Đang tải đơn hàng...
      </main>
    );

  if (!isSeller)
    return (
      <main className="text-center py-20 text-red-500 font-semibold">
        🔒 Bạn không có quyền truy cập khu vực này.
      </main>
    );

  return (
    <main className="p-5 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        📦 {translate("manage_orders") || "Quản lý đơn hàng"}
      </h1>

      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {["all", "Chờ xác nhận", "Đang giao", "Hoàn tất", "Đã hủy"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded border ${
                filter === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">
          Không có đơn hàng nào trong mục này.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg bg-white shadow p-4 hover:shadow-md transition"
            >
              <p>🧾 Mã đơn: #{order.id}</p>
              <p>👤 Người mua: {order.buyer}</p>
              <p>🕒 Tạo lúc: {new Date(order.createdAt).toLocaleString()}</p>
              <p>💰 Tổng: {order.total} Pi</p>

              {order.items?.length ? (
                <>
                  <p>🧺 Sản phẩm:</p>
                  <ul className="ml-6 list-disc">
                    {order.items.map((it, i) => (
                      <li key={i}>
                        {it.name} — {it.price} Pi × {it.quantity}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-400 italic">Không có chi tiết sản phẩm</p>
              )}

              {order.shipping && (
                <div className="mt-2 text-sm text-gray-700 border-t pt-2">
                  <p>👤 Người nhận: {order.shipping.name}</p>
                  <p>📞 {order.shipping.phone}</p>
                  <p>📍 {order.shipping.address}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <p>
                  📊 <b>Trạng thái:</b> {order.status}
                </p>

                {order.status === "Chờ xác nhận" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "Đang giao")}
                    disabled={updating === order.id}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {updating === order.id ? "⏳ Đang cập nhật..." : "✅ Xác nhận"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
