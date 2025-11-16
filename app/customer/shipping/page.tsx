"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";

export default function CustomerShippingPage() {
  const router = useRouter();
  const { translate, language } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>("guest_user");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Lấy thông tin đăng nhập từ Pi login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (stored && logged === "true") {
        const parsed = JSON.parse(stored);
        const username =
          parsed?.user?.username || parsed?.username || "guest_user";
        setCurrentUser(username);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error("❌ Lỗi đọc dữ liệu đăng nhập:", err);
      setIsLoggedIn(false);
    }
  }, []);

  // ✅ Tải đơn hàng đang giao
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [language, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải danh sách đơn hàng");

      const data = await res.json();

      const filterByLang = {
        vi: ["Đang giao"],
        en: ["Delivering"],
        zh: ["配送中"],
      }[language];

      const filtered = data.filter(
        (o: any) =>
          filterByLang.includes(o.status) &&
          o.buyer?.toLowerCase() === currentUser.toLowerCase()
      );

      setOrders(filtered);
    } catch (err) {
      console.error("❌ Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xác nhận đã nhận hàng
  const confirmReceived = async (id: number) => {
    if (
      !confirm(
        translate("confirm_received") ||
          "Bạn có chắc chắn đã nhận được hàng?"
      )
    )
      return;

    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: translate("completed_status") || "Hoàn tất",
          buyer: currentUser,
        }),
      });

      if (!res.ok) throw new Error("Không thể cập nhật trạng thái.");

      alert(
        translate("thanks_confirm") ||
          "✅ Cảm ơn bạn! Đơn hàng đã được xác nhận hoàn tất."
      );
      fetchOrders();
    } catch (error) {
      console.error("❌ Lỗi xác nhận:", error);
      alert(
        translate("error_confirm") ||
          "Có lỗi xảy ra khi xác nhận đơn hàng."
      );
    }
  };

  // 🕓 Giao diện khi đang tải
  if (loading)
    return (
      <p className="text-center mt-6 text-gray-500">
        {translate("loading_orders") || "⏳ Đang tải danh sách đơn hàng..."}
      </p>
    );

  // 🔒 Nếu chưa đăng nhập
  if (!isLoggedIn)
    return (
      <main className="p-6 text-center min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-xl text-red-600 mb-3">
          🔐{" "}
          {translate("login_required") ||
            "Vui lòng đăng nhập bằng Pi Network"}
        </h2>
        <button
          onClick={() => router.push("/pilogin")}
          className="mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          👉 {translate("go_to_login") || "Đăng nhập ngay"}
        </button>
      </main>
    );

  // ✅ Tính tổng đơn và tổng Pi
  const totalOrders = orders.length;
  const totalPi = orders.reduce(
    (sum, o) => sum + (parseFloat(o.total) || 0),
    0
  );

  // ✅ Giao diện hiển thị
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
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          🚚 {translate("shipping_orders_title") || "Đơn hàng đang giao"}
        </h1>
      </div>

      {/* ===== Khối tổng đơn & tổng Pi ===== */}
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

      {/* ===== Danh sách đơn hàng ===== */}
      {orders.length === 0 ? (
        <p className="text-center text-gray-500">
          {translate("no_shipping_orders") ||
            "Bạn chưa có đơn hàng nào đang giao."}
          <br />
          👤 {translate("current_user") || "Tài khoản"}:{" "}
          <b>{currentUser}</b>
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
                  🧾 #{order.id}
                </h2>
                <span className="px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700">
                  {order.status}
                </span>
              </div>

              <p>👤 <b>Người mua:</b> {order.buyer}</p>
              <p>💰 <b>Tổng:</b> {order.total} Pi</p>
              <p>📅 <b>Ngày tạo:</b> {order.createdAt}</p>

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

              <div className="mt-4">
                <button
                  onClick={() => confirmReceived(order.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                >
                  ✅ {translate("confirm_received_button") || "Tôi đã nhận hàng"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Đệm tránh che phần chân ===== */}
      <div className="h-20"></div>
    </main>
  );
}
