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

  const isSeller = user?.role === "seller";

  const customerMenuItems = [
    { label: t.profile, icon: <User size={22} />, path: "/customer/profile" },
    { label: t.my_orders, icon: <Package size={22} />, path: "/customer/orders" },
    { label: t.pi_wallet, icon: <Wallet size={22} />, path: "/customer/wallet" },
    { label: t.messages, icon: <MessageCircle size={22} />, path: "/messages" },
    { label: t.language, icon: <Globe size={22} />, path: "/language" },
    { label: t.shipping_address, icon: <MapPin size={22} />, path: "/customer/address" },
    { label: t.support, icon: <HelpCircle size={22} />, path: "/support" },

    // 🔑 SELLER ENTRY (kế bên Customer Support)
    isSeller
      ? {
          label: t.seller_center || "Quản lý bán hàng",
          icon: <Store size={22} />,
          path: "/seller",
        }
      : {
          label: t.register_seller || "Đăng ký bán hàng",
          icon: <Store size={22} />,
          path: "/seller/register-info",
        },
  ];

  return (
    <div className="bg-white mx-3 mt-6 p-5 rounded-2xl shadow-lg border border-gray-100 mb-6">
      {/* ===== CUSTOMER MENU ===== */}
      <div className="grid grid-cols-4 gap-4 text-center">
        {customerMenuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500 transition"
          >
            <div
              className={`p-3 rounded-full shadow-sm mb-1
                ${
                  item.path === "/seller"
                    ? "bg-orange-100 text-orange-600"
                    : "bg-gray-100"
                }`}
            >
              {item.icon}
            </div>
            <span className="text-xs font-medium leading-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* ===== SELLER NOTE (GĐ1) ===== */}
      {!isSeller && (
        <div className="mt-4 text-center text-xs text-gray-500">
          {t.seller_note ||
            "Chức năng đăng ký bán hàng sẽ được mở ở giai đoạn tiếp theo."}
        </div>
      )}
    </div>
  );
}
