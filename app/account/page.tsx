"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../context/LanguageContext";

export default function AccountPage() {
  const router = useRouter();
  const { translate } = useLanguage();

  // ✅ Khi vào trang account, tự động điều hướng sang /customer
  useEffect(() => {
    router.push("/customer");
  }, [router]);

  return (
    <main className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">{translate("account")}</h1>
      <p className="text-gray-600">{translate("redirecting_to_customer")}</p>
      <div className="mt-4 animate-pulse text-yellow-600">
        ⏳ {translate("loading")}
      </div>
    </main>
  );
}
