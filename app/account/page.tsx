"use client";

import { useEffect, useState } from "react";

export default function AccountPage() {
  const [piUser, setPiUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Kết nối Pi SDK khi trang load
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Pi) {
      const Pi = (window as any).Pi;
      Pi.init({ version: "2.0" });
    } else {
      setError("⚠️ Pi SDK chưa được tải — hãy mở trang này trong Pi Browser.");
    }
  }, []);

  // Hàm đăng nhập bằng Pi
  const handleLogin = async () => {
    try {
      const scopes = ["username", "payments"];
      const Pi = (window as any).Pi;

      const auth = await Pi.authenticate(scopes, (payment) => {
        console.log("payment:", payment);
      });

      console.log("User authenticated:", auth.user);
      setPiUser(auth.user);
    } catch (err: any) {
      console.error("Pi login error:", err);
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6"></h1>

      {!piUser ? (
        <>
          <button
            onClick={handleLogin}
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg shadow hover:bg-yellow-600 transition"
          >
            Login
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </>
      ) : (
        <div className="text-center">
          <p className="text-xl mb-2">Welcome, {piUser.username} 🎉</p>
          <p className="text-gray-600">User ID: {piUser.uid}</p>
          <button
            className="mt-4 text-sm text-blue-600 underline"
            onClick={() => setPiUser(null)}
          >
            Log out
          </button>
        </div>
      )}
    </main>
  );
}