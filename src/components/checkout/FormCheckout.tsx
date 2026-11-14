import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, MapPin, Plus, ShieldCheck } from "lucide-react";
import { AddressFormDialog } from "@/components/account/AddressFormDialog";
import { ProductImage } from "@/components/product/ProductImage";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { addressesQuery, formatAddress } from "@/lib/account";
import { formatNumber, formatRupiah } from "@/lib/format";
import type { PricedLine } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

export function FormCheckout({ userId, lines, subtotal }: { userId: string; lines: PricedLine[]; subtotal: number }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const addresses = useQuery(addressesQuery(userId));
  const [addressId, setAddressId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    const list = addresses.data;
    if (!list?.length) return;
    if (!addressId || !list.some((a) => a.id === addressId)) {
      setAddressId((list.find((a) => a.is_default) ?? list[0])!.id);
    }
  }, [addresses.data, addressId]);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("create_order_from_cart", {
        p_address_id: addressId!,
        p_customer_note: note.trim(),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      toast.success("Pesanan berhasil dibuat", { description: `Nomor pesanan ${order.order_number}` });
      navigate({ to: "/my-orders", search: { pesanan: order.id }, replace: true });
    },
    onError: (e: Error) => {
      submitting.current = false;
      setError(e.message);
      toast.error("Checkout gagal", { description: e.message });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!addressId) return setError("Pilih alamat pengiriman terlebih dahulu.");
    if (note.length > 1000) return setError("Catatan pesanan maksimal 1000 karakter.");
    if (lines.some((l) => l.error)) return setError("Ada produk yang perlu diperbaiki di keranjang.");
    if (submitting.current) return;
    submitting.current = true;
    placeOrder.mutate();
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="size-5 text-primary" /> Alamat pengiriman</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(true)}><Plus /> Alamat baru</Button>
          </div>
          {addresses.isLoading ? (
            <LoadingState />
          ) : addresses.isError ? (
            <ErrorState message="Alamat tidak dapat dimuat." onRetry={() => addresses.refetch()} />
          ) : !addresses.data?.length ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Belum ada alamat. Tambahkan alamat pengiriman untuk melanjutkan.
            </div>
          ) : (
            <div className="grid gap-3" role="radiogroup" aria-label="Pilih alamat">
              {addresses.data.map((a) => (
                <label
                  key={a.id}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                    addressId === a.id ? "border-primary bg-primary-soft/50" : "border-border hover:border-primary/40",
                  )}
                >
                  <input type="radio" name="address" className="mt-1 accent-primary" checked={addressId === a.id} onChange={() => setAddressId(a.id)} />
                  <span className="min-w-0 text-sm">
                    <span className="flex items-center gap-2 font-semibold">
                      {a.recipient_name} {a.is_default && <StatusBadge label="Utama" tone="success" />}
                    </span>
                    <span className="block text-muted-foreground">{a.phone}</span>
                    <span className="mt-1 block">{formatAddress(a)}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Label htmlFor="note" className="text-lg font-semibold">Catatan pesanan</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className="mt-3" placeholder="Opsional, contoh: kirim pagi hari" />
          <p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/1000</p>
        </section>
      </div>

      <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Ringkasan pesanan</h2>
        <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3 text-sm">
              <ProductImage src={l.image} alt={l.products?.name ?? ""} className="size-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.products?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(l.quantity)} {l.products?.unit} × {formatRupiah(l.unitPrice)}
                </p>
                {l.error && <p className="text-xs text-destructive">{l.error}</p>}
              </div>
              <p className="font-medium">{formatRupiah(l.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Jumlah produk</dt><dd>{lines.length} item</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatRupiah(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Ongkos kirim</dt><dd>{formatRupiah(0)}</dd></div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
          <span>Total pembayaran</span><span className="text-primary">{formatRupiah(subtotal)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Harga final dihitung ulang oleh sistem saat pesanan dibuat.</p>
        {error && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" size="xl" className="mt-5 w-full" disabled={placeOrder.isPending || !addressId || lines.some((l) => l.error)}>
          {placeOrder.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Buat Pesanan
        </Button>
        <Link to="/cart" className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary">Kembali ke keranjang</Link>
      </aside>

      <AddressFormDialog open={formOpen} onOpenChange={setFormOpen} userId={userId} />
    </form>
  );
}
