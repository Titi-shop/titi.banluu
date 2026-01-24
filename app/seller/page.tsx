"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PackagePlus, Package, ClipboardList } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function SellerPage() {
  const { user, loading, piReady } = useAuth();
const canOperate = user?.role === "seller";
  const { t } = useTranslation();

  if (loading || !piReady) {
    return (
      <p className="text-center mt-10 text-gray-500">
        ⏳ {t.loading || "Đang tải..."}
      </p>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold text-gray-700 mb-6">
        {t.seller_platform || "Seller Platform"}
      </h1>

      <div className="grid grid-cols-3 gap-6 text-center mb-10">
        {/* Post Product */}
        <Link
          href={canOperate ? "/seller/post" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : ""}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <PackagePlus className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium">
            {t.post_product || "Post Product"}
          </p>
        </Link>

        {/* Stock */}
        <Link
          href={canOperate ? "/seller/stock" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : ""}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <Package className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium">
            {t.stock || "Stock"}
          </p>
        </Link>

        {/* Orders */}
        <Link
          href={canOperate ? "/seller/orders" : "#"}
          className={!canOperate ? "pointer-events-none opacity-40" : ""}
        >
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow">
            <ClipboardList className="w-8 h-8 text-gray-700" />
          </div>
          <p className="mt-3 text-sm font-medium">
            {t.seller_orders || "Seller Orders"}
          </p>
        </Link>
      </div>
    </main>
  );
}
