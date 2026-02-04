"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import AccountHeader from "@/components/AccountHeader";
import OrderSummary from "@/components/OrderSummary";
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, loading, pilogin, logout, piReady } = useAuth();

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return null;
  }

  /* =========================
     NOT LOGGED IN → LOGIN HERE
  ========================= */
  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-6 text-center">
        <h1 className="text-xl font-semibold mb-4">
          {t.account}
        </h1>

        <button
          onClick={pilogin}
          disabled={!piReady}
          className={`px-8 py-3 rounded-full font-semibold shadow text-white ${
            piReady
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-gray-300"
          }`}
        >
          {t.login}
        </button>
      </main>
    );
  }

  /* =========================
     LOGGED IN → DASHBOARD
  ========================= */
  return (
    <main className="bg-gray-100 pb-32 space-y-4">
      <AccountHeader />
      <OrderSummary />
      <CustomerMenu />

      <section className="mx-4">
        <button
          onClick={logout}
          className="w-full py-4 bg-red-500 text-white rounded-2xl
            flex items-center justify-center gap-3 font-semibold text-lg shadow"
        >
          <LogOut size={22} />
          {t.logout}
        </button>
      </section>
    </main>
  );
}
