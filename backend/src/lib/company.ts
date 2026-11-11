// Addresses anyone can create, so they say nothing about working at a company.
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.jp", "ymail.com", "outlook.com", "outlook.jp", "hotmail.com",
  "hotmail.co.jp", "live.com", "live.jp", "msn.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me",
  "protonmail.com", "gmx.com", "gmx.de", "mail.com", "yandex.com", "qq.com", "163.com", "126.com", "naver.com",
  "docomo.ne.jp", "ezweb.ne.jp", "au.com", "softbank.ne.jp", "i.softbank.jp",
]);

const emailDomain = (email: string) => email.slice(email.lastIndexOf("@") + 1).toLowerCase();

export function isFreeEmail(email: string): boolean {
  return FREE_EMAIL_DOMAINS.has(emailDomain(email));
}

export function emailMatchesWebsite(email: string, website: string): boolean {
  let host: string;
  try {
    host = new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
  const domain = emailDomain(email);
  return domain === host || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`);
}

/**
 * "ada+company@gmail.com" -> "ada@gmail.com". Gmail and most providers deliver "+" addresses to the
 * same inbox, which lets an admin open a test company account without owning a company domain.
 */
export function withoutPlusTag(email: string): string | null {
  const at = email.lastIndexOf("@");
  const local = email.slice(0, at);
  const plus = local.indexOf("+");
  return plus > 0 ? `${local.slice(0, plus)}${email.slice(at)}`.toLowerCase() : null;
}
