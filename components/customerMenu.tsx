"use client";

import { useState } from "react";
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
  const { user, pilogin } = useAuth();

  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerMessage, setSellerMessage] = useState<string | null>(null);

  // 🔑 RBAC
  const isSeller =
    user?.role === "seller" || user?.role === "admin";

  /* =========================
     SELLER BUTTON HANDLER
  ========================= */
  async function handleSellerClick() {
    // 1️⃣ Chưa đăng nhập → Pi login
    if (!user) {
      await pilogin();
      return;
    }

    // 2️⃣ Đã là seller → vào seller dashboard
    if (isSeller) {
      router.push("/seller");
      return;
    }

    // 3️⃣ Đăng ký seller (KHÔNG CHUYỂN TRANG)
    try {
      setSellerLoading(true);
      setSellerMessage(null);

      const token = localStorage.getItem("pi_access_token");
      if (!token) {
        setSellerMessage("⚠️ Chưa đăng nhập");
        return;
      }

      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const err =
          typeof data === "object" &&
          data !== null &&
          "error" in data
            ? String((data as { error: string }).error)
            : "Đăng ký thất bại";

        setSellerMessage(`❌ ${err}`);
        return;
      }

      // ✅ THÀNH CÔNG
      setSellerMessage(
        "✅ Đã gửi yêu cầu đăng ký bán hàng. Vui lòng chờ duyệt."
      );
    } catch (err) {
      console.error("SELLER REGISTER ERROR:", err);
      setSellerMessage("❌ Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSellerLoading(false);
    }
  }

  /* =========================
     MENU ITEMS
  ========================= */
  const customerMenuItems: Array<{
    label: string;
    icon: JSX.Element;
    path?: string;
    onClick?: () => void;
  }> = [
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
    {
      label: isSeller
        ? t.seller_center || "Quản lý bán hàng"
        : t.register_seller || "Đăng ký bán hàng",
      icon: <Store size={22} />,
      onClick: handleSellerClick,
    },
  ];

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="bg-white mx-3 mt-6 p-5 rounded-2xl shadow-lg border border-gray-100 mb-6">
      <div className="grid grid-cols-4 gap-4 text-center">
        {customerMenuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else if (item.path) {
                router.push(item.path);
              }
            }}
            disabled={sellerLoading && item.onClick !== undefined}
            className="flex flex-col items-center text-gray-700 hover:text-orange-500 transition disabled:opacity-60"
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

      {/* MESSAGE */}
      {sellerMessage && (
        <div
          className={`mt-4 text-center text-sm ${
            sellerMessage.startsWith("✅")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {sellerMessage}
        </div>
      )}

      {!isSeller && !sellerMessage && (
        <div className="mt-4 text-center text-xs text-gray-500">
          {t.seller_note ||
            "Bạn có thể đăng ký bán hàng để mở gian hàng của mình."}
        </div>
      )}
    </div>
  );
}
