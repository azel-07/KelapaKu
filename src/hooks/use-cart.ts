import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { cartQuery, cartTiersQuery, type CartLine } from "@/lib/account";
import { resolveUnitPrice, validateQuantity } from "@/lib/pricing";
import { primaryImage } from "@/lib/images";

export type PricedLine = CartLine & {
  unitPrice: number;
  priceType: "retail" | "wholesale";
  tierName: string | null;
  lineTotal: number;
  error: string | null;
  image: string | null;
};

export function useCart() {
  const { user, isWholesale } = useAuth();
  const cart = useQuery({ ...cartQuery(user?.id ?? ""), enabled: !!user });
  const productIds = (cart.data ?? []).map((l) => l.product_id);
  const tiers = useQuery(cartTiersQuery(productIds, isWholesale));

  const lines: PricedLine[] = useMemo(
    () =>
      (cart.data ?? []).map((l) => {
        const p = l.products;
        const qty = Number(l.quantity);
        const productTiers = (tiers.data ?? []).filter((t) => t.product_id === l.product_id);
        const price = resolveUnitPrice(Number(p?.retail_price ?? 0), qty, productTiers, isWholesale);
        const error = !p
          ? "Produk tidak ditemukan."
          : !p.is_active
            ? "Produk sudah tidak tersedia."
            : validateQuantity(qty, Number(p.stock_quantity), Math.max(Number(p.min_retail_quantity) || 1, 0), p.unit);
        return {
          ...l,
          unitPrice: price.unitPrice,
          priceType: price.type,
          tierName: price.tier?.tier_name ?? null,
          lineTotal: price.unitPrice * qty,
          error,
          image: primaryImage(p?.product_images),
        };
      }),
    [cart.data, tiers.data, isWholesale],
  );

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const itemCount = lines.length;
  const hasErrors = lines.some((l) => l.error);

  return { ...cart, lines, subtotal, itemCount, hasErrors, isLoading: cart.isLoading || (isWholesale && tiers.isLoading && productIds.length > 0) };
}
