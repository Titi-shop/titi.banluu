"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import AccountHeader from "@/components/AccountHeader";
import OrderSummary from "@/components/OrderSummary";
import CustomerMenu from "@/components/customerMenu";

/* =========================
   PAGE
========================= */
export default function AccountPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  /* =========================
     AUTH GUARD
  ========================= */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  /* =========================
     LOADING STATE (NO TEXT)
  ========================= */
  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
      </main>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <main className="bg-gray-100 pb-32 space-y-4">
      <AccountHeader />
      <OrderSummary />
      <CustomerMenu />

      {/* LOGOUT */}
      <section className="mx-4">
        <button
          onClick={logout}
          className="w-full py-4 bg-red-500 text-white rounded-2xl
            flex items-center justify-center gap-3 font-semibold text-lg shadow"
        >
          <LogOut size={22} />
          Đăng xuất
        </button>
      </section>
    </main>
  );
}
