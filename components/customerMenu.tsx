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
} from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

export default function CustomerMenu() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();

  // 🔑 RBAC – source of truth từ AuthContext
  const isSeller =
    user?.role === "seller" || user?.role === "admin";

  const sellerPath = isSeller
    ? "/seller"
    : "/seller/register-info";

  const sellerLabel = isSeller
    ? t.seller_center || "Quản lý bán hàng"
    : t.register_seller || "Đăng ký bán hàng";

  const customerMenuItems = [
    {
      label: t.profile,
      icon: <User size={22} />,
      path: "/customer/profile",
    },
    {
      label: t.my_orders,
      icon: <Package size={22} />,
      path: "/customer/orders",
    },
    {
      label: t.pi_wallet,
      icon: <Wallet size={22} />,
      path: "/customer/wallet",
    },
    {
      label: t.messages,
      icon: <MessageCircle size={22} />,
      path: "/messages",
    },
    {
      label: t.language,
      icon: <Globe size={22} />,
      path: "/language",
    },
    {
      label: t.shipping_address,
      icon: <MapPin size={22} />,
      path: "/customer/address",
    },
    {
      label: t.support,
      icon: <HelpCircle size={22} />,
      path: "/support",
    },

    // 🔑 SELLER ENTRY (1 NÚT – 2 HÀNH VI)
    {
      label: sellerLabel,
      icon: <Store size={22} />,
      path: sellerPath,
    },
  ];

  return (
    <div className="bg-white mx-3 mt-6 p-5 rounded-2xl shadow-lg border border-gray-100 mb-6">
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
            "Bạn có thể đăng ký bán hàng để mở gian hàng của mình."}
        </div>
      )}
    </div>
  );
}
