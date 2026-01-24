"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type CartItem = {
  id: number;
  name: string;
  price: number | string;
  description?: string;
  images?: string[];
  quantity?: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateQty: (id: number, qty: number) => void;
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
          p.id === item.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCart = () => setCart([]);

  const updateQty = (id: number, qty: number) => {
    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p)));
  };

  const total = cart.reduce(
    (s, item) => s + (Number(item.price) || 0) * (item.quantity ?? 1),
    0
  );

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQty, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
