import { describe, expect, it } from "vitest";
import { isValidCorporateNumber, normalizeCorporateNumber } from "./corporate-number.js";

describe("法人番号", () => {
  it("accepts real numbers and rejects typos", () => {
    expect(isValidCorporateNumber("7000012050002")).toBe(true); // 国税庁
    expect(isValidCorporateNumber("1180301018771")).toBe(true); // トヨタ自動車
    expect(isValidCorporateNumber("7000012050003")).toBe(false);
    expect(isValidCorporateNumber("1000012050002")).toBe(false);
    expect(isValidCorporateNumber("700001205000")).toBe(false);
  });

  it("reads hyphens, spaces and full-width digits", () => {
    expect(normalizeCorporateNumber("7000-0120-50002")).toBe("7000012050002");
    expect(normalizeCorporateNumber(" ７０００ ０１２０ ５０００２ ")).toBe("7000012050002");
    expect(normalizeCorporateNumber("70000120500")).toBeNull();
    expect(normalizeCorporateNumber("abc")).toBeNull();
  });
});
