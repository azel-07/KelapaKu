
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Truck,
  Weight,
  Store,
} from "lucide-react";

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

type ShippingMethod = "region_flat" | "weight_region" | "pickup";

function normalizeLocation(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export function FormCheckout({
  userId,
  lines,
  subtotal,
}: {
  userId: string;
  lines: PricedLine[];
  subtotal: number;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const addresses = useQuery(addressesQuery(userId));

  const shippingRates = useQuery({
    queryKey: ["shipping-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_rates")
        .select(
          "id, province, city_regency, shipping_method, flat_cost, rate_per_kg, minimum_cost, is_active",
        )
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const [addressId, setAddressId] = useState<string | null>(null);
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("region_flat");
  const [note, setNote] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitting = useRef(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    const list = addresses.data;
    if (!list?.length) return;

    if (!addressId || !list.some((a) => a.id === addressId)) {
      setAddressId((list.find((a) => a.is_default) ?? list[0])!.id);
    }
  }, [addresses.data, addressId]);

  const selectedAddress =
    addresses.data?.find((a) => a.id === addressId) ?? null;

  const rates = shippingRates.data ?? [];

  // Tarif kota/kabupaten didahulukan.
  // Jika tidak ada, gunakan tarif tingkat provinsi apabila tersedia.
  const cityRate = selectedAddress
    ? rates.find(
        (rate) =>
          rate.shipping_method === shippingMethod &&
          !!rate.city_regency &&
          normalizeLocation(rate.city_regency) ===
            normalizeLocation(selectedAddress.city_regency) &&
          normalizeLocation(rate.province) ===
            normalizeLocation(selectedAddress.province),
      )
    : undefined;

  const provinceRate = selectedAddress
    ? rates.find(
        (rate) =>
          rate.shipping_method === shippingMethod &&
          !rate.city_regency &&
          normalizeLocation(rate.province) ===
            normalizeLocation(selectedAddress.province),
      )
    : undefined;

  const selectedRate = cityRate ?? provinceRate;

  const totalWeightGram = lines.reduce(
    (total, line) =>
      total +
      Number(line.products?.weight_gram ?? 0) * Number(line.quantity),
    0,
  );

  const hasMissingWeight = lines.some(
    (line) =>
      !line.products ||
      line.products.weight_gram == null ||
      Number(line.products.weight_gram) <= 0,
  );

  let shippingCost = 0;

  if (shippingMethod === "region_flat") {
    shippingCost = Number(selectedRate?.flat_cost ?? 0);
  } else if (shippingMethod === "weight_region" && selectedRate) {
    const ratePerKg = Number(selectedRate.rate_per_kg ?? 0);
    const minimumCost = Number(selectedRate.minimum_cost ?? 0);
    const totalKg = Math.ceil(totalWeightGram / 1000);

    shippingCost = Math.max(totalKg * ratePerKg, minimumCost);
  }

  let shippingError: string | null = null;

  if (shippingMethod !== "pickup") {
    if (!addressId || !selectedAddress) {
      shippingError = "Pilih alamat pengiriman terlebih dahulu.";
    } else if (shippingRates.isError) {
      shippingError = "Tarif pengiriman tidak dapat dimuat. Silakan coba lagi.";
    } else if (shippingRates.isLoading) {
      shippingError = "Sedang memuat tarif pengiriman.";
    } else if (!selectedRate) {
      shippingError =
        "Tarif untuk kota/kabupaten pada alamat ini belum tersedia.";
    } else if (
      shippingMethod === "region_flat" &&
      selectedRate.flat_cost == null
    ) {
      shippingError = "Tarif tetap untuk wilayah ini belum tersedia.";
    } else if (shippingMethod === "weight_region" && hasMissingWeight) {
      shippingError =
        "Berat salah satu produk belum diisi. Pilih tarif tetap atau hubungi admin.";
    } else if (
      shippingMethod === "weight_region" &&
      (selectedRate.rate_per_kg == null ||
        Number(selectedRate.rate_per_kg) <= 0)
    ) {
      shippingError = "Tarif per kilogram untuk wilayah ini belum tersedia.";
    }
  }

  const estimatedTotal = subtotal + shippingCost;

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!idempotencyKey.current) {
        idempotencyKey.current = crypto.randomUUID();
      }

      const { data, error } = await supabase.rpc(
  "create_order_from_cart_v2",
  {
    // SQL menerima NULL untuk pickup.
    // Assertion ini hanya menyesuaikan keterbatasan tipe hasil generate Supabase.
    p_address_id: (
      shippingMethod === "pickup" ? null : addressId
    ) as unknown as string,

    // Catatan kosong tidak dikirim sebagai NULL.
    ...(note.trim()
      ? { p_customer_note: note.trim() }
      : {}),

    p_shipping_method: shippingMethod,
    p_idempotency_key: idempotencyKey.current,
  },
);

      if (error) throw error;
      if (!data) throw new Error("Data pesanan tidak diterima dari server.");

      return data;
    },

    onSuccess: (order) => {
      submitting.current = false;
      idempotencyKey.current = null;

      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });

      toast.success("Pesanan berhasil dibuat", {
        description: `Nomor pesanan ${order.order_number}`,
      });

      navigate({
        to: "/my-orders",
        search: { pesanan: order.id },
        replace: true,
      });
    },

    onError: (e: Error) => {
      submitting.current = false;
      setError(e.message);
      toast.error("Checkout gagal", { description: e.message });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (shippingError) return setError(shippingError);
    if (note.length > 1000) {
      return setError("Catatan pesanan maksimal 1000 karakter.");
    }
    if (lines.length === 0) {
      return setError("Keranjang belanja masih kosong.");
    }
    if (lines.some((line) => line.error)) {
      return setError("Ada produk yang perlu diperbaiki di keranjang.");
    }
    if (submitting.current) return;

    submitting.current = true;
    placeOrder.mutate();
  };

  const checkoutDisabled =
    placeOrder.isPending ||
    lines.length === 0 ||
    lines.some((line) => line.error) ||
    (shippingMethod !== "pickup" &&
      (!!shippingError || shippingRates.isLoading));

  return (
    <form
      onSubmit={submit}
      className="grid gap-8 lg:grid-cols-[1fr_380px]"
      noValidate
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Truck className="size-5 text-primary" />
              Metode pengiriman
            </h2>
          </div>

          <div className="grid gap-3">
            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                shippingMethod === "region_flat"
                  ? "border-primary bg-primary-soft/50"
                  : "border-border hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name="shipping"
                value="region_flat"
                className="mt-1 accent-primary"
                checked={shippingMethod === "region_flat"}
                onChange={() => setShippingMethod("region_flat")}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  Tarif tetap wilayah
                </span>
                <span className="text-sm text-muted-foreground">
                  Biaya pengiriman tetap sesuai kota/kabupaten tujuan.
                </span>
              </span>
            </label>

            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                shippingMethod === "weight_region"
                  ? "border-primary bg-primary-soft/50"
                  : "border-border hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name="shipping"
                value="weight_region"
                className="mt-1 accent-primary"
                checked={shippingMethod === "weight_region"}
                onChange={() => setShippingMethod("weight_region")}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  <Weight className="size-4" />
                  Tarif berdasarkan berat
                </span>
                <span className="text-sm text-muted-foreground">
                  Biaya dihitung berdasarkan total berat produk.
                </span>
              </span>
            </label>

            <label
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                shippingMethod === "pickup"
                  ? "border-primary bg-primary-soft/50"
                  : "border-border hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name="shipping"
                value="pickup"
                className="mt-1 accent-primary"
                checked={shippingMethod === "pickup"}
                onChange={() => setShippingMethod("pickup")}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  <Store className="size-4" />
                  Ambil langsung
                </span>
                <span className="text-sm text-muted-foreground">
                  Ambil pesanan di gudang KelapaKu, Sumur Bandung.
                  Ongkos kirim gratis.
                </span>
              </span>
            </label>
          </div>

          {shippingMethod === "pickup" && (
            <p className="mt-4 rounded-xl bg-primary-soft/50 p-3 text-sm">
              Lokasi pengambilan: Jl. Gudang Selatan No. 37, Merdeka,
              Kecamatan Sumur Bandung, Kota Bandung, Jawa Barat 40113.
            </p>
          )}
        </section>

        {shippingMethod !== "pickup" && (
          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-5 text-primary" />
                Alamat pengiriman
              </h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(true)}
              >
                <Plus /> Alamat baru
              </Button>
            </div>

            {addresses.isLoading ? (
              <LoadingState />
            ) : addresses.isError ? (
              <ErrorState
                message="Alamat tidak dapat dimuat."
                onRetry={() => addresses.refetch()}
              />
            ) : !addresses.data?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Belum ada alamat. Tambahkan alamat pengiriman untuk melanjutkan.
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormOpen(true)}
                  >
                    <Plus /> Tambah alamat
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="grid gap-3"
                role="radiogroup"
                aria-label="Pilih alamat"
              >
                {addresses.data.map((a) => (
                  <label
                    key={a.id}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                      addressId === a.id
                        ? "border-primary bg-primary-soft/50"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1 accent-primary"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                    />
                    <span className="min-w-0 text-sm">
                      <span className="flex items-center gap-2 font-semibold">
                        {a.recipient_name}
                        {a.is_default && (
                          <StatusBadge label="Utama" tone="success" />
                        )}
                      </span>
                      <span className="block text-muted-foreground">
                        {a.phone}
                      </span>
                      <span className="mt-1 block">
                        {formatAddress(a)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {selectedAddress && (
              <p className="mt-3 text-xs text-muted-foreground">
                Tujuan tarif: {selectedAddress.city_regency},{" "}
                {selectedAddress.province}
              </p>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <Label htmlFor="note" className="text-lg font-semibold">
            Catatan pesanan
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={3}
            className="mt-3"
            placeholder="Opsional, contoh: kirim pagi hari"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {note.length}/1000
          </p>
        </section>
      </div>

      <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Ringkasan pesanan</h2>

        <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-3 text-sm">
              <ProductImage
                src={line.image}
                alt={line.products?.name ?? ""}
                className="size-12 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {line.products?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(line.quantity)} {line.products?.unit} ×{" "}
                  {formatRupiah(line.unitPrice)}
                </p>
                {line.error && (
                  <p className="text-xs text-destructive">{line.error}</p>
                )}
              </div>
              <p className="font-medium">{formatRupiah(line.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Jumlah produk</dt>
            <dd>{lines.length} item</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatRupiah(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Total berat</dt>
            <dd>
              {totalWeightGram > 0
                ? `${formatNumber(totalWeightGram)} gram`
                : "Belum tersedia"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Ongkos kirim</dt>
            <dd>
              {shippingMethod === "pickup"
                ? formatRupiah(0)
                : shippingError
                  ? "Belum tersedia"
                  : formatRupiah(shippingCost)}
            </dd>
          </div>
        </dl>

        {shippingMethod !== "pickup" && shippingError && (
          <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
            {shippingError}
          </p>
        )}

        {shippingMethod === "weight_region" && !hasMissingWeight && (
          <p className="mt-2 text-xs text-muted-foreground">
            Berat dibulatkan ke atas per kilogram. Tarif minimum berlaku
            sesuai wilayah tujuan.
          </p>
        )}

        <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
          <span>Estimasi total</span>
          <span className="text-primary">
            {shippingMethod !== "pickup" && shippingError
  ? "Belum tersedia"
  : formatRupiah(estimatedTotal)}
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Harga dan ongkir final dihitung ulang oleh Supabase saat pesanan
          dibuat.
        </p>

        {error && (
          <p
            className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="xl"
          className="mt-5 w-full"
          disabled={checkoutDisabled}
        >
          {placeOrder.isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ShieldCheck />
          )}
          Buat Pesanan
        </Button>

        <Link
          to="/cart"
          className="mt-3 block text-center text-sm text-muted-foreground hover:text-primary"
        >
          Kembali ke keranjang
        </Link>
      </aside>

      <AddressFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        userId={userId}
      />
    </form>
  );
}
