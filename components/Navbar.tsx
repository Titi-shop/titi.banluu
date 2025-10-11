"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white py-3 px-6 flex justify-between items-center">
      {/* Logo */}
      <h1 className="text-xl font-bold">🛍️ TiTi Shop</h1>

      {/* Các nút điều hướng */}
      <div className="space-x-4">
        <Link href="/" className="hover:text-yellow-400">
          Home
        </Link>
        <Link href="/shop" className="hover:text-yellow-400">
          Shop
        </Link>
        <Link href="/cart" className="hover:text-yellow-400">
          Cart
        </Link>
        <Link href="/checkout" className="hover:text-yellow-400">
          Checkout
        </Link>
        <Link href="/account" className="hover:text-yellow-400">
          Account
        </Link>
      </div>
    </nav>
  );
}
