import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Address = Database["public"]["Tables"]["addresses"]["Row"];
export type AddressInput = Omit<Database["public"]["Tables"]["addresses"]["Insert"], "user_id" | "id">;

export const addressesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export async function saveAddress(userId: string, input: AddressInput, id?: string) {
  if (input.is_default) {
    const { error } = await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId).neq("id", id ?? "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  }
  if (id) {
    const { error } = await supabase.from("addresses").update(input).eq("id", id).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", userId);
    const { error } = await supabase
      .from("addresses")
      .insert({ ...input, user_id: userId, is_default: input.is_default || !count });
    if (error) throw error;
  }
}

export const cartQuery = (userId: string) =>
  queryOptions({
    queryKey: ["cart", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
  "id, quantity, product_id, products(id, name, slug, unit, retail_price, stock_quantity, min_retail_quantity, is_active, weight_gram, product_images(image_url, is_primary, sort_order))",
)
        .eq("user_id", userId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

export type CartLine = Awaited<ReturnType<NonNullable<ReturnType<typeof cartQuery>["queryFn"]>>>[number];

export const cartTiersQuery = (productIds: string[], enabled: boolean) =>
  queryOptions({
    queryKey: ["cart-tiers", [...productIds].sort()],
    enabled: enabled && productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_price_tiers")
        .select("id, product_id, tier_name, min_quantity, max_quantity, unit_price")
        .in("product_id", productIds)
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

export const myOrdersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
  "id, order_number, created_at, order_status, payment_status, payment_method, subtotal, shipping_cost, total_amount, customer_note, shipping_address_snapshot, order_items(id, product_name_snapshot, unit_snapshot, quantity, unit_price_snapshot, price_type_snapshot, subtotal), payments(id, amount, status, method, paid_at, created_at, proof_url)",
)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export function formatAddress(a: {
  address_line?: string | null;
  district?: string | null;
  city_regency?: string | null;
  province?: string | null;
  postal_code?: string | null;
}) {
  return [a.address_line, a.district, a.city_regency, a.province, a.postal_code].filter(Boolean).join(", ");
}
