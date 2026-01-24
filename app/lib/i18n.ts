// ❗ KHÔNG có "use client" trong file này

export const availableLanguages = {

  en: "🇬🇧 English",
  zh: "🇨🇳 中文",
  vi: "🇻🇳 Tiếng Việt",
  ko: "🇰🇷 한국어",
  th: "🇹🇭 ภาษาไทย",
  fr: "🇫🇷 Français",
  ar: "🇸🇦 العربية",
  ru: "🇷🇺 Русский",
  de: "🇩🇪 Deutsch",
  pt: "🇵🇹 Português",
  hi: "🇮🇳 हिन्दी",
  ja: "🇯🇵 日本語",
  mr: "🇮🇳 मराठी",
};

export const languageFiles: Record<
  string,
  () => Promise<{ default: Record<string, string> }>
> = {
  vi: () => import("@/messages/vi.json"),
  en: () => import("@/messages/en.json"),
  zh: () => import("@/messages/zh.json"),
  ko: () => import("@/messages/ko.json"),
  th: () => import("@/messages/th.json"),
  fr: () => import("@/messages/fr.json"),
  ar: () => import("@/messages/ar.json"),
  ru: () => import("@/messages/ru.json"),
  de: () => import("@/messages/de.json"),
  pt: () => import("@/messages/pt.json"),
  hi: () => import("@/messages/hi.json"),
  ja: () => import("@/messages/ja.json"),
  mr: () => import("@/messages/mr.json"),
};
