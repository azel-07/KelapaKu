import { describe, expect, it } from "vitest";
import { formatWhatsappDisplay, instagramLink, normalizeWhatsapp, whatsappLink } from "./site";

describe("normalizeWhatsapp", () => {
  it("converts a local 08 number to the 62 country format", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("6281234567890");
  });
  it("strips the plus sign and spaces from an international number", () => {
    expect(normalizeWhatsapp("+62 812 3456 7890")).toBe("6281234567890");
  });
  it("adds 62 when the number starts with 8", () => {
    expect(normalizeWhatsapp("81234567890")).toBe("6281234567890");
  });
});

describe("contact links", () => {
  it("builds a wa.me link from the admin-entered number", () => {
    expect(whatsappLink("0812 3456 7890", "Halo")).toBe("https://wa.me/6281234567890?text=Halo");
  });
  it("shows the number in readable +62 format", () => {
    expect(formatWhatsappDisplay("081234567890")).toBe("+62 812-3456-7890");
  });
  it("turns an @handle into an Instagram profile link", () => {
    expect(instagramLink("@kelapaku")).toBe("https://instagram.com/kelapaku");
  });
});
