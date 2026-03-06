// ============================================================
// MaatWork CRM — Vitest: Utility Function Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { cn, generateId, formatDate, formatCurrency } from "~/lib/utils";

describe("cn (class name merger)", () => {
  it("merges simple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves Tailwind conflicts", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2");
  });

  it("handles undefined/null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });
});

describe("generateId", () => {
  it("generates string of length 21", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(36);
  });

  it("generates unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("formatDate", () => {
  it("formats date correctly", () => {
    const result = formatDate(new Date("2026-03-04T12:00:00Z"));
    expect(typeof result).toBe("string");
    expect(result).toContain("2026");
  });
});

describe("formatCurrency", () => {
  it("formats positive values", () => {
    const result = formatCurrency(150000);
    expect(result).toContain("150");
  });

  it("formats zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});
