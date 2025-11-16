"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function PiLoginPage() {
  const router = useRouter();
  const { user, piReady, pilogin } = useAuth();

  const [status, setStatus] = useState("⏳ Đang tải...");
  const [agreed, setAgreed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // ✅ Kiểm tra nếu user đã đăng nhập sẵn
  useEffect(() => {
    if (user) {
      // chỉ hiển thị dòng “Xin chào ...” trên trang, không toast
      setStatus(`🎉 Xin chào ${user.username}`);
      // đợi 1.2s rồi chuyển trang
      setTimeout(() => router.push("/customer"), 1200);
    } else {
      setIsChecking(false);
    }
  }, [user, router]);

  // ✅ Theo dõi trạng thái Pi SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!piReady) {
      setStatus("⚙️ Đang khởi động Pi SDK...");
      return;
    }
    if (!user) setStatus("");
  }, [piReady, user]);

  // ✅ Xử lý đăng nhập
  const handleLogin = async () => {
    if (!agreed) {
      setStatus("⚠️ Vui lòng đọc và đồng ý với điều khoản trước khi đăng nhập.");
      return;
    }
    if (!piReady || typeof window === "undefined" || !window.Pi) {
      setStatus("⚠️ Vui lòng mở bằng Pi Browser và chờ SDK load xong!");
      return;
    }

    try {
      setStatus("🔑 Đang xác thực tài khoản...");
      await pilogin();
      setStatus("✅ Đăng nhập thành công!");
      setTimeout(() => router.push("/customer"), 1200);
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
      setStatus("❌ Lỗi đăng nhập: " + (err.message || "Không rõ nguyên nhân"));
    }
  };

  // ✅ Trang kiểm tra đăng nhập
  if (isChecking) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-500 text-lg">
        ⏳ Đang kiểm tra đăng nhập...
      </main>
    );
  }

  // ✅ Giao diện chính
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6 relative">
      {/* 🔹 Trạng thái nhỏ, cố định phía trên nút */}
      {status && (
        <p className="text-gray-700 text-sm absolute top-[35%] whitespace-pre-line">
          {status}
        </p>
      )}

      {/* 🔹 Khu vực nút đăng nhập (được đẩy lên cao hơn một chút) */}
      <div className="flex flex-col items-center justify-center space-y-4 mt-[-60px]">
        <button
          onClick={handleLogin}
          disabled={!piReady || !agreed}
          className={`${
            piReady && agreed
              ? "bg-orange-500 hover:bg-orange-600 cursor-pointer"
              : "bg-gray-300 cursor-not-allowed"
          } text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md transition-all duration-200`}
        >
          Đăng nhập
        </button>

        {/* 🔹 Điều khoản */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            id="agree"
            checked={agreed}
            onChange={() => setAgreed(!agreed)}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <label htmlFor="agree" className="select-none">
            Tôi đồng ý {" "}
            <a
              href="https://www.termsfeed.com/live/7eae894b-14dd-431c-99da-0f94cab5b9ac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              《Điều khoản sử dụng》
            </a>{" "}
            và{" "}
            <a
              href="https://www.termsfeed.com/live/32e8bf86-ceaf-4eb6-990e-cd1fa0b0775e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500 underline"
            >
              《Chính sách bảo mật》
            </a>
          </label>
        </div>
      </div>

      {/* 🔹 Footer */}
      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © copyRight 2023 1pi.app
      </footer>
    </main>
  );
}
