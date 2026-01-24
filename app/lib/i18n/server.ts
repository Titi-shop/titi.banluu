import { languageFiles } from "./i18n";

export async function getDictionary(lang: string) {
  const mod = await languageFiles[lang]?.();
  return mod?.default || {};
}
