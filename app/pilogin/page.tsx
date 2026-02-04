"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* =========================
   AUTH GATE ONLY
========================= */
export default function PiLoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // 👉 ĐÃ LOGIN → VÀO ACCOUNT
    if (user) {
      router.replace("/account");
      return;
    }

    // 👉 CHƯA LOGIN → VÀO ACCOUNT ĐỂ LOGIN
    router.replace("/account");
  }, [loading, user, router]);

  // ❌ Không UI
  return null;
}
