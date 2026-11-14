import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { AccountHeader } from "@/components/account/AccountNav";
import { QuantityStepper } from "@/components/account/QuantityStepper";
import { ProductImage } from "@/components/product/ProductImage";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type PricedLine } from "@/hooks/use-cart";
import { formatNumber, formatRupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Keranjang Belanja — KelapaKu" },
      { name: "description", content: "Lihat dan atur produk di keranjang belanja KelapaKu Anda." },
      { property: "og:title", content: "Keranjang Belanja — KelapaKu" },
      { property: "og:description", content: "Keranjang belanja KelapaKu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const qc = useQueryClient();
  const { lines, subtotal, hasErrors, isLoading, isError, refetch } = useCart();
  const [toDelete, setToDelete] = useState<PricedLine | null>(null);

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e: Error) => toast.error("Gagal mengubah jumlah", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produk dihapus dari keranjang");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error("Gagal menghapus produk", { description: e.message }),
  });

  return (
    <SiteLayout>
      <AccountHeader title="Keranjang Belanja" subtitle="Periksa kembali produk sebelum checkout." />
      <div className="container-page py-10">
        {isLoading ? (
          <LoadingState label="Memuat keranjang…" />
        ) : isError ? (
          <ErrorState message="Keranjang tidak dapat dimuat." onRetry={() => refetch()} />
        ) : lines.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Keranjang masih kosong"
            description="Yuk, temukan produk kelapa favorit Anda."
            action={<Button asChild><Link to="/products">Mulai belanja</Link></Button>}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-3">
              {lines.map((l) => {
                const p = l.products;
                const stock = Number(p?.stock_quantity ?? 0);
                const min = Math.max(Number(p?.min_retail_quantity) || 1, 1);
                return (
                  <li key={l.id} className="flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
                    <ProductImage src={l.image} alt={p?.name ?? "Produk"} className="size-20 shrink-0 rounded-2xl sm:size-24" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {p ? (
                            <Link to="/products/$slug" params={{ slug: p.slug }} className="font-semibold hover:text-primary">{p.name}</Link>
                          ) : (
                            <span className="font-semibold">Produk tidak tersedia</span>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatRupiah(l.unitPrice)} / {p?.unit}
                            {l.priceType === "wholesale" && <span className="ml-1 text-primary">({l.tierName})</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">Stok: {formatNumber(stock)} {p?.unit}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => setToDelete(l)} aria-label="Hapus dari keranjang">
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <QuantityStepper
                          value={Number(l.quantity)}
                          min={min}
                          max={Math.max(stock, min)}
                          disabled={updateQty.isPending || !p?.is_active}
                          onChange={(quantity) => updateQty.mutate({ id: l.id, quantity })}
                        />
                        <p className="font-semibold text-primary">{formatRupiah(l.lineTotal)}</p>
                      </div>
                      {l.error && <p className="text-xs font-medium text-destructive">{l.error}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold">Ringkasan belanja</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Jumlah produk</dt><dd>{lines.length} item</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
                <span>Total belanja</span><span className="text-primary">{formatRupiah(subtotal)}</span>
              </div>
              {hasErrors && <p className="mt-3 text-xs text-destructive">Perbaiki produk yang bermasalah sebelum checkout.</p>}
              <Button size="lg" className="mt-5 w-full" disabled={hasErrors} asChild={!hasErrors}>
                {hasErrors ? <span>Lanjut ke Checkout</span> : <Link to="/checkout">Lanjut ke Checkout <ArrowRight /></Link>}
              </Button>
            </aside>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Hapus produk dari keranjang?"
        description={toDelete?.products?.name}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
      />
    </SiteLayout>
  );
}
