"use client";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t shadow-lg">
      <ul className="flex justify-around py-2">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/cart">Cart</Link></li>
        <li><Link href="/account">Account</Link></li>
        {user?.role === "seller" && (
          <li><Link href="/seller">Seller</Link></li>
        )}
      </ul>
    </nav>
  );
}
