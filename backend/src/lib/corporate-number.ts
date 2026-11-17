// 法人番号: the 13-digit number Japan's National Tax Agency gives every registered company.
// The first digit is a check digit over the other 12, so typos are caught before an admin looks it up.

/** "7000-0120-50002", "７０００…" or with spaces -> "7000012050002". Null if it isn't 13 digits. */
export function normalizeCorporateNumber(input: string): string | null {
  const digits = input
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[\s\-‐－ー]/g, "");
  return /^\d{13}$/.test(digits) ? digits : null;
}

/** True when the check digit matches (国税庁's formula: 9 − (Σ digit × weight mod 9), weights 1,2,1,2… from the right). */
export function isValidCorporateNumber(number: string): boolean {
  if (!/^\d{13}$/.test(number)) return false;
  const base = number.slice(1);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(base[11 - i]);
    sum += digit * (i % 2 === 0 ? 1 : 2);
  }
  return Number(number[0]) === 9 - (sum % 9);
}

// What an admin checks before approving a company, so a shell company (ペーパーカンパニー) is hard to slip through.
export const COMPANY_CHECKS = ["REGISTRY", "INSURANCE", "ACTIVITY", "ADDRESS", "PHONE"] as const;
export type CompanyCheck = (typeof COMPANY_CHECKS)[number];
/** Registered with the tax agency, and paying employees' social insurance: a shell company usually has no employees. */
export const REQUIRED_CHECKS: CompanyCheck[] = ["REGISTRY", "INSURANCE"];

/** Portfolio views by one company in 24 hours that an admin should look at. */
export const VIEW_ALERT_PER_DAY = 50;
