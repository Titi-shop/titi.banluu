"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext"; // ✅ thêm dòng này

export default function CartPage() {
  const [cart, setCart] = useState<any[]>([]);
  const { user } = useAuth(); // ✅ lấy thông tin người dùng đăng nhập

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) {
      setCart(JSON.parse(stored));
    }
  }, []);

  const removeItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  // ✅ Nếu chưa đăng nhập, chặn truy cập
  if (!user) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">
          ⚠️ Bạn cần đăng nhập tài khoản Pi Network để xem giỏ hàng.
        </p>
      </main>
    );
  }

  // ✅ Nếu đã đăng nhập, hiển thị giỏ hàng
  return (
    <main>
      <section className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Giỏ hàng của {user.username} 🛒
        </h1>

        {cart.length === 0 ? (
          <p className="text-center text-gray-500">
            Chưa có sản phẩm nào trong giỏ hàng.
          </p>
        ) : (
          <div className="space-y-4">
            {cart.map((p, index) => (
              <div
                key={index}
                className="flex justify-between items-center border rounded p-4 bg-white shadow"
              >
                <div>
                  <h2 className="font-semibold text-lg">{p.name}</h2>
                  <p className="text-gray-600 text-sm">{p.description}</p>
                  <p className="text-yellow-600 font-bold">{p.price} Pi</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => removeItem(index)}
                    className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            <div className="text-right mt-6">
              <button
                onClick={() => (window.location.href = "/checkout")}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
              >
                Thanh toán tất cả
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
