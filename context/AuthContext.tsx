"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

interface User {
  uid: string;
  username: string;
  accessToken: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 🔁 Lấy user từ localStorage khi load lại trang
  useEffect(() => {
    const savedUser = localStorage.getItem("piUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 🟢 Hàm login — lưu user vào cả state và localStorage
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("piUser", JSON.stringify(userData));
  };

  // 🔴 Hàm logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("piUser");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
