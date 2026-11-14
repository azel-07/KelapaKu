import { describe, expect, it } from "vitest";
import { resolveUnitPrice, validateQuantity } from "./pricing";

const tiers = [
  { id: "a", tier_name: "Grosir", min_quantity: 10, max_quantity: 49, unit_price: 9000 },
  { id: "b", tier_name: "Grosir Besar", min_quantity: 50, max_quantity: null, unit_price: 8000 },
];

describe("resolveUnitPrice", () => {
  it("uses retail price for non-wholesale customers even when tiers exist", () => {
    expect(resolveUnitPrice(10000, 60, tiers, false)).toMatchObject({ unitPrice: 10000, type: "retail" });
  });
  it("uses retail price for wholesale customers below the first tier", () => {
    expect(resolveUnitPrice(10000, 5, tiers, true).unitPrice).toBe(10000);
  });
  it("uses the matching tier for wholesale customers", () => {
    expect(resolveUnitPrice(10000, 10, tiers, true).unitPrice).toBe(9000);
    expect(resolveUnitPrice(10000, 49, tiers, true).unitPrice).toBe(9000);
  });
  it("uses an open-ended tier above its minimum", () => {
    expect(resolveUnitPrice(10000, 500, tiers, true)).toMatchObject({ unitPrice: 8000, type: "wholesale" });
  });
});

describe("validateQuantity", () => {
  it("rejects quantities above stock", () => {
    expect(validateQuantity(6, 5, 1, "kg")).not.toBeNull();
  });
  it("rejects quantities below the minimum purchase", () => {
    expect(validateQuantity(1, 10, 2, "kg")).not.toBeNull();
  });
  it("accepts a quantity equal to stock", () => {
    expect(validateQuantity(5, 5, 1, "kg")).toBeNull();
  });
  it("rejects everything when out of stock", () => {
    expect(validateQuantity(1, 0, 1, "kg")).not.toBeNull();
  });
});
