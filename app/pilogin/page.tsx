"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // ✅ Kiểm tra có Pi Browser hay không
    if (typeof window !== "undefined" && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: false });
      setIsPiBrowser(true);

      // ✅ Nếu người dùng đã đăng nhập trước đó thì chuyển thẳng đến /customer
      const saved = localStorage.getItem("pi_user");
      if (saved) {
        router.replace("/customer");
      }
    }
  }, [router]);

  const handleLogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở trang này bằng Pi Browser.");
      return;
    }

    try {
      const scopes = ["username", "payments", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, () => {});

      const username = auth?.user?.username || "guest_user";

      // ✅ Lưu thông tin người dùng
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);
      localStorage.setItem("titi_role", "customer"); // luôn là customer

      alert(`🎉 Đăng nhập thành công với tài khoản: ${username}`);
      router.replace("/customer");
    } catch (err: any) {
      console.error(err);
      alert("❌ Lỗi đăng nhập: " + err.message);
    }
  };

  return (
    <main style={{ textAlign: "center", padding: "30px" }}>
      <h2>🔐 Đăng nhập bằng Pi Network</h2>
      {!isPiBrowser && (
        <p style={{ color: "red" }}>
          ⚠️ Vui lòng mở trang này bằng <b>Pi Browser</b> để đăng nhập.
        </p>
      )}
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
    </main>
  );
}
