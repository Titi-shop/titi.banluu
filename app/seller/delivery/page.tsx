"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function SellerDeliveryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { translate, language } = useLanguage();
  const [sellerUser, setSellerUser] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // ✅ Lấy thông tin đăng nhập từ Pi Login
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
      console.error("❌ Lỗi đọc thông tin Pi:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // ✅ Lấy danh sách đơn hàng
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();

      // ✅ Lọc đơn hàng đang giao của seller hiện tại
      const delivering = data.filter(
        (o: any) =>
          (o.status === "Đang giao" || o.status === "delivering") &&
          (!o.seller || o.seller?.toLowerCase() === sellerUser.toLowerCase())
      );

      setOrders(delivering);
    } catch (err) {
      console.error("❌ Lỗi tải đơn:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Gọi lại khi đổi ngôn ngữ hoặc đăng nhập xong
  useEffect(() => {
    if (isLoggedIn) fetchOrders();
    else setLoading(false);
  }, [language, isLoggedIn]);

  // ✅ Cập nhật trạng thái “Hoàn tất”
  const markAsDone = async (id: number) => {
    if (!confirm(translate("confirm_done") || "Xác nhận hoàn tất đơn này?")) return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: translate("completed_status") || "Hoàn tất",
          seller: sellerUser, // ✅ gửi seller để backend xác thực
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      alert(translate("order_completed") || "✅ Đơn hàng đã được đánh dấu hoàn tất!");
      fetchOrders();
    } catch (error) {
      console.error("❌ Lỗi cập nhật:", error);
      alert(translate("update_error") || "Có lỗi xảy ra khi cập nhật đơn hàng.");
    }
  };

  // 🔒 Nếu chưa đăng nhập bằng Pi
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center">
        <h2 className="text-xl text-red-600 mb-3">
          🔐 {translate("login_required") || "Vui lòng đăng nhập bằng Pi Network để xem đơn hàng giao"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ⏳ Loading
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        ⏳ {translate("loading_orders") || "Đang tải đơn hàng..."}
      </p>
    );

  // ✅ Giao diện chính
  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-5 text-orange-600 text-center">
        🚚 {translate("delivery") || "Quản lý giao hàng"}
      </h1>

      <p className="text-center text-gray-500 mb-4">
        👤 {translate("seller_label") || "Người bán"}: <b>{sellerUser}</b>
      </p>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_orders") || "Không có đơn hàng nào đang giao."}
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-5 shadow-md bg-white hover:shadow-lg transition"
            >
              <h2 className="font-semibold text-lg">
                🧾 {translate("order_code") || "Mã đơn"}: #{order.id}
              </h2>
              <p>👤 {translate("buyer") || "Người mua"}: {order.buyer || "guest"}</p>
              <p>💰 {translate("total") || "Tổng tiền"}: {order.total} Pi</p>
              <p>
                🕒 {translate("created_at") || "Ngày tạo"}:{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <ul className="mt-2 text-sm list-disc ml-6 text-gray-700">
                {order.items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.name} — {item.price} Pi × {item.quantity || 1}
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => markAsDone(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                >
                  ✅ {translate("mark_done") || "Hoàn tất đơn"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
