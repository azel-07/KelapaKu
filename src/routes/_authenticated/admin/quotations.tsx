import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect } from "@/components/admin/AdminToolbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { QUOTATION_STATUS, type QuotationStatus } from "@/lib/status";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/quotations")({
  head: () => ({
    meta: [
      { title: "Manajemen Penawaran — Admin KelapaKu" },
      { name: "description", content: "Kelola permintaan penawaran harga KelapaKu." },
      { property: "og:title", content: "Manajemen Penawaran — Admin KelapaKu" },
      { property: "og:description", content: "Kelola permintaan penawaran harga KelapaKu." },
    ],
  }),
  component: AdminQuotations,
});

type Row = {
  id: string;
  business_name: string | null;
  business_type: string | null;
  whatsapp: string | null;
  status: QuotationStatus;
  quoted_total: number | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
  quotation_items: { count: number }[];
};

const OPTIONS = (Object.keys(QUOTATION_STATUS) as QuotationStatus[]).map((s) => ({ value: s, label: QUOTATION_STATUS[s].label }));

function AdminQuotations() {
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({
    queryKey: ["admin", "quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("id, business_name, business_type, whatsapp, status, quoted_total, created_at, profiles!quotations_user_id_fkey(full_name, email), quotation_items(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Row[];
    },
  });
  const filtered = useMemo(() => (list.data ?? []).filter((q) => status === "all" || q.status === status), [list.data, status]);

  const columns: Column<Row>[] = [
    { header: "Usaha", cell: (q) => <div><p className="font-medium">{q.business_name || "-"}</p><p className="text-xs text-muted-foreground">{q.business_type}</p></div> },
    { header: "Pelanggan", cell: (q) => <div><p>{q.profiles?.full_name || "-"}</p><p className="text-xs text-muted-foreground">{q.whatsapp || q.profiles?.email}</p></div> },
    { header: "Item", cell: (q) => `${q.quotation_items?.[0]?.count ?? 0} produk` },
    { header: "Total penawaran", cell: (q) => (q.quoted_total != null ? formatRupiah(q.quoted_total) : "-") },
    { header: "Tanggal", cell: (q) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(q.created_at)}</span> },
    { header: "Status", cell: (q) => <StatusBadge {...QUOTATION_STATUS[q.status]} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Penawaran" description="Klik baris untuk melihat detail permintaan dan memberi penawaran." />
      <div className="mb-4"><FilterSelect value={status} onChange={setStatus} options={OPTIONS} /></div>
      <DataTable columns={columns} rows={filtered} rowKey={(q) => q.id} loading={list.isLoading} error={list.isError} onRetry={() => list.refetch()} emptyTitle="Belum ada permintaan penawaran" onRowClick={(q) => setSelected(q.id)} />
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{selected && <QuotationDetail id={selected} />}</SheetContent>
      </Sheet>
    </div>
  );
}

function QuotationDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["admin", "quotation", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("quotations").select("*, quotation_items(*)").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const [status, setStatus] = useState<QuotationStatus>("waiting");
  const [notes, setNotes] = useState("");
  const [offers, setOffers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!q.data) return;
    setStatus(q.data.status);
    setNotes(q.data.admin_quote_notes ?? "");
    setOffers(Object.fromEntries(q.data.quotation_items.map((i) => [i.id, i.offered_unit_price == null ? "" : String(i.offered_unit_price)])));
  }, [q.data]);

  const total = (q.data?.quotation_items ?? []).reduce((s, i) => {
    const v = Number(offers[i.id]);
    return offers[i.id] && Number.isFinite(v) ? s + v * Number(i.quantity) : s;
  }, 0);
  const anyOffer = Object.values(offers).some((v) => v !== "");

  const save = useMutation({
    mutationFn: async () => {
      for (const item of q.data!.quotation_items) {
        const raw = offers[item.id] ?? "";
        const value = raw === "" ? null : Number(raw);
        if (value != null && (!Number.isFinite(value) || value < 0)) throw new Error(`Harga untuk ${item.product_name_snapshot} tidak valid`);
        if (value !== item.offered_unit_price) {
          const { error } = await supabase.from("quotation_items").update({ offered_unit_price: value }).eq("id", item.id);
          if (error) throw error;
        }
      }
      const { error } = await supabase
        .from("quotations")
        .update({ status, admin_quote_notes: notes.trim() || null, quoted_total: anyOffer ? total : null, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Penawaran disimpan");
    },
    onError: (e) => toast.error("Gagal menyimpan penawaran", { description: dbErrorMessage(e) }),
  });

  if (q.isLoading || !q.data) return <LoadingState />;
  const d = q.data;

  return (
    <div className="space-y-6">
      <SheetHeader className="p-0">
        <SheetTitle>{d.business_name || "Permintaan penawaran"}</SheetTitle>
        <p className="text-sm text-muted-foreground">{formatDate(d.created_at)}</p>
        <StatusBadge {...QUOTATION_STATUS[d.status]} className="w-fit" />
      </SheetHeader>
      <section className="space-y-1 rounded-2xl bg-secondary/50 p-4 text-sm">
        <p><span className="text-muted-foreground">Jenis usaha:</span> {d.business_type || "-"}</p>
        <p><span className="text-muted-foreground">WhatsApp:</span> {d.whatsapp || "-"}</p>
        <p><span className="text-muted-foreground">Jadwal pengiriman:</span> {d.delivery_schedule || "-"}</p>
        {d.request_notes && <p><span className="text-muted-foreground">Catatan:</span> {d.request_notes}</p>}
      </section>
      <section>
        <h3 className="mb-2 text-sm font-semibold">Item produk</h3>
        <ul className="space-y-2">
          {d.quotation_items.map((i) => (
            <li key={i.id} className="rounded-2xl border border-border p-3 text-sm">
              <div className="flex justify-between gap-2">
                <p className="font-medium">{i.product_name_snapshot}</p>
                <p>{formatNumber(i.quantity)} {i.unit_snapshot}</p>
              </div>
              <p className="text-xs text-muted-foreground">Harga diminta: {i.requested_unit_price != null ? formatRupiah(i.requested_unit_price) : "-"}</p>
              <div className="mt-2 flex items-center gap-2">
                <Label htmlFor={`o-${i.id}`} className="shrink-0 text-xs">Harga penawaran / {i.unit_snapshot}</Label>
                <Input id={`o-${i.id}`} type="number" min={0} value={offers[i.id] ?? ""} onChange={(e) => setOffers((o) => ({ ...o, [i.id]: e.target.value }))} className="h-8 rounded-xl" />
              </div>
            </li>
          ))}
        </ul>
        {anyOffer && <p className="mt-3 text-right text-sm font-semibold">Total penawaran: {formatRupiah(total)}</p>}
      </section>
      <section className="space-y-4 rounded-2xl border border-border p-4">
        <div className="space-y-1.5">
          <Label>Status penawaran</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as QuotationStatus)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qnotes">Catatan penawaran</Label>
          <Textarea id="qnotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} />
        </div>
        <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Simpan penawaran</Button>
      </section>
    </div>
  );
}
