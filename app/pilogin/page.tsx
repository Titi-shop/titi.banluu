"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PiLoginPage() {
  const [isPiBrowser, setIsPiBrowser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi) {
      window.Pi.init({ version: "2.0", sandbox: true });
      setIsPiBrowser(true);

      const saved = localStorage.getItem("pi_user");
      const isLoggedIn = localStorage.getItem("titi_is_logged_in");

      // ✅ Nếu đã đăng nhập → chuyển thẳng đến /customer
      if (saved && isLoggedIn === "true") {
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

      // ✅ Lưu user và trạng thái đăng nhập
      localStorage.setItem("pi_user", JSON.stringify(auth));
      localStorage.setItem("titi_is_logged_in", "true");
      localStorage.setItem("titi_username", username);

      alert(`🎉 Đăng nhập thành công! Xin chào ${username}`);
      router.replace("/customer");
    } catch (err: any) {
      console.error("❌ Lỗi đăng nhập:", err);
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
          marginTop: "20px",
        }}
      >
        Đăng nhập với Pi
      </button>
    </main>
  );
}
