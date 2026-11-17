import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect, SearchInput } from "@/components/admin/AdminToolbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { formatAddress } from "@/lib/account";
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, type OrderStatus } from "@/lib/status";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({
    meta: [
      { title: "Manajemen Pesanan — Admin KelapaKu" },
      { name: "description", content: "Kelola pesanan pelanggan KelapaKu." },
      { property: "og:title", content: "Manajemen Pesanan — Admin KelapaKu" },
      { property: "og:description", content: "Kelola pesanan pelanggan KelapaKu." },
    ],
  }),
  component: AdminOrders,
});

const STATUS_OPTIONS = (Object.keys(ORDER_STATUS) as OrderStatus[]).map((s) => ({ value: s, label: ORDER_STATUS[s].label }));

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  customer_name_snapshot: string;
  customer_phone_snapshot: string;
  customer_email_snapshot: string | null;
  order_status: OrderStatus;
  payment_status: keyof typeof PAYMENT_STATUS;
  total_amount: number;
};

function AdminOrders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, customer_name_snapshot, customer_phone_snapshot, customer_email_snapshot, order_status, payment_status, total_amount")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OrderRow[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (orders.data ?? []).filter((o) => (!q || o.order_number.toLowerCase().includes(q)) && (status === "all" || o.order_status === status));
  }, [orders.data, search, status]);

  const columns: Column<OrderRow>[] = [
    { header: "No. Pesanan", cell: (o) => <span className="font-medium">{o.order_number}</span> },
    { header: "Tanggal", cell: (o) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(o.created_at)}</span> },
    { header: "Pelanggan", cell: (o) => <div><p>{o.customer_name_snapshot}</p><p className="text-xs text-muted-foreground">{o.customer_phone_snapshot}</p></div> },
    { header: "Total", cell: (o) => <span className="font-semibold">{formatRupiah(o.total_amount)}</span> },
    { header: "Status", cell: (o) => <StatusBadge {...ORDER_STATUS[o.order_status]} /> },
    { header: "Pembayaran", cell: (o) => <StatusBadge {...PAYMENT_STATUS[o.payment_status]} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Pesanan" description="Klik baris pesanan untuk melihat detail dan mengubah status." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nomor pesanan (KK-…)" />
        <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(o) => o.id} loading={orders.isLoading} error={orders.isError} onRetry={() => orders.refetch()} emptyTitle="Tidak ada pesanan" onRowClick={(o) => setSelected(o.id)} />
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && <OrderDetail id={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

type AddressSnap = Record<string, string | null | undefined>;

function OrderDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const order = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*), payments(id, amount, method, status, paid_at, created_at)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });
  const [status, setStatus] = useState<OrderStatus>("awaiting_payment");
  const [shipping, setShipping] = useState("0");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!order.data) return;
    setStatus(order.data.order_status);
    setShipping(String(order.data.shipping_cost));
    setNote(order.data.admin_note ?? "");
  }, [order.data]);

  const save = useMutation({
    mutationFn: async () => {
      const cost = Number(shipping);
      if (!Number.isFinite(cost) || cost < 0) throw new Error("Ongkos kirim tidak valid");
      if (note.length > 1000) throw new Error("Catatan admin maksimal 1000 karakter");

      if (status === "completed" && order.data!.payment_status !== "confirmed") {
        throw new Error("Pesanan belum dapat diselesaikan karena pembayaran belum dikonfirmasi.");
      }

      const payload: {
        p_order_id: string;
        p_order_status: string;
        p_shipping_cost: number;
        p_admin_note?: string;
      } = {
        p_order_id: id,
        p_order_status: status,
        p_shipping_cost: cost,
      };
      if (note.trim()) {
        payload.p_admin_note = note.trim();
      }

      const { data, error } = await supabase.rpc("admin_update_order", payload);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Pesanan diperbarui");
    },
    onError: (e) => toast.error("Gagal memperbarui pesanan", { description: dbErrorMessage(e) }),
  });

  if (order.isLoading || !order.data) return <LoadingState />;
  const o = order.data;
  const addr = (o.shipping_address_snapshot ?? {}) as AddressSnap;

  return (
    <div className="space-y-6">
      <SheetHeader className="p-0">
        <SheetTitle>{o.order_number}</SheetTitle>
        <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
        <div className="flex gap-2">
          <StatusBadge {...ORDER_STATUS[o.order_status]} />
          <StatusBadge {...PAYMENT_STATUS[o.payment_status]} />
        </div>
      </SheetHeader>

      <section className="rounded-2xl bg-secondary/50 p-4 text-sm">
        <h3 className="mb-2 font-semibold">Pelanggan</h3>
        <p>{o.customer_name_snapshot}</p>
        <p className="text-muted-foreground">{o.customer_phone_snapshot}{o.customer_email_snapshot && ` · ${o.customer_email_snapshot}`}</p>
        <h3 className="mb-1 mt-4 font-semibold">Alamat pengiriman</h3>
        <p>{addr["recipient_name"]} · {addr["phone"]}</p>
        <p className="text-muted-foreground">{formatAddress(addr)}</p>
        {addr["notes"] && <p className="text-xs text-muted-foreground">Catatan alamat: {addr["notes"]}</p>}
        {o.customer_note && <><h3 className="mb-1 mt-4 font-semibold">Catatan pelanggan</h3><p className="text-muted-foreground">{o.customer_note}</p></>}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Produk dibeli</h3>
        <ul className="divide-y divide-border rounded-2xl border border-border text-sm">
          {o.order_items.map((it) => (
            <li key={it.id} className="flex justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{it.product_name_snapshot}</p>
                <p className="text-xs text-muted-foreground">{formatNumber(it.quantity)} {it.unit_snapshot} × {formatRupiah(it.unit_price_snapshot)} {it.price_type_snapshot === "wholesale" && "(grosir)"}</p>
              </div>
              <span className="font-medium">{formatRupiah(it.subtotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatRupiah(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Ongkos kirim</dt><dd>{formatRupiah(o.shipping_cost)}</dd></div>
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatRupiah(o.total_amount)}</dd></div>
          <div className="flex justify-between text-muted-foreground"><dt>Metode pembayaran</dt><dd>{PAYMENT_METHOD[o.payment_method]}</dd></div>
        </dl>
        {o.payments.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            Pembayaran: {o.payments.map((p) => `${formatRupiah(p.amount)} (${PAYMENT_STATUS[p.status].label})`).join(", ")} — verifikasi di menu Pembayaran.
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold">Kelola pesanan</h3>
        <div className="space-y-1.5">
          <Label>Status pesanan</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem
                  key={s.value}
                  value={s.value}
                  disabled={s.value === "completed" && o.payment_status !== "confirmed"}
                >
                  {s.label}
                  {s.value === "completed" && o.payment_status !== "confirmed" ? " (Perlu Konfirmasi Pembayaran)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {status === "completed" && o.payment_status !== "confirmed" && (
            <p className="text-xs text-destructive">
              Pesanan tidak dapat diselesaikan jika pembayaran belum dikonfirmasi.
            </p>
          )}
          {status === "cancelled" && o.order_status !== "cancelled" && <p className="text-xs text-earth">Catatan: membatalkan pesanan tidak mengembalikan stok secara otomatis.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ship">Ongkos kirim (Rp)</Label>
          <Input id="ship" type="number" min={0} value={shipping} onChange={(e) => setShipping(e.target.value)} className="rounded-xl" />
          <p className="text-xs text-muted-foreground">Total akan dihitung ulang: subtotal + ongkos kirim.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="anote">Catatan admin</Label>
          <Textarea id="anote" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} />
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
          {save.isPending && <Loader2 className="animate-spin" />} Simpan perubahan
        </Button>
      </section>
    </div>
  );
}
