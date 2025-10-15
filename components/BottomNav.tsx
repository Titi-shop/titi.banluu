"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, User, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/account", label: "Account", icon: User },
  ];

  if (user?.role === "seller") {
    navItems.push({ href: "/seller", label: "Seller", icon: Store });
  }

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 bg-white border shadow-md rounded-2xl px-6 py-2 w-[90%] max-w-md flex justify-around z-50">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center transition-all ${
              active ? "text-blue-600 scale-110" : "text-gray-500 hover:text-blue-500"
            }`}
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
