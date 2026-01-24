"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { availableLanguages } from "@/app/lib/i18n";

export default function Navbar() {
  const { t, lang, setLang } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 bg-orange-500 p-3 text-white flex justify-between items-center shadow-md z-50">

      {/* 🛒 Icon giỏ hàng */}
      <Link href="/cart" aria-label="Giỏ hàng" className="flex items-center gap-1">
        <ShoppingCart size={20} />
        <span>{t.cart || "Cart"}</span>
      </Link>

      {/* 🌐 Chọn ngôn ngữ */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="bg-white text-black text-xs px-2 py-1 rounded"
      >
        {Object.entries(availableLanguages).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>

    </header>
  );
}
