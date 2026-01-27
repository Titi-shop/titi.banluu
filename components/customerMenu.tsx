"use client";

import { useRouter } from "next/navigation";
import {
  User,
  Package,
  Wallet,
  HelpCircle,
  MessageCircle,
  Globe,
  MapPin,
  Store,
  Clock,
  Truck,
  Star,
  RotateCcw,
} from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

export default function CustomerMenu() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  // 🔑 RBAC – source of truth
  const isSeller =
    user?.role === "seller" || user?.role === "admin";

  const sellerPath = isSeller
    ? "/seller"
    : "/seller/register-info";

  const sellerLabel = isSeller
    ? t.seller_center || "Seller Center"
    : t.register_seller || "Register Seller";

  const customerMenuItems = [
    { label: t.profile || "Profile", icon: <User size={22} />, path: "/customer/profile" },
    { label: t.my_orders || "My Orders", icon: <Package size={22} />, path: "/customer/orders" },
    { label: t.pi_wallet || "Pi Wallet", icon: <Wallet size={22} />, path: "/customer/wallet" },
    { label: t.messages || "Messages", icon: <MessageCircle size={22} />, path: "/messages" },
    { label: t.language || "Language", icon: <Globe size={22} />, path: "/language" },
    { label: t.shipping_address || "Shipping Address", icon: <MapPin size={22} />, path: "/customer/address" },
    { label: t.support || "Support", icon: <HelpCircle size={22} />, path: "/support" },
    { label: sellerLabel, icon: <Store size={22} />, path: sellerPath },
  ];

  return (
    <>
      {/* =========================
         🧾 ORDER SUMMARY (UI ONLY)
      ========================= */}
      <section className="bg-white mx-3 mt-4 p-4 rounded-2xl shadow border border-gray-100">
        <h2 className="text-lg font-semibold mb-3">
          {t.my_orders || "Đơn mua"}
        </h2>

        <div className="grid grid-cols-5 gap-2 text-center">
          <OrderItem icon={<Clock size={24} />} label={t.pending_orders || "Chờ xác nhận"} path="/customer/pending" />
          <OrderItem icon={<Package size={24} />} label={t.pickup_orders || "Chờ lấy hàng"} path="/customer/pickup" />
          <OrderItem icon={<Truck size={24} />} label={t.shipping_orders || "Đang giao"} path="/customer/shipping" />
          <OrderItem icon={<Star size={24} />} label={t.review_orders || "Đánh giá"} path="/customer/review" />
          <OrderItem icon={<RotateCcw size={24} />} label={t.return_orders || "Trả hàng"} path="/customer/returns" />
        </div>
      </section>

      {/* =========================
         📋 MAIN MENU
      ========================= */}
      <div className="bg-white mx-3 mt-4 p-5 rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          {customerMenuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center text-gray-700 hover:text-orange-500 transition"
            >
              <div className="p-3 rounded-full shadow-sm mb-1 bg-gray-100">
                {item.icon}
              </div>
              <span className="text-xs font-medium leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {!isSeller && (
          <div className="mt-4 text-center text-xs text-gray-500">
            {t.seller_note ||
              "You can register to become a seller and open your shop."}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================
   🔹 ORDER ITEM
========================= */
function OrderItem({
  icon,
  label,
  path,
}: {
  icon: React.ReactNode;
  label: string;
  path: string;
}) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(path)}
      className="flex flex-col items-center text-gray-700 hover:text-orange-500"
    >
      {icon}
      <span className="text-xs mt-1 leading-tight">{label}</span>
    </button>
  );
}
