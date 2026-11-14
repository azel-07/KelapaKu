import { supabase } from "@/integrations/supabase/client";

export const PRODUCT_BUCKET = "product-images";

export function storagePublicUrl(path: string) {
  return supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Accepts a full URL or a path inside the product-images bucket. */
export function resolveImageUrl(value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return storagePublicUrl(value.replace(/^\/+/, ""));
}

// Foto yang sudah diunggah di bucket product-images, dipakai saat kategori belum punya image_url.
const CATEGORY_FALLBACK: Record<string, string> = {
  "kelapa-muda": "kelapa muda.jpg",
  "kelapa-tua": "kelapa tua.jpg",
  "santan-kelapa": "santan.jpg",
  "kelapa-parut": "kelapa parut.jpg",
  cocochip: "cocochip.jpg",
  "cocopit-cocopeat": "cocopeat.jpg",
};

export function categoryImage(category: { slug: string; image_url: string | null }) {
  return resolveImageUrl(category.image_url) ?? (CATEGORY_FALLBACK[category.slug] ? storagePublicUrl(CATEGORY_FALLBACK[category.slug]) : null);
}

export function primaryImage(
  images: { image_url: string; is_primary: boolean; sort_order: number }[] | null | undefined,
) {
  if (!images?.length) return null;
  const sorted = [...images].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return resolveImageUrl(sorted[0].image_url);
}
