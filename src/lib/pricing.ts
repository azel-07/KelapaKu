export type PriceTier = {
  id: string;
  tier_name: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
};

/**
 * Harga satuan yang berlaku. Harga grosir hanya untuk pelanggan grosir dan
 * hanya bila jumlah masuk rentang tier aktif; selain itu harga eceran.
 * Logika ini harus sama dengan fungsi database create_order_from_cart.
 */
export function resolveUnitPrice(
  retailPrice: number,
  quantity: number,
  tiers: PriceTier[] | null | undefined,
  isWholesale: boolean,
): { unitPrice: number; type: "retail" | "wholesale"; tier: PriceTier | null } {
  if (isWholesale && tiers?.length) {
    const match = [...tiers]
      .sort((a, b) => Number(b.min_quantity) - Number(a.min_quantity))
      .find(
        (t) =>
          quantity >= Number(t.min_quantity) && (t.max_quantity == null || quantity <= Number(t.max_quantity)),
      );
    if (match) return { unitPrice: Number(match.unit_price), type: "wholesale", tier: match };
  }
  return { unitPrice: Number(retailPrice), type: "retail", tier: null };
}

/** Pesan error validasi jumlah, atau null bila valid. */
export function validateQuantity(quantity: number, stock: number, minQty: number, unit: string): string | null {
  if (stock <= 0) return "Stok sedang habis.";
  if (!Number.isFinite(quantity) || quantity <= 0) return "Jumlah tidak valid.";
  if (quantity < minQty) return `Minimal pembelian ${minQty} ${unit}.`;
  if (quantity > stock) return `Melebihi stok (tersisa ${stock} ${unit}).`;
  return null;
}
