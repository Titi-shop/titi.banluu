"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  description?: string;
  thumbnail?: string;
  image?: string;
  images?: string[];
  quantity?: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQty: (id: string, qty: number) => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      setCart(raw ? JSON.parse(raw) : []);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);

      if (found) {
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: (p.quantity || 1) + (item.quantity || 1) }
            : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: item.quantity ?? 1,
          thumbnail: item.thumbnail || item.image || item.images?.[0] || "",
          image: item.image || item.thumbnail || item.images?.[0] || "",
          images: item.images || [],
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCart = () => setCart([]);

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(1, Math.min(99, qty || 1)) } : p
      )
    );
  };

  const total = cart.reduce((s, item) => {
    const unit =
      typeof item.sale_price === "number"
        ? item.sale_price
        : Number(item.price) || 0;

    return s + unit * (item.quantity ?? 1);
  }, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQty, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
