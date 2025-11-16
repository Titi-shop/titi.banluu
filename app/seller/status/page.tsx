"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

interface Order {
  id: string;
  code: string;
  buyer: string;
  seller?: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function SellerStatusPage() {
  const { translate } = useLanguage();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sellerUser, setSellerUser] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin đăng nhập Pi
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username = parsed?.user?.username || parsed?.username || "guest_user";
        setSellerUser(username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Lỗi đọc Pi user:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // ✅ Lấy danh sách đơn hàng sau khi đăng nhập
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Không thể tải đơn hàng");
      const data = await res.json();

      // ✅ Lọc theo seller đang đăng nhập
      const filtered = data.filter(
        (o: any) =>
          !o.seller || o.seller?.toLowerCase() === sellerUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error(err);
      setMessage(translate("update_error") || "Lỗi tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cập nhật trạng thái đơn hàng (có gửi thông tin seller)
  const handleMarkDone = async (id: string) => {
    const confirm = window.confirm(
      translate("confirm_done") || "Xác nhận hoàn tất đơn này?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Hoàn tất", seller: sellerUser }),
      });

      if (!res.ok) throw new Error("Update failed");

      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "Hoàn tất" } : o))
      );
      setMessage(translate("order_completed") || "✅ Đơn hàng đã hoàn tất!");
    } catch (err) {
      console.error(err);
      setMessage(translate("update_error") || "Có lỗi khi cập nhật đơn hàng!");
    }
  };

  // 🕓 Hiển thị đang tải
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        {translate("loading_orders") || "Đang tải đơn hàng..."}
      </p>
    );

  // 🔒 Nếu chưa đăng nhập bằng Pi
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network để xem trạng thái đơn hàng"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Hiển thị giao diện chính
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        ⚙️ {translate("update_status") || "Cập nhật trạng thái đơn hàng"}
      </h1>

      <p className="text-center text-sm text-gray-500 mb-3">
        👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
      </p>

      {message && (
        <p
          className={`text-center mb-3 font-medium ${
            message.includes("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_orders") || "Không có đơn hàng nào."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead className="bg-yellow-500 text-white">
              <tr>
                <th className="p-2 text-left">{translate("order_code")}</th>
                <th className="p-2 text-left">{translate("buyer")}</th>
                <th className="p-2 text-left">{translate("total")}</th>
                <th className="p-2 text-left">{translate("status")}</th>
                <th className="p-2 text-center">{translate("update_status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="p-2">{order.code}</td>
                  <td className="p-2">{order.buyer}</td>
                  <td className="p-2">{order.total.toLocaleString()} Pi</td>
                  <td className="p-2 capitalize">
                    {translate(order.status) || order.status}
                  </td>
                  <td className="p-2 text-center">
                    {order.status !== "Hoàn tất" ? (
                      <button
                        onClick={() => handleMarkDone(order.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        {translate("mark_done") || "Hoàn tất đơn"}
                      </button>
                    ) : (
                      <span className="text-green-600 font-medium">
                        {translate("completed_status") || "Hoàn tất"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
