"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

/**
 * PiLoginPage
 * - Nút "Đăng nhập giả lập" sẽ tạo 1 user demo: username = nguyenminhduc1991111, role = 'seller'
 * - Nút "Đăng nhập bằng Pi SDK" giữ nguyên nếu bạn đã nạp SDK (window.Pi)
 *
 * LƯU Ý:
 * - Không để nút giả lập này bật ở production (gỡ trước khi deploy thật).
 * - useAuth.login(...) phải chấp nhận object { username, wallet_address, role? }
 */

export default function PiLoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.username) {
      // nếu đã có role trong user thì điều hướng
      if (user.username === "nguyenminhduc1991111" || user.role === "seller") {
        router.push("/seller");
      } else {
        router.push("/customer");
      }
    }
  }, [user, router]);

  // === Hàm đăng nhập giả lập dùng để test nhanh ===
  const handleFakeLogin = async () => {
    try {
      // user giả lập có role seller để chuyển hướng vào /seller
      const fakeUser = {
        username: "nguyenminhduc1991111",
        wallet_address: "fake_wallet_address_123",
        role: "seller",
      };

      // Nếu login trả về Promise thì await, nếu sync cũng ok
      await login(fakeUser);

      // thông báo cho dev/test
      // DON'T use alert in production — đây chỉ test nhanh
      alert("✅ Đăng nhập giả lập thành công: " + fakeUser.username);
      // redirect do useEffect sẽ xử lý
    } catch (e) {
      console.error("Lỗi giả lập đăng nhập:", e);
      alert("❌ Lỗi đăng nhập giả lập");
    }
  };

  // === Nếu bạn có Pi SDK đã nạp trong layout (script) và muốn dùng thật ===
  const handlePiSdkLogin = async () => {
    try {
      // @ts-ignore
      const Pi = (window as any).Pi;
      if (!Pi || !Pi.authenticate) {
        alert("Pi SDK không được tìm thấy — dùng đăng nhập giả lập để test.");
        return;
      }

      // ví dụ scopes
      const scopes = ["username", "payments"];

      // Pi.authenticate có thể open popup trong Pi Browser và trả về auth object
      const authResult = await Pi.authenticate(scopes, (payment: any) => {
        console.log("Pi payment callback:", payment);
      });

      // Tùy SDK: authResult có thể khác cấu trúc. Điều chỉnh theo SDK thật của bạn.
      const username = authResult?.user?.username ?? authResult?.username ?? "pi_user";
      const wallet = authResult?.user?.wallet_address ?? authResult?.wallet ?? "";

      // nếu cần role mặc định:
      const role = username === "nguyenminhduc1991111" ? "seller" : "customer";

      await login({
        username,
        wallet_address: wallet,
        role,
      });

      // không cần alert bắt buộc, useEffect sẽ điều hướng
    } catch (err) {
      console.error("Pi SDK login failed:", err);
      alert("❌ Lỗi khi đăng nhập qua Pi SDK. Dùng giả lập để test.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold mb-3">🔐 Đăng nhập Pi</h1>
        <p className="text-sm text-gray-600 mb-4">
          Đăng nhập bằng Pi Network (thực tế nếu bạn dùng Pi Browser) hoặc dùng nút giả lập để test.
        </p>

        <button
          onClick={handlePiSdkLogin}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded mb-3"
          type="button"
        >
          🔑 Đăng nhập bằng Pi SDK (nếu có)
        </button>

        <button
          onClick={handleFakeLogin}
          className="w-full bg-yellow-500 text-white px-4 py-2 rounded"
          type="button"
        >
          🔁 Đăng nhập giả lập (test seller)
        </button>

        <div className="mt-4 text-xs text-gray-400">
          <p className="mb-1">Test seller: username = <b>nguyenminhduc1991111</b></p>
          <p className="text-red-500">Nhắc: nút giả lập chỉ dùng trong giai đoạn phát triển!</p>
        </div>
      </div>
    </main>
  );
}
