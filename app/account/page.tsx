"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/context/AuthContext";
import AccountHeader from "@/components/AccountHeader";
import OrderSummary from "@/components/OrderSummary";
import CustomerMenu from "@/components/customerMenu";

export default function AccountPage() {
  const router = useRouter();
  const t = useTranslations();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/pilogin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ {t("authenticating")}
      </main>
    );
  }

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
          {t("logout")}
        </button>
      </section>
    </main>
  );
}
