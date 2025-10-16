"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null); // "seller" | "customer"

  // ✅ Load thông tin người dùng từ localStorage
  useEffect(() => {
    try {
      const savedRole = localStorage.getItem("user_role");
      const savedUser = localStorage.getItem("user_info");

      if (savedRole) setRole(savedRole);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (err) {
      console.error("❌ Lỗi khi đọc localStorage:", err);
    }
  }, []);

  // ✅ Chọn vai trò thủ công (giả lập)
  const chooseRole = (newRole: "seller" | "customer") => {
    const mockUser =
      newRole === "seller"
        ? { username: "nguyenminhduc1991111", wallet: "SELLER-MOCK" }
        : { username: "guest_user", wallet: "CUSTOMER-MOCK" };

    setRole(newRole);
    setUser(mockUser);
    localStorage.setItem("user_role", newRole);
    localStorage.setItem("user_info", JSON.stringify(mockUser));
  };

  // ✅ Đăng xuất
  const logout = () => {
    try {
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_info");
      localStorage.removeItem("pi_wallet");
      setRole(null);
      setUser(null);
      console.log("🚪 Đăng xuất thành công");
    } catch (err) {
      console.error("❌ Lỗi khi đăng xuất:", err);
    }
  };

  // ✅ Đăng nhập bằng Pi SDK thật
  const piLogin = async () => {
    try {
      if (typeof window === "undefined" || !(window as any).Pi) {
        alert("⚠️ Pi SDK chưa sẵn sàng. Hãy mở bằng Pi Browser.");
        return;
      }

      const Pi = (window as any).Pi;
      const scopes = ["username", "payments"];
      const auth = await Pi.authenticate(scopes, (payment: any) => {
        console.log("Payment callback:", payment);
      });

      const piUser = {
        username: auth.user.username,
        wallet: auth.user.wallet_address,
      };

      setUser(piUser);
      localStorage.setItem("user_info", JSON.stringify(piUser));
      console.log("✅ Đăng nhập Pi thành công:", piUser);
      alert("✅ Đăng nhập Pi thành công!");
    } catch (err) {
      console.error("❌ Lỗi đăng nhập Pi:", err);
      alert("Đăng nhập Pi thất bại. Kiểm tra lại SDK.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, chooseRole, logout, piLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
