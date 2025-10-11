"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  User,
  PlusCircle,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/cart", label: "Cart", icon: ShoppingCart },
    { href: "/account", label: "Account", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50 shadow-md">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center text-sm ${
          pathname === "/" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <Home size={22} />
        <span>Home</span>
      </Link>

      {/* ➕ post (ở giữa, nổi bật) */}
      <Link
        href="/add-product"
        className="flex flex-col items-center text-yellow-600 hover:text-yellow-700 relative -top-3"
      >
        <div className="bg-yellow-500 rounded-full p-3 shadow-lg hover:scale-110 transition">
          <PlusCircle size={28} className="text-white" />
        </div>
        <span className="text-xs font-medium mt-1">post</span>
      </Link>

      {/* Cart */}
      <Link
        href="/cart"
        className={`flex flex-col items-center text-sm ${
          pathname === "/cart" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <ShoppingCart size={22} />
        <span>Cart</span>
      </Link>

      {/* Account */}
      <Link
        href="/account"
        className={`flex flex-col items-center text-sm ${
          pathname === "/account" ? "text-blue-600" : "text-gray-500"
        }`}
      >
        <User size={22} />
        <span>Account</span>
      </Link>
    </nav>
  );
}
