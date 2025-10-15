"use client";

import { createContext, useContext, useEffect, useState } from "react";

// ✅ Tạo Context mặc định
const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null); // "seller" | "customer"

  // ✅ Khi app load, lấy thông tin từ localStorage
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

  // ✅ Hàm chọn vai trò
  const chooseRole = (newRole: "seller" | "customer") => {
    const mockUser =
      newRole === "seller"
        ? { username: "nguyenminhduc1991111", wallet: "SELLER-MOCK" }
        : { username: "guest_user", wallet: "CUSTOMER-MOCK" };

    setRole(newRole);
    setUser(mockUser);

    // 🔒 Lưu vào localStorage
    localStorage.setItem("user_role", newRole);
    localStorage.setItem("user_info", JSON.stringify(mockUser));
  };

  // ✅ Đăng xuất (đã sửa chuẩn)
  const logout = () => {
    try {
      // Xóa dữ liệu trong localStorage nhưng không dùng clear() (để không xóa giỏ hàng)
      localStorage.removeItem("user_role");
      localStorage.removeItem("user_info");
      localStorage.removeItem("pi_wallet");

      // Reset state
      setRole(null);
      setUser(null);

      console.log("🚪 Đăng xuất thành công");
    } catch (err) {
      console.error("❌ Lỗi khi đăng xuất:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, chooseRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Custom hook để dùng ở các trang khác
export const useAuth = () => useContext(AuthContext);
