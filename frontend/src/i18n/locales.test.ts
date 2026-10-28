import { describe, expect, it } from "vitest";
import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { zh } from "./locales/zh";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { my } from "./locales/my";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe.each([
  ["ja", ja],
  ["zh", zh],
  ["es", es],
  ["de", de],
  ["my", my],
] as const)("%s translations", (_code, locale) => {
  it("has every English key and no extras", () => {
    expect(Object.keys(locale).sort()).toEqual(Object.keys(en).sort());
  });

  it("keeps the same {placeholders} as English", () => {
    for (const [key, text] of Object.entries(en)) {
      expect(placeholders(locale[key as keyof typeof en]), key).toEqual(placeholders(text));
    }
  });

  it("has no empty strings", () => {
    for (const [key, text] of Object.entries(locale)) {
      expect(text.trim(), key).not.toBe("");
    }
  });
});
