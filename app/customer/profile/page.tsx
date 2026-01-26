"use client";
export const dynamic = "force-dynamic";


import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { apiFetchForm } from "@/lib/apiFetchForm";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Edit3 } from "lucide-react";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import { useAuth } from "@/context/AuthContext";

/* =========================
   TYPES
========================= */
interface ProfileData {
  display_name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  country: string;
  avatar: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* =======================
     LOAD PROFILE (COOKIE-BASED)
  ======================= */
useEffect(() => {
  if (authLoading) return;

  if (!user) {
    setLoading(false);
    return;
  }

  const loadProfile = async () => {
    try {
      const res = await apiFetch("/api/profile");

      if (!res.ok) {
        throw new Error("unauthorized");
      }

      const data = await res.json();
      setProfile(data.profile ?? data);
    } catch (err) {
      console.error(err);
      setError(t.profile_error_loading);
    } finally {
      setLoading(false);
    }
  };

  loadProfile();
}, [authLoading, user, t]);

  /* =======================
     UPLOAD AVATAR (COOKIE-BASED)
  ======================= */
  const handleFileChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file || !user) return;

  setPreview(URL.createObjectURL(file));
  setUploading(true);

  try {
    const form = new FormData();
    form.append("file", file);

    const res = await apiFetchForm("/api/uploadAvatar", {
      method: "POST",
      body: form,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setProfile(prev =>
      prev ? { ...prev, avatar: data.avatar } : prev
    );

    alert(t.profile_avatar_updated);
  } catch (err) {
    console.error(err);
    alert(t.upload_failed);
  } finally {
    setUploading(false);
  }
};

  /* =======================
     UI STATES
  ======================= */
  if (loading || authLoading) {
    return <p className="p-4 text-center">{t.loading_profile}</p>;
  }

  if (error) {
    return (
      <main className="p-6 text-center text-red-500">
        {error}
      </main>
    );
  }

  /* =======================
     UI
  ======================= */
  return (
    <main className="min-h-screen bg-gray-100 pb-24">
      <button
        onClick={() => router.back()}
        className="absolute top-4 left-4 text-orange-500 text-3xl"
      >
        ←
      </button>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow mt-12 p-6">
        <div className="relative w-28 h-28 mx-auto mb-4">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : profile?.avatar ? (
            <Image
              src={profile.avatar}
              alt="Avatar"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-orange-200 flex items-center justify-center text-4xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          <label className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer">
            <Upload size={18} className="text-white" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </label>
        </div>

        <h2 className="text-center font-semibold">
          @{user?.username}
        </h2>

        {uploading && (
          <p className="text-center text-sm">{t.uploading}</p>
        )}
      </div>

      <div className="bg-white mt-6 mx-4 p-4 rounded-xl shadow space-y-3">
        {[
          ["display_name", t.app_name],
          ["email", t.email],
          ["phone", t.phone],
          ["address", t.address],
          ["province", t.province],
          ["country", t.country],
        ].map(([key, label]) => (
          <div key={key} className="flex justify-between border-b pb-2">
            <span>{label}</span>
            <span>
              {profile?.[key as keyof ProfileData] || t.not_set}
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => router.push("/customer/profile/edit")}
          className="btn-orange flex items-center gap-2"
        >
          <Edit3 size={18} /> {t.edit_profile}
        </button>
      </div>
    </main>
  );
}
