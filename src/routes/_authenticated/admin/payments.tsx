import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect, SearchInput } from "@/components/admin/AdminToolbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, formatRupiah } from "@/lib/format";
import { PAYMENT_METHOD, PAYMENT_STATUS, type PaymentMethod, type PaymentStatus } from "@/lib/status";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({
    meta: [
      { title: "Manajemen Pembayaran — Admin KelapaKu" },
      { name: "description", content: "Verifikasi pembayaran pelanggan KelapaKu." },
      { property: "og:title", content: "Manajemen Pembayaran — Admin KelapaKu" },
      { property: "og:description", content: "Verifikasi pembayaran pelanggan KelapaKu." },
    ],
  }),
  component: AdminPayments,
});

type Row = {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  payment_reference: string | null;
  proof_url: string | null;
    proof_signed_url?: string | null;
  paid_at: string | null;
  created_at: string;
  verified_at: string | null;
  admin_note: string | null;
  orders: { order_number: string; total_amount: number; order_status: string } | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

const STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS) as PaymentStatus[]).map((s) => ({ value: s, label: PAYMENT_STATUS[s].label }));

function AdminPayments() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [action, setAction] = useState<{ row: Row; kind: "confirmed" | "rejected" } | null>(null);
  const [note, setNote] = useState("");

  const payments = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, orders(order_number, total_amount, order_status), profiles!payments_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as Row[];

      return Promise.all(
        rows.map(async (payment) => {
          if (!payment.proof_url) {
            return { ...payment, proof_signed_url: null };
          }

          // URL lama yang sudah berupa URL lengkap tetap bisa digunakan.
          if (/^https?:\/\//.test(payment.proof_url)) {
            return {
              ...payment,
              proof_signed_url: payment.proof_url,
            };
          }

          const { data: signed, error: signedError } =
            await supabase.storage
              .from("payment-proofs")
              .createSignedUrl(payment.proof_url, 300);

          if (signedError) {
            console.error("Gagal membuat signed URL:", signedError);
            return { ...payment, proof_signed_url: null };
          }

          return {
            ...payment,
            proof_signed_url: signed.signedUrl,
          };
        }),
      );
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (payments.data ?? []).filter(
      (p) => (!q || p.orders?.order_number.toLowerCase().includes(q)) && (status === "all" || p.status === status),
    );
  }, [payments.data, search, status]);

  const verify = useMutation({
    mutationFn: async ({ row, kind }: { row: Row; kind: "confirmed" | "rejected" }) => {
      if (kind === "confirmed") {
        if (!row.proof_url) {
          throw new Error("Bukti pembayaran belum diunggah oleh pelanggan");
        }
        if (row.orders && Number(row.amount) !== Number(row.orders.total_amount)) {
          throw new Error(
            `Nominal pembayaran (${formatRupiah(row.amount)}) tidak sesuai dengan total tagihan pesanan (${formatRupiah(row.orders.total_amount)})`
          );
        }
      }

      const payload: {
        p_payment_id: string;
        p_action: string;
        p_admin_note?: string;
      } = {
        p_payment_id: row.id,
        p_action: kind,
      };
      if (note.trim()) {
        payload.p_admin_note = note.trim();
      }

      const { data, error } = await supabase.rpc("admin_verify_payment", payload);

      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(v.kind === "confirmed" ? "Pembayaran diverifikasi" : "Pembayaran ditolak");
      setAction(null);
      setNote("");
    },
    onError: (e) => toast.error("Gagal memproses pembayaran", { description: dbErrorMessage(e) }),
  });

  const columns: Column<Row>[] = [
    { header: "No. Pesanan", cell: (p) => <span className="font-medium">{p.orders?.order_number ?? "-"}</span> },
    { header: "Pelanggan", cell: (p) => <div><p>{p.profiles?.full_name || "-"}</p><p className="text-xs text-muted-foreground">{p.profiles?.email}</p></div> },
    { header: "Metode", cell: (p) => PAYMENT_METHOD[p.method] },
    {
      header: "Jumlah",
      cell: (p) => (
        <div>
          <p className="font-semibold">{formatRupiah(p.amount)}</p>
          {p.orders && Number(p.amount) !== Number(p.orders.total_amount) && <p className="text-xs text-earth">Tagihan: {formatRupiah(p.orders.total_amount)}</p>}
        </div>
      ),
    },
    { header: "Status", cell: (p) => <StatusBadge {...PAYMENT_STATUS[p.status]} /> },
    { header: "Tanggal bayar", cell: (p) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(p.paid_at ?? p.created_at)}</span> },
        {
      header: "Bukti",
      cell: (p) =>
        p.proof_signed_url ? (
          <a
            href={p.proof_signed_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Lihat bukti <ExternalLink className="size-3" />
          </a>
        ) : (
          <span className="text-muted-foreground">
            {p.proof_url ? "Bukti tidak dapat dibuka" : p.payment_reference || "-"}
          </span>
        ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (p) =>
        p.status === "pending_confirmation" ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" onClick={() => setAction({ row: p, kind: "confirmed" })}><Check /> Verifikasi</Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => setAction({ row: p, kind: "rejected" })}><X /> Tolak</Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">{p.verified_at ? `Diproses ${formatDate(p.verified_at)}` : "-"}</span>
        ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Pembayaran" description="Pembayaran hanya dianggap lunas setelah diverifikasi admin." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nomor pesanan…" />
        <FilterSelect value={status} onChange={setStatus} options={STATUS_OPTIONS} />
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} loading={payments.isLoading} error={payments.isError} onRetry={() => payments.refetch()} emptyTitle="Belum ada data pembayaran" emptyDescription="Pembayaran yang dikirim pelanggan akan tampil di sini." />
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        destructive={action?.kind === "rejected"}
        title={action?.kind === "confirmed" ? "Verifikasi pembayaran ini?" : "Tolak pembayaran ini?"}
        confirmLabel={action?.kind === "confirmed" ? "Ya, verifikasi" : "Ya, tolak"}
        description={
          <span className="block space-y-3">
            <span className="block">
              {action?.row.orders?.order_number} · {action && formatRupiah(action.row.amount)}. Pastikan dana sudah benar-benar diterima sebelum memverifikasi.
            </span>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan admin (opsional)" maxLength={500} rows={2} />
          </span>
        }
        onConfirm={() => action && verify.mutate(action)}
        loading={verify.isPending}
      />
    </div>
  );
}
