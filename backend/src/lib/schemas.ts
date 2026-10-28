import { z } from "zod";

/** Optional free text: trimmed, length-limited, and stored as null when empty. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `must be at most ${max} characters`)
    .nullish()
    .transform((v) => (v ? v : null));

/** Optional http(s) link. Rejects javascript: and other schemes that could run code when clicked. */
export const optionalUrl = z
  .string()
  .trim()
  .max(500, "must be at most 500 characters")
  .nullish()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+$/i.test(v), "must be a link starting with http:// or https://");

/** A short list of tags (skills, tech stack): trimmed, de-duplicated case-insensitively. */
export const tagList = z
  .array(z.string().trim().min(1).max(40, "each item must be at most 40 characters"))
  .max(30, "at most 30 items")
  .transform((items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email("must be a valid email address"));

export const password = z
  .string()
  .min(8, "must be at least 8 characters")
  .max(128, "must be at most 128 characters");

export const personName = z.string().trim().min(1, "is required").max(80, "must be at most 80 characters");

export const aiLanguage = z.string().max(40).optional();
