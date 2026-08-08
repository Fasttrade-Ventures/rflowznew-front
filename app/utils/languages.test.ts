import { describe, expect, test } from "vitest";
import {
  getLanguageDisplay,
  getLanguageName,
  getLanguageFlag,
  DEFAULT_LANGUAGE,
  isSupportedLanguageCode,
  normalizeLanguageCode,
} from "./languages";

describe("Language Utilities", () => {
  test("getLanguageDisplay returns correct format for supported languages", () => {
    expect(getLanguageDisplay("en")).toBe("🇺🇸 English");
    expect(getLanguageDisplay("id")).toBe("🇮🇩 Indonesian");
    expect(getLanguageDisplay("ar")).toBe("🇸🇦 Arabic");
    expect(getLanguageDisplay("ms")).toBe("🇲🇾 Malay");
  });

  test("getLanguageDisplay handles null and undefined values", () => {
    expect(getLanguageDisplay(null)).toBe("🇺🇸 English");
    expect(getLanguageDisplay(undefined)).toBe("🇺🇸 English");
    expect(getLanguageDisplay("")).toBe("🇺🇸 English");
  });

  test("getLanguageDisplay handles unsupported language codes", () => {
    expect(getLanguageDisplay("fr")).toBe("🇺🇸 English");
    expect(getLanguageDisplay("invalid")).toBe("🇺🇸 English");
  });

  test("getLanguageName returns correct names", () => {
    expect(getLanguageName("en")).toBe("English");
    expect(getLanguageName("id")).toBe("Indonesian");
    expect(getLanguageName("ar")).toBe("Arabic");
    expect(getLanguageName("ms")).toBe("Malay");
  });

  test("getLanguageName handles null and undefined values", () => {
    expect(getLanguageName(null)).toBe("English");
    expect(getLanguageName(undefined)).toBe("English");
    expect(getLanguageName("")).toBe("English");
  });

  test("getLanguageFlag returns correct flags", () => {
    expect(getLanguageFlag("en")).toBe("🇺🇸");
    expect(getLanguageFlag("id")).toBe("🇮🇩");
    expect(getLanguageFlag("ar")).toBe("🇸🇦");
    expect(getLanguageFlag("ms")).toBe("🇲🇾");
  });

  test("getLanguageFlag handles null and undefined values", () => {
    expect(getLanguageFlag(null)).toBe("🇺🇸");
    expect(getLanguageFlag(undefined)).toBe("🇺🇸");
    expect(getLanguageFlag("")).toBe("🇺🇸");
  });

  test("DEFAULT_LANGUAGE is set correctly", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
  });

  test("isSupportedLanguageCode validates supported codes", () => {
    expect(isSupportedLanguageCode("id")).toBe(true);
    expect(isSupportedLanguageCode("fr")).toBe(false);
    expect(normalizeLanguageCode("id")).toBe("id");
    expect(normalizeLanguageCode("fr")).toBe("en");
  });
});
