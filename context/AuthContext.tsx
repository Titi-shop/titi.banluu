"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { isSellerByEnv } from "../utils/roles"; // ✅ kiểm tra quyền seller

interface User {
  username?: string;
  wallet_address?: string;
}

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("pi_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setIsSeller(isSellerByEnv(parsedUser)); // ✅ kiểm tra quyền
    }
  }, []);

  const login = async () => {
    try {
      if (typeof window === "undefined" || !window.Pi) {
        alert("⚠️ Vui lòng mở ứng dụng trong Pi Browser để đăng nhập!");
        return;
      }

      const scopes = ["username", "payments", "wallet_address"];
      const Pi = window.Pi;
      Pi.init({ version: "2.0" });

      const authResult = await Pi.authenticate(scopes, onIncompletePaymentFound);

      const loggedUser: User = {
        username: authResult.user.username,
        wallet_address: authResult.user.wallet_address,
      };

      setUser(loggedUser);
      localStorage.setItem("pi_user", JSON.stringify(loggedUser));
      setIsSeller(isSellerByEnv(loggedUser)); // ✅ xác định seller

      alert(`🎉 Đăng nhập thành công! Xin chào ${loggedUser.username}`);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      alert("Đăng nhập thất bại!");
    }
  };

  const logout = () => {
    setUser(null);
    setIsSeller(false);
    localStorage.removeItem("pi_user");
    alert("👋 Bạn đã đăng xuất.");
  };

  const onIncompletePaymentFound = (payment: any) => {
    console.log("Incomplete payment found:", payment);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isSeller }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
}
