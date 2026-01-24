"use client";

import { useState, useEffect } from "react";
import { languageFiles } from "../i18n";

export function useTranslationClient() {
 const [lang, setLang] = useState("en");
  const [t, setT] = useState<Record<string, string>>({});

  // Lấy ngôn ngữ đã lưu
  useEffect(() => {
    const saved = localStorage.getItem("lang") || "en";
    setLang(saved);
  }, []);

  // Load JSON tương ứng
  useEffect(() => {
    languageFiles[lang]?.().then((mod) => setT(mod.default));
  }, [lang]);

  // Lắng nghe sự kiện đổi ngôn ngữ
  useEffect(() => {
    const handler = (e: CustomEvent) => setLang(e.detail);
    window.addEventListener("language-change", handler);
    return () => window.removeEventListener("language-change", handler);
  }, []);

  // Hàm đổi ngôn ngữ
  const setLanguage = (newLang: string) => {
    localStorage.setItem("lang", newLang);
    setLang(newLang);
    window.dispatchEvent(new CustomEvent("language-change", { detail: newLang }));
  };

  return {
    t,
    lang,
    setLang: setLanguage,
  };
}
