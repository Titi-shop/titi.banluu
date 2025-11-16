"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Bell, User, PlusCircle } from "lucide-react";
import { useLanguage } from "../app/context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { translate } = useLanguage();

  // 🔹 Danh sách 5 mục chính (đã bỏ Tìm kiếm, thêm Đăng hàng)
  const navItems = [
    { href: "/", label: translate("home") || "Trang chủ", icon: Home },
    { href: "/shop", label: translate("category") || "Danh mục", icon: Grid },
    { href: "/seller", label: translate("post") || "Đăng hàng", icon: PlusCircle },
    { href: "/notifications", label: translate("notifications") || "Thông báo", icon: Bell },
    { href: "/account", label: translate("account") || "Tài khoản", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md flex justify-around py-2 z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center transition-all ${
              active ? "text-black font-semibold" : "text-gray-500 hover:text-black"
            }`}
          >
            <Icon className={`w-6 h-6 mb-1 ${active ? "fill-black" : ""}`} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
