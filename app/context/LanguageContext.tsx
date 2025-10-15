"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Language = "vi" | "en" | "zh";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  vi: {
    home: "Trang chủ",
    cart: "Giỏ hàng",
    account: "Tài khoản",
    products: "Danh sách sản phẩm",
    select_language: "Chọn ngôn ngữ",
  },
  en: {
    home: "Home",
    cart: "Cart",
    account: "Account",
    products: "Product List",
    select_language: "Select Language",
  },
  zh: {
    home: "主页",
    cart: "购物车",
    account: "账户",
    products: "产品列表",
    select_language: "选择语言",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");

  // 🔁 Lưu ngôn ngữ vào localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language | null;
    if (saved) setLanguage(saved);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  const translate = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        translate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
