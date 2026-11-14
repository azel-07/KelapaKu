import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Package } from "lucide-react";
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

type AddressSnap = { recipient_name?: string; phone?: string; address_line?: string; district?: string; city_regency?: string; province?: string; postal_code?: string | null };

function MyOrdersPage() {
  const { user } = useAuth();
  const { pesanan } = Route.useSearch();
  const { data, isLoading, isError, refetch } = useQuery({ ...myOrdersQuery(user?.id ?? ""), enabled: !!user });
  const [open, setOpen] = useState<string | null>(pesanan ?? null);

  return (
    <SiteLayout>
      <AccountHeader title="Pesanan Saya" subtitle="Pantau status pesanan dan pembayaran Anda." />
      <div className="container-page py-10">
        {isLoading || !user ? (
          <LoadingState label="Memuat pesanan…" />
        ) : isError ? (
          <ErrorState message="Pesanan tidak dapat dimuat." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState icon={Package} title="Belum ada pesanan" description="Pesanan yang Anda buat akan tampil di sini." action={<Button asChild><Link to="/products">Mulai belanja</Link></Button>} />
        ) : (
          <ul className="space-y-4">
            {data.map((o) => {
              const isOpen = open === o.id;
              const addr = (o.shipping_address_snapshot ?? {}) as AddressSnap;
              const os = ORDER_STATUS[o.order_status];
              const ps = PAYMENT_STATUS[o.payment_status];
              return (
                <li key={o.id} className={cn("overflow-hidden rounded-3xl border bg-card shadow-soft", pesanan === o.id ? "border-primary" : "border-border")}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : o.id)} className="flex w-full flex-wrap items-center gap-4 p-5 text-left" aria-expanded={isOpen}>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{o.order_number}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge label={os.label} tone={os.tone} />
                      <StatusBadge label={ps.label} tone={ps.tone} />
                    </div>
                    <p className="w-full font-bold text-primary sm:w-auto">{formatRupiah(o.total_amount)}</p>
                    <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="grid gap-6 border-t border-border bg-secondary/30 p-5 md:grid-cols-[1.4fr_1fr]">
                      <div>
                        <h3 className="mb-3 text-sm font-semibold">Produk</h3>
                        <ul className="divide-y divide-border rounded-2xl bg-card">
                          {o.order_items.map((it) => (
                            <li key={it.id} className="flex justify-between gap-3 p-3 text-sm">
                              <div>
                                <p className="font-medium">{it.product_name_snapshot}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatNumber(it.quantity)} {it.unit_snapshot} × {formatRupiah(it.unit_price_snapshot)}
                                  {it.price_type_snapshot === "wholesale" && " (grosir)"}
                                </p>
                              </div>
                              <p className="font-medium">{formatRupiah(it.subtotal)}</p>
                            </li>
                          ))}
                        </ul>
                        <dl className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatRupiah(o.subtotal)}</dd></div>
                          <div className="flex justify-between"><dt className="text-muted-foreground">Ongkos kirim</dt><dd>{formatRupiah(o.shipping_cost)}</dd></div>
                          <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="text-primary">{formatRupiah(o.total_amount)}</dd></div>
                        </dl>
                      </div>
                      <div className="space-y-4 text-sm">
                        <div>
                          <h3 className="mb-1 font-semibold">Alamat pengiriman</h3>
                          <p>{addr.recipient_name} · {addr.phone}</p>
                          <p className="text-muted-foreground">{formatAddress(addr)}</p>
                        </div>
                        <div>
                          <h3 className="mb-1 font-semibold">Pembayaran</h3>
                          <p>Metode: {PAYMENT_METHOD[o.payment_method]}</p>
                          <p>Status: {ps.label}</p>
                          {o.payments.length > 0 && (
                            <ul className="mt-1 text-xs text-muted-foreground">
                              {o.payments.map((p) => (
                                <li key={p.id}>{formatRupiah(p.amount)} · {PAYMENT_STATUS[p.status].label} · {formatDate(p.paid_at ?? p.created_at)}</li>
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
