"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";

export default function PiLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, piReady, pilogin, loading } = useAuth();

  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState("");

  /* =========================
     AUTO REDIRECT IF LOGGED
  ========================= */
  useEffect(() => {
    if (!loading && user) {
      router.replace("/account");
    }
  }, [loading, user, router]);

  const handleLogin = async () => {
    if (!agreed) {
      setStatus(t.must_agree_terms);
      return;
    }

    if (!piReady) {
      setStatus(t.pi_not_ready);
      return;
    }

    setStatus(t.authenticating);
    await pilogin();
  };

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        {t.checking_session}
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white px-6 text-center">

      {status && (
        <p className="mb-6 text-sm text-gray-600 whitespace-pre-line">
          {status}
        </p>
      )}

      <button
        onClick={handleLogin}
        disabled={!agreed || !piReady}
        className={`${
          agreed && piReady
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-gray-300"
        } text-white font-semibold py-3 px-10 rounded-full text-lg shadow-md transition`}
      >
        {t.login}
      </button>

      <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={agreed}
          onChange={() => setAgreed(v => !v)}
          className="w-4 h-4 accent-orange-500"
        />
        <label>
          {t.i_agree}{" "}
          <a
            href="https://www.termsfeed.com/live/7eae894b-14dd-431c-99da-0f94cab5b9ac"
            target="_blank"
            className="text-orange-500 underline"
          >
            {t.terms_of_use}
          </a>{" "}
          {t.and}{" "}
          <a
            href="https://www.termsfeed.com/live/32e8bf86-ceaf-4eb6-990e-cd1fa0b0775e"
            target="_blank"
            className="text-orange-500 underline"
          >
            {t.privacy_policy}
          </a>
        </label>
      </div>

      <footer className="absolute bottom-6 text-gray-400 text-xs">
        © 1Pi.app 2023 — {t.all_rights_reserved}
      </footer>
    </main>
  );
}
