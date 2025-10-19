"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowUpCircle, ArrowDownCircle, History } from "lucide-react";

export default function SellerWalletPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // ✅ Chỉ cho phép truy cập nếu là tài khoản "nguyenminhduc1991111"
  useEffect(() => {
    const userData = localStorage.getItem("pi_user");
    if (!userData) {
      router.push("/pilogin");
      return;
    }

    const user = JSON.parse(userData);
    const name = user?.user?.username;
    setUsername(name);

    if (name !== "nguyenminhduc1991111") {
      alert("⚠️ Bạn không có quyền truy cập ví Seller!");
      router.replace("/customer");
    } else {
      // 🔹 Load dữ liệu ví từ localStorage (hoặc API)
      const storedBalance = localStorage.getItem("seller_balance");
      const storedTx = localStorage.getItem("seller_transactions");

      setBalance(storedBalance ? parseFloat(storedBalance) : 0);
      setTransactions(storedTx ? JSON.parse(storedTx) : []);
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
    localStorage.setItem("seller_transactions", JSON.stringify(updatedTx));

    const newBalance =
      type === "deposit" ? balance + amount : Math.max(balance - amount, 0);
    setBalance(newBalance);
    localStorage.setItem("seller_balance", newBalance.toString());
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-semibold text-gray-800">
            Ví của Seller
          </h1>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 rounded-xl mb-4 text-center">
          <p className="text-sm opacity-80">Số dư hiện tại</p>
          <h2 className="text-3xl font-bold">{balance.toFixed(2)} π</h2>
        </div>

        <div className="flex justify-around mb-5">
          <button
            onClick={() => addTransaction("deposit", 1)}
            className="flex flex-col items-center text-green-600 hover:scale-105 transition-transform"
          >
            <ArrowDownCircle className="w-7 h-7" />
            <span className="text-sm">Nạp Pi</span>
          </button>
          <button
            onClick={() => addTransaction("withdraw", 0.5)}
            className="flex flex-col items-center text-red-500 hover:scale-105 transition-transform"
          >
            <ArrowUpCircle className="w-7 h-7" />
            <span className="text-sm">Rút Pi</span>
          </button>
          <button
            onClick={() => router.push("/seller")}
            className="flex flex-col items-center text-blue-500 hover:scale-105 transition-transform"
          >
            <History className="w-7 h-7" />
            <span className="text-sm">Đơn hàng</span>
          </button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Lịch sử giao dịch
          </h3>
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-center">Chưa có giao dịch nào.</p>
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
                    {tx.type === "deposit" ? "Nạp" : "Rút"} {tx.amount} π
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
