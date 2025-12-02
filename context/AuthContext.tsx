"use client";

import { createContext, useContext, useState, useEffect } from "react";

// 🔹 Interface chứa thông tin người dùng Pi
interface PiUser {
  username: string;
  accessToken: string;
  uid?: string;
}

// 🔹 Interface cho payment của PiSDK
interface PiPayment {
  identifier: string;
  paymentId: string;
  txid?: string;
  amount: number;
}

// 🔹 Interface cho Pi SDK trên trình duyệt
interface PiSDK {
  init: (config: { version: string; sandbox: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound: (payment: PiPayment) => void
  ) => Promise<{ user: { username: string }; accessToken: string }>;
  logout?: () => void;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

// 🔹 Interface Context chính
interface AuthContextType {
  user: PiUser | null;
  piReady: boolean;
  loading: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  piReady: false,
  loading: true,
  pilogin: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [piReady, setPiReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🟢 Kiểm tra môi trường Pi SDK thật hay mock
  const checkPiSDK = () => {
    return (
      typeof window !== "undefined" &&
      navigator.userAgent.includes("PiBrowser") &&
      window.Pi &&
      typeof window.Pi.authenticate === "function"
    );
  };

  // 🛠 Kiểm tra SDK & khởi tạo
  useEffect(() => {
    if (typeof window !== "undefined" && window.Pi && checkPiSDK()) {
      try {
        window.Pi.init({ version: "2.0", sandbox: true });
        console.log("🚀 Pi SDK initialized");
        setPiReady(true);
      } catch (err) {
        console.error("❌ Lỗi khởi tạo Pi SDK:", err);
        setPiReady(true);
      }
    } else {
      // Chế độ mock
      console.warn("⚠️ Pi SDK không có — bật mock mode");
      setPiReady(true);
    }
  }, []);

  // 🔁 Khôi phục session
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pi_user");
      if (saved) {
        const parsed: PiUser = JSON.parse(saved);
        if (parsed?.username && parsed?.accessToken) {
          setUser(parsed);
          localStorage.setItem("titi_username", parsed.username);
          localStorage.setItem("titi_is_logged_in", "true");
        }
      }
    } catch (err) {
      console.error("❌ Lỗi đọc pi_user:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🎭 Mock login
  const mockLogin = () => {
    const mockUser: PiUser = {
      username: "mock_user",
      accessToken: "mock_token_123",
    };
    setUser(mockUser);
    localStorage.setItem("pi_user", JSON.stringify(mockUser));
    localStorage.setItem("titi_is_logged_in", "true");
    localStorage.setItem("titi_username", mockUser.username);
    alert("🤖 Đăng nhập mock thành công!");
  };

  // 🔐 Đăng nhập bằng Pi Network hoặc Mock
  const pilogin = async () => {
    const hasRealPi = checkPiSDK();

    if (hasRealPi) {
      try {
        const auth = await window.Pi!.authenticate(["username", "payments"], (payment) =>
          console.log("⚠ Payment chưa hoàn tất:", payment)
        );

        const piUser: PiUser = {
          username: auth.user.username,
          accessToken: auth.accessToken,
        };

        setUser(piUser);
        localStorage.setItem("pi_user", JSON.stringify(piUser));
        localStorage.setItem("titi_username", piUser.username);
        localStorage.setItem("titi_is_logged_in", "true");
        alert("🔐 Đăng nhập Pi thành công!");
      } catch (err) {
        console.error("❌ Lỗi đăng nhập Pi:", err);
        alert("⚠ Pi Login thất bại — dùng mock login");
        mockLogin();
      }
    } else {
      mockLogin();
    }
  };

  // 🚪 Đăng xuất
  const logout = () => {
    setUser(null);
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("titi_username");

    if (typeof window !== "undefined" && window.Pi?.logout) {
      try {
        window.Pi.logout();
      } catch {
        console.warn("⚠️ Pi SDK không hỗ trợ logout");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, piReady, loading, pilogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
