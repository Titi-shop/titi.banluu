"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

import AccountHeader from "@/components/AccountHeader";
import OrderSummary from "@/components/OrderSummary";
import CustomerMenu from "@/components/customerMenu";

/* =========================
   PAGE
========================= */
export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
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
     LOADING / NOT LOGIN
  ========================= */
if (!user) {
  return null;
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
          {t.logout}
        </button>
      </section>
    </main>
  );
}
