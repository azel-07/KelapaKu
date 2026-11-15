
import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Package, Upload, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { AccountHeader } from "@/components/account/AccountNav";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { formatAddress, myOrdersQuery } from "@/lib/account";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from "@/lib/status";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/my-orders")({
  validateSearch: (s: Record<string, unknown>): { pesanan?: string | undefined } => ({
    pesanan: typeof s["pesanan"] === "string" ? s["pesanan"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pesanan Saya — KelapaKu" },
      { name: "description", content: "Riwayat dan status pesanan Anda di KelapaKu." },
      { property: "og:title", content: "Pesanan Saya — KelapaKu" },
      { property: "og:description", content: "Riwayat pesanan KelapaKu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MyOrdersPage,
});

type AddressSnap = {
  recipient_name?: string;
  phone?: string;
  address_line?: string;
  district?: string;
  city_regency?: string;
  province?: string;
  postal_code?: string | null;
};

type PaymentPanelProps = {
  orderId: string;
  userId: string;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
};

function PaymentPanel({
  orderId,
  userId,
  totalAmount,
  paymentStatus,
  orderStatus,
}: PaymentPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Pilih gambar bukti pembayaran terlebih dahulu.");
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        throw new Error("Format file harus JPG, PNG, atau WebP.");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Ukuran file maksimal 5 MB.");
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${userId}/${orderId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { error: rpcError } = await supabase.rpc("submit_qris_gopay_proof", {
        p_order_id: orderId,
        p_proof_path: path,
      });

      if (rpcError) {
        await supabase.storage.from("payment-proofs").remove([path]);
        throw new Error(rpcError.message);
      }

      return true;
    },
    onSuccess: async () => {
      setFile(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await queryClient.invalidateQueries({
        queryKey: ["my-orders", userId],
      });

      toast.success("Bukti pembayaran berhasil dikirim. Menunggu verifikasi admin.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim bukti pembayaran.");
    },
  });

  const canUpload =
  paymentStatus === "unpaid" &&
  orderStatus === "awaiting_payment";

  if (paymentStatus === "pending_confirmation") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Bukti pembayaran sudah diterima.</p>
        <p className="mt-1">Pembayaran sedang menunggu verifikasi admin KelapaKu.</p>
      </div>
    );
  }

  if (paymentStatus === "confirmed") {
    return (
      <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
        <p className="font-semibold">Pembayaran berhasil diverifikasi.</p>
        <p className="mt-1">Terima kasih telah berbelanja di KelapaKu.</p>
      </div>
    );
  }

  if (paymentStatus === "refunded") {
    return (
      <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
        Pembayaran pesanan ini telah dikembalikan.
      </div>
    );
  }

  if (!canUpload) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm">
        {paymentStatus === "rejected"
          ? "Bukti pembayaran ditolak. Silakan hubungi admin KelapaKu untuk tindak lanjut."
          : "Pembayaran tidak tersedia untuk pesanan ini."}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div>
        <h3 className="font-semibold">Pembayaran QRIS KelapaKu</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pindai QRIS berikut menggunakan aplikasi pembayaran Anda.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl bg-white p-4">
        <img
          src="/images/qris-kelapaku.jpeg"
          alt="QRIS merchant KelapaKu"
          className="h-auto w-full max-w-[280px] object-contain"
        />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Total yang harus dibayar</p>
          <p className="text-2xl font-bold text-primary">{formatRupiah(totalAmount)}</p>
        </div>
      </div>

      <div className="rounded-xl bg-secondary/50 p-3 text-sm">
        <p className="font-semibold">Penting: QRIS statis</p>
        <p className="mt-1 text-muted-foreground">
          Masukkan nominal pembayaran secara manual sesuai total pesanan di atas.
          Pastikan nominal tepat sebelum menyelesaikan pembayaran.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`proof-${orderId}`} className="text-sm font-medium">
          Upload bukti pembayaran
        </label>
        <input
          ref={inputRef}
          id={`proof-${orderId}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploadMutation.isPending}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="block w-full rounded-xl border border-input bg-background p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
        />
        <p className="text-xs text-muted-foreground">
          Format JPG, PNG, atau WebP. Maksimal 5 MB.
        </p>
        {file && (
          <p className="break-all text-xs text-muted-foreground">
            File dipilih: {file.name}
          </p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={!file || uploadMutation.isPending}
        onClick={() => uploadMutation.mutate()}
      >
        {uploadMutation.isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Mengirim bukti...
          </>
        ) : (
          <>
            <Upload />
            Kirim bukti pembayaran
          </>
        )}
      </Button>
    </div>
  );
}

function MyOrdersPage() {
  const { user } = useAuth();
  const { pesanan } = Route.useSearch();
  const { data, isLoading, isError, refetch } = useQuery({
    ...myOrdersQuery(user?.id ?? ""),
    enabled: !!user,
  });
  const [open, setOpen] = useState<string | null>(pesanan ?? null);

  return (
    <SiteLayout>
      <AccountHeader
        title="Pesanan Saya"
        subtitle="Pantau status pesanan dan pembayaran Anda."
      />

      <div className="container-page py-10">
        {isLoading || !user ? (
          <LoadingState label="Memuat pesanan..." />
        ) : isError ? (
          <ErrorState message="Pesanan tidak dapat dimuat." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState
            icon={Package}
            title="Belum ada pesanan"
            description="Pesanan yang Anda buat akan tampil di sini."
            action={
              <Button asChild>
                <Link to="/products">Mulai belanja</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-4">
            {data.map((o) => {
              const isOpen = open === o.id;
              const addr = (o.shipping_address_snapshot ?? {}) as AddressSnap;
              const os = ORDER_STATUS[o.order_status];
              const ps = PAYMENT_STATUS[o.payment_status];

              return (
                <li
                  key={o.id}
                  className={cn(
                    "overflow-hidden rounded-3xl border bg-card shadow-soft",
                    pesanan === o.id ? "border-primary" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : o.id)}
                    className="flex w-full flex-wrap items-center gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{o.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(o.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={os.label} tone={os.tone} />
                      <StatusBadge label={ps.label} tone={ps.tone} />
                    </div>

                    <p className="w-full font-bold text-primary sm:w-auto">
                      {formatRupiah(o.total_amount)}
                    </p>

                    <ChevronDown
                      className={cn(
                        "size-5 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {isOpen && (
                    <div className="grid gap-6 border-t border-border bg-secondary/30 p-5 md:grid-cols-[1.4fr_1fr]">
                      <div>
                        <h3 className="mb-3 text-sm font-semibold">Produk</h3>

                        <ul className="divide-y divide-border rounded-2xl bg-card">
                          {o.order_items.map((it) => (
                            <li
                              key={it.id}
                              className="flex justify-between gap-3 p-3 text-sm"
                            >
                              <div>
                                <p className="font-medium">{it.product_name_snapshot}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatNumber(it.quantity)} {it.unit_snapshot} ×{" "}
                                  {formatRupiah(it.unit_price_snapshot)}
                                  {it.price_type_snapshot === "wholesale" && " (grosir)"}
                                </p>
                              </div>
                              <p className="font-medium">{formatRupiah(it.subtotal)}</p>
                            </li>
                          ))}
                        </ul>

                        <dl className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd>{formatRupiah(o.subtotal)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Ongkos kirim</dt>
                            <dd>{formatRupiah(o.shipping_cost)}</dd>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <dt>Total</dt>
                            <dd className="text-primary">{formatRupiah(o.total_amount)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div>
                          <h3 className="mb-1 font-semibold">Alamat pengiriman</h3>
                          <p>
                            {addr.recipient_name} · {addr.phone}
                          </p>
                          <p className="text-muted-foreground">{formatAddress(addr)}</p>
                        </div>

                        <div>
                          <h3 className="mb-1 font-semibold">Pembayaran</h3>
                          <p>
                            Metode: {PAYMENT_METHOD[o.payment_method] ?? "QRIS"}
                          </p>
                          <p>Status: {ps.label}</p>

                          {o.payments.length > 0 && (
                            <ul className="mt-1 text-xs text-muted-foreground">
                              {o.payments.map((p) => (
                                <li key={p.id}>
                                  {formatRupiah(p.amount)} · {PAYMENT_STATUS[p.status].label} ·{" "}
                                  {formatDate(p.paid_at ?? p.created_at)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {o.customer_note && (
                          <div>
                            <h3 className="mb-1 font-semibold">Catatan</h3>
                            <p className="text-muted-foreground">{o.customer_note}</p>
                          </div>
                        )}

                        <PaymentPanel
                          orderId={o.id}
                          userId={user.id}
                          totalAmount={Number(o.total_amount)}
                          paymentStatus={o.payment_status}
                          orderStatus={o.order_status}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}
