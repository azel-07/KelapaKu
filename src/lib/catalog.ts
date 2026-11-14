import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PRODUCT_FIELDS =
  "id, name, slug, unit, retail_price, stock_quantity, min_retail_quantity, wholesale_min_quantity, is_featured, label, category_id, categories(id, name, slug), product_images(image_url, is_primary, sort_order, alt_text)";

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  unit: string;
  retail_price: number;
  stock_quantity: number;
  min_retail_quantity: number;
  wholesale_min_quantity: number;
  is_featured: boolean;
  label: string | null;
  category_id: string;
  categories: { id: string; name: string; slug: string } | null;
  product_images: { image_url: string; is_primary: boolean; sort_order: number; alt_text: string | null }[];
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url, sort_order")
        .eq("is_active", true)
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CatalogProduct[];
    },
  });

export const featuredProductsQuery = () =>
  queryOptions({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as unknown as CatalogProduct[];
    },
  });

export async function fetchProductDetail(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(id, name, slug), product_images(id, image_url, alt_text, is_primary, sort_order)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof fetchProductDetail>>>;

export const productDetailQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => fetchProductDetail(slug) });

// Hanya terbaca untuk pelanggan grosir yang disetujui atau admin (sesuai RLS).
export const priceTiersQuery = (productId: string, userId: string | undefined) =>
  queryOptions({
    queryKey: ["price-tiers", productId, userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_price_tiers")
        .select("id, tier_name, min_quantity, max_quantity, unit_price")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("min_quantity");
      if (error) throw error;
      return data;
    },
  });
