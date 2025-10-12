"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

interface UserData {
  username: string;
  wallet_address?: string;
  accessToken?: string;
}

interface AuthContextType {
  user: UserData | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);

  // ✅ Tự động khôi phục khi reload
  useEffect(() => {
    const saved = localStorage.getItem("pi_user");
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
    }
  }, []);

  // ✅ Hàm login qua Pi SDK
  const login = async () => {
    if (typeof window === "undefined" || !window.Pi) {
      alert("⚠️ Vui lòng mở trang này trong Pi Browser để đăng nhập!");
      return;
    }

    try {
      window.Pi.init({ version: "2.0", sandbox: false });

      const userInfo = await window.Pi.authenticate(
        ["username", "wallet_address"],
        () => {}
      );

      const userData = {
        username: userInfo.user.username,
        wallet_address: userInfo.user.wallet_address,
        accessToken: userInfo.accessToken,
      };

      setUser(userData);
      localStorage.setItem("pi_user", JSON.stringify(userData));
      localStorage.setItem("titi_is_logged_in", "true");

      alert(`🎉 Chào mừng ${userData.username}!`);
    } catch (err) {
      console.error("❌ Lỗi đăng nhập Pi:", err);
      alert("Lỗi đăng nhập, vui lòng thử lại!");
    }
  };

  // ✅ Hàm logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được sử dụng trong AuthProvider");
  return ctx;
};
