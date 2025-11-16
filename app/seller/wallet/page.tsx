"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import {
  Wallet as WalletIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  LogOut,
} from "lucide-react";

export default function SellerWalletPage() {
  const router = useRouter();
  const { translate } = useLanguage();
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<string>("customer");
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra đăng nhập Pi + xác định vai trò người dùng
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("pi_user");
      const logged = localStorage.getItem("titi_is_logged_in");

      if (!storedUser || logged !== "true") {
        router.replace("/pilogin");
        return;
      }

      const parsed = JSON.parse(storedUser);
      const name = parsed?.user?.username || parsed?.username || "guest_user";
      setUsername(name);

      // 🔹 Kiểm tra role — mặc định là "customer" nếu không có
      const userRole =
        parsed?.role ||
        parsed?.user?.role ||
        localStorage.getItem("user_role") ||
        "customer";
      setRole(userRole);

      if (userRole !== "seller" && userRole !== "admin") {
        alert("⚠️ Tài khoản này không thuộc khu vực người bán!");
        router.replace("/customer");
        return;
      }

      // ✅ Load dữ liệu ví riêng theo username
      const storedBalance = localStorage.getItem(`wallet_${name}_balance`);
      const storedTx = localStorage.getItem(`wallet_${name}_transactions`);
      setBalance(storedBalance ? parseFloat(storedBalance) : 0);
      setTransactions(storedTx ? JSON.parse(storedTx) : []);
    } catch (err) {
      console.error("❌ Lỗi đọc dữ liệu:", err);
      router.replace("/pilogin");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // 🪙 Thêm giao dịch mẫu
  const addTransaction = (type: string, amount: number) => {
    const newTx = {
      id: Date.now(),
      type,
      amount,
      date: new Date().toLocaleString(),
    };

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    localStorage.setItem(
      `wallet_${username}_transactions`,
      JSON.stringify(updatedTx)
    );

    const newBalance =
      type === "deposit" ? balance + amount : Math.max(balance - amount, 0);
    setBalance(newBalance);
    localStorage.setItem(`wallet_${username}_balance`, newBalance.toString());
  };

  // 🚪 Đăng xuất
  const handleLogout = async () => {
    try {
      if (window.Pi && typeof window.Pi.logout === "function") {
        await window.Pi.logout();
      }
    } catch {}
    localStorage.removeItem("pi_user");
    localStorage.removeItem("titi_is_logged_in");
    localStorage.removeItem("user_role");
    router.push("/pilogin");
  };

  if (loading)
    return (
      <main className="text-center mt-10 text-gray-500">
        ⏳ {translate("loading_wallet") || "Đang tải ví..."}
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-5">
        {/* ===== Header ===== */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-semibold text-gray-800">
              {translate("seller_wallet") || "Ví Người Bán"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
          >
            <LogOut size={16} />
            {translate("logout") || "Đăng xuất"}
          </button>
        </div>

        {/* ===== Thông tin Seller ===== */}
        <p className="text-center text-gray-500 mb-3">
          👤 {translate("seller_label") || "Người bán"}:{" "}
          <span className="font-semibold">{username}</span>
          <br />
          <span className="text-sm text-gray-400">
            ({role === "admin" ? "Quản trị viên" : "Tài khoản người bán"})
          </span>
        </p>

        {/* ===== Số dư ===== */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 rounded-xl mb-4 text-center">
          <p className="text-sm opacity-80">
            {translate("current_balance") || "Số dư hiện tại"}
          </p>
          <h2 className="text-3xl font-bold">{balance.toFixed(2)} π</h2>
        </div>

        {/* ===== Nút thao tác ===== */}
        <div className="flex justify-around mb-5">
          <button
            onClick={() => addTransaction("deposit", 1)}
            className="flex flex-col items-center text-green-600 hover:scale-105 transition-transform"
          >
            <ArrowDownCircle className="w-7 h-7" />
            <span className="text-sm">
              {translate("deposit") || "Nạp Pi"}
            </span>
          </button>
          <button
            onClick={() => addTransaction("withdraw", 0.5)}
            className="flex flex-col items-center text-red-500 hover:scale-105 transition-transform"
          >
            <ArrowUpCircle className="w-7 h-7" />
            <span className="text-sm">
              {translate("withdraw") || "Rút Pi"}
            </span>
          </button>
          <button
            onClick={() => router.push("/seller")}
            className="flex flex-col items-center text-blue-500 hover:scale-105 transition-transform"
          >
            <History className="w-7 h-7" />
            <span className="text-sm">
              {translate("back_dashboard") || "Trang người bán"}
            </span>
          </button>
        </div>

        {/* ===== Lịch sử giao dịch ===== */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            {translate("transaction_history") || "Lịch sử giao dịch"}
          </h3>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center">
              {translate("no_transactions") || "Chưa có giao dịch nào."}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex justify-between items-center py-2 text-sm"
                >
                  <span
                    className={`font-medium ${
                      tx.type === "deposit" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {tx.type === "deposit"
                      ? translate("deposit") || "Nạp"
                      : translate("withdraw") || "Rút"}{" "}
                    {tx.amount} π
                  </span>
                  <span className="text-gray-400">{tx.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
