"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogOut } from "lucide-react";

import CustomerPage from "../customer/page";
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Đang xác thực…
      </main>
    );
  }

  return (
    <main className="bg-gray-100 pb-32 space-y-6">
      <CustomerPage embedded />
      <CustomerMenu />

      <section className="mx-4">
        <button
          onClick={logout}
          className="w-full py-4 bg-red-500 hover:bg-red-600
            text-white rounded-2xl flex items-center justify-center
            gap-3 font-semibold text-lg shadow-lg"
        >
          <LogOut size={22} />
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
