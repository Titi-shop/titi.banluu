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

  shop_banner?: string | null;
  shop_name?: string | null;
  shop_description?: string | null;
}

/* =========================
   COMPONENT
========================= */

export default function AccountHeader() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [shopDescription, setShopDescription] = useState<string | null>(null);

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
            setAvatar(profile.avatar_url ?? profile.avatar ?? null);
            setBanner(profile.shop_banner ?? null);
            setShopName(profile.shop_name ?? null);
            setShopDescription(profile.shop_description ?? null);
          }
        }
      } catch (err) {
        console.error("Load profile failed:", err);
      }
    };

    loadProfile();
  }, [user]);

  if (!user) return null;

  /* =========================
     RENDER
  ========================= */

  return (
    <section className="mb-16">

      {/* BANNER */}

      <div className="relative w-full h-40">

        {banner ? (
          <Image
            src={banner}
            alt="Shop banner"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-orange-500" />
        )}

      </div>

      {/* AVATAR */}

      <div className="flex justify-center -mt-12">

        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">

          {avatar ? (
            <Image
              src={avatar}
              alt="Avatar"
              fill
              className="object-cover"
            />
          ) : (
            <UserCircle size={56} className="text-orange-500" />
          )}

        </div>

      </div>

      {/* SHOP NAME */}

      <h2 className="text-center font-bold text-lg mt-3">
        {shopName || `@${user.username}`}
      </h2>

      {/* DESCRIPTION */}

      {shopDescription && (
        <p className="text-center text-gray-500 text-sm px-6 mt-1">
          {shopDescription}
        </p>
      )}

      {/* USERNAME */}

      <p className="text-center text-xs text-gray-400 mt-1">
        @{user.username}
      </p>

      {/* ROLE */}

      <p className="text-center text-xs text-gray-400 mt-1">
        {user.role === "seller"
          ? t.seller
          : user.role === "admin"
          ? t.admin
          : t.customer}
      </p>

    </section>
  );
}
