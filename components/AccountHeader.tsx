"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getPiAccessToken } from "@/lib/piAuth";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

/* =========================
   TYPES
========================= */
interface Profile {
  avatar?: string | null;
  avatar_url?: string | null;
  shop_name?: string | null;
}

/* =========================
   COMPONENT
========================= */
export default function AccountHeader() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [avatar, setAvatar] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  /* =========================
     LOAD PROFILE
  ========================= */
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const token = await getPiAccessToken();

        const res = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) return;

        const raw: unknown = await res.json();

        if (
          typeof raw === "object" &&
          raw !== null &&
          "profile" in raw
        ) {
          const profile = (raw as { profile?: Profile }).profile;

          if (profile) {
            setAvatar(
              profile.avatar_url ??
              profile.avatar ??
              null
            );

            setShopName(profile.shop_name ?? null);
          }
        }
      } catch (err) {
        console.error("Load profile failed:", err);
        setAvatar(null);
      }
    };

    loadProfile();
  }, [user]);

  if (!user) return null;

  /* =========================
     RENDER
  ========================= */
  return (
    <section className="bg-orange-500 text-white p-6 text-center shadow">

      {/* AVATAR */}
      <div className="w-24 h-24 bg-white rounded-full mx-auto overflow-hidden shadow flex items-center justify-center">
        {avatar ? (
          <Image
            src={avatar}
            alt="Avatar"
            width={96}
            height={96}
            className="object-cover"
          />
        ) : (
          <UserCircle size={56} className="text-orange-500" />
        )}
      </div>

      {/* SHOP NAME */}
      {shopName && (
        <p className="mt-3 text-lg font-semibold">
          {shopName}
        </p>
      )}

      {/* USERNAME */}
      <p className="text-sm opacity-90">
        @{user.username}
      </p>

      {/* ROLE */}
      <p className="text-xs opacity-90">
        {user.role === "seller"
          ? t.seller
          : user.role === "admin"
          ? t.admin
          : t.customer}
      </p>

    </section>
  );
}
