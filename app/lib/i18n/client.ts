"use client";

import { useState, useEffect } from "react";
import { languageFiles } from "../i18n";

type TranslationMap = Record<string, string>;

export function useTranslationClient() {
  const [lang, setLang] = useState<string>("en");
  const [t, setT] = useState<TranslationMap>({});

  // Load ngôn ngữ đã lưu
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem("lang");
    if (saved) {
      setLang(saved);
    }
  }, []);

  // Load file JSON
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const loader = languageFiles[lang];

        if (!loader) {
          setT({});
          return;
        }

        const mod = await loader();

        if (active) {
          const data = mod.default;

          if (data && typeof data === "object") {
            setT(data as TranslationMap);
          } else {
            setT({});
          }
        }
      } catch {
        if (active) {
          setT({});
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [lang]);

  // Lắng nghe event đổi ngôn ngữ
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (typeof custom.detail === "string") {
        setLang(custom.detail);
      }
    };

    window.addEventListener("language-change", handler);

    return () => {
      window.removeEventListener("language-change", handler);
    };
  }, []);

  // Đổi ngôn ngữ
  const setLanguage = (newLang: string) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("lang", newLang);
    setLang(newLang);

    window.dispatchEvent(
      new CustomEvent("language-change", { detail: newLang })
    );
  };

  return {
    t,
    lang,
    setLang: setLanguage,
  };
}
