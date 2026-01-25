// context/AuthContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/* =========================
   TYPES
========================= */
export type PiUser = {
  pi_uid: string;
  username: string;
  wallet_address?: string | null;
  role: "customer" | "seller" | "admin";
};

type AuthContextType = {
  user: PiUser | null;
  loading: boolean;
  piReady: boolean;
  pilogin: () => Promise<void>;
  logout: () => void;
};

type PiAuthResult = {
  accessToken?: string;
};

declare global {
  interface Window {
    __pi_inited?: boolean;
    Pi?: {
      init: (options: { version: string; sandbox: boolean }) => void;
      authenticate: (scopes: string[]) => Promise<PiAuthResult>;
    };
  }
}

/* =========================
   CONSTANTS (BOOTSTRAP)
========================= */
const TOKEN_KEY = "pi_access_token";
const USER_KEY = "pi_user";

/* =========================
   CONTEXT
========================= */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  piReady: false,
  pilogin: async () => {},
  logout: () => {},
});

/* =========================
   PROVIDER
========================= */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [piReady, setPiReady] = useState(false);

  /* -------------------------
     INIT PI SDK (ONCE)
  ------------------------- */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.Pi && !window.__pi_inited) {
      window.Pi.init({
        version: "2.0",
        sandbox: process.env.NEXT_PUBLIC_PI_ENV === "testnet",
      });
      window.__pi_inited = true;
    }

    const timer = setInterval(() => {
      if (window.Pi) {
        setPiReady(true);
        clearInterval(timer);
      }
    }, 300);

    return () => clearInterval(timer);
  }, []);

  /* -------------------------
     LOAD LOCAL SESSION
     (AUTH-CENTRIC)
  ------------------------- */
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (rawUser && token) {
        setUser(JSON.parse(rawUser));
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------------------------
     LOGIN WITH PI
     (ONLY PLACE CALL authenticate)
  ------------------------- */
  const pilogin = async () => {
    if (!window.Pi) {
      alert("⚠️ Vui lòng mở ứng dụng trong Pi Browser");
      return;
    }

    try {
      setLoading(true);

      const auth = await window.Pi.authenticate(["username"]);
      if (!auth?.accessToken) {
        alert("❌ Không lấy được accessToken");
        return;
      }

      const token = auth.accessToken;

      // Verify token with backend (NETWORK-FIRST)
      const res = await fetch("/api/pi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token }),
      });

      const data = await res.json();

      if (!res.ok || !data?.success || !data?.user) {
        alert("❌ Pi verify thất bại");
        return;
      }

      const verifiedUser: PiUser = data.user;

      // Persist session (BOOTSTRAP: localStorage)
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));

      setUser(verifiedUser);
    } catch (err) {
      console.error("❌ Pi login error:", err);
      alert("❌ Lỗi đăng nhập Pi");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------
     LOGOUT
  ------------------------- */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        piReady,
        pilogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */
export const useAuth = () => useContext(AuthContext);
