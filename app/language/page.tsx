"use client";

import { useLanguage } from "../context/LanguageContext";

export default function LanguagePage() {
  const { language, setLanguage, translate } = useLanguage();

  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        🌍 {translate("select_language")}
      </h1>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setLanguage("vi")}
          className={`py-2 rounded ${
            language === "vi" ? "bg-yellow-500 text-white" : "bg-gray-200"
          }`}
        >
          🇻🇳 Tiếng Việt
        </button>

        <button
          onClick={() => setLanguage("en")}
          className={`py-2 rounded ${
            language === "en" ? "bg-yellow-500 text-white" : "bg-gray-200"
          }`}
        >
          🇬🇧 English
        </button>

        <button
          onClick={() => setLanguage("zh")}
          className={`py-2 rounded ${
            language === "zh" ? "bg-yellow-500 text-white" : "bg-gray-200"
          }`}
        >
          🇨🇳 中文 (Chinese)
        </button>
      </div>

      <p className="text-center text-gray-500 mt-6">
        Ngôn ngữ hiện tại: <b>{language}</b>
      </p>
    </main>
  );
}
