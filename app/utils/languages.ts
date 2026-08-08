// Language configuration for frontend
export const SUPPORTED_LANGUAGES = {
  en: {
    name: "English",
    native_name: "English",
    flag: "🇺🇸",
    code: "en",
  },
  id: {
    name: "Indonesian",
    native_name: "Bahasa Indonesia",
    flag: "🇮🇩",
    code: "id",
  },
  ar: {
    name: "Arabic",
    native_name: "العربية",
    flag: "🇸🇦",
    code: "ar",
  },
  ms: {
    name: "Malay",
    native_name: "Bahasa Malaysia",
    flag: "🇲🇾",
    code: "ms",
  },
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export function isSupportedLanguageCode(
  value: string | null | undefined
): value is LanguageCode {
  if (!value) return false;
  return value in SUPPORTED_LANGUAGES;
}

export function normalizeLanguageCode(
  value: string | null | undefined
): LanguageCode {
  if (isSupportedLanguageCode(value)) {
    return value;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Get language display name with flag
 */
export function getLanguageDisplay(
  languageCode: string | null | undefined
): string {
  const code = (languageCode || DEFAULT_LANGUAGE) as LanguageCode;
  const language =
    SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  return `${language.flag} ${language.name}`;
}

/**
 * Get language name only
 */
export function getLanguageName(
  languageCode: string | null | undefined
): string {
  const code = (languageCode || DEFAULT_LANGUAGE) as LanguageCode;
  const language =
    SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  return language.name;
}

/**
 * Get language flag only
 */
export function getLanguageFlag(
  languageCode: string | null | undefined
): string {
  const code = (languageCode || DEFAULT_LANGUAGE) as LanguageCode;
  const language =
    SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
  return language.flag;
}
