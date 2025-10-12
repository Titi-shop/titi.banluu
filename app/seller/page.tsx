"use client";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function SellerDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <main className="p-6 text-center">Bạn cần đăng nhập.</main>;
  }
  if (user.role !== "seller") {
    return <main className="p-6 text-center">🔒 Bạn không có quyền vào trang này.</main>;
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">👑 Bảng điều khiển Người bán</h1>
      <div className="grid gap-4">
        <Link href="/add-product" className="block p-4 border rounded hover:bg-gray-50">📦 Đăng sản phẩm mới</Link>
        <Link href="/seller/orders" className="block p-4 border rounded hover:bg-gray-50">🧾 Đơn hàng</Link>
        <Link href="/seller/products" className="block p-4 border rounded hover:bg-gray-50">📚 Quản lý sản phẩm</Link>
        {/* Có thể thêm “📊 Doanh thu” sau */}
      </div>
    </main>
  );
}
