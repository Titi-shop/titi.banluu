"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [user, setUser] = useState<any>(null);
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const router = useRouter();

  // 🔹 Kiểm tra Pi Browser và khởi tạo SDK
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: false });
      setIsPiBrowser(true);

      // Nếu người dùng đã đăng nhập -> chuyển hướng luôn
      const saved = localStorage.getItem("pi_user");
      if (saved) {
        const userData = JSON.parse(saved);
        setUser(userData);
        router.push("/customer");
      }
    }
  }, [router]);

  // 🔹 Đăng nhập
  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang này bằng Pi Browser.");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});
      setUser(auth);

      // ✅ Lưu thông tin user vào localStorage
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");

      alert("🎉 Đăng nhập thành công!");
      router.push("/customer"); // 👉 chuyển hướng sang trang customer

    } catch (err: any) {
      console.error(err);
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  // 🔹 Đăng xuất
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
  };

  return (
    <main style={{ textAlign: "center", padding: "30px" }}>
      <h2>🔐 Đăng nhập bằng Pi Network</h2>

      {!isPiBrowser && (
        <p style={{ color: "red" }}>
          ⚠️ Vui lòng mở trang này bằng <b>Pi Browser</b> để đăng nhập.
        </p>
      )}

      {!user ? (
        <button
          onClick={handleLogin}
          style={{
            background: "#ff7b00",
            color: "#fff",
            border: "none",
            padding: "12px 25px",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Đăng nhập với Pi
        </button>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <p>Xin chào, <b>{user.user.username}</b></p>
          <p>Ví Pi: <b>{user.user.wallet_address || "Không có ví"}</b></p>
          <button
            onClick={handleLogout}
            style={{
              background: "#999",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </main>
  );
}
