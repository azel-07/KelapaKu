import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Loader2, Pause, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect } from "@/components/admin/AdminToolbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { WHOLESALE_STATUS, type WholesaleStatus } from "@/lib/status";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/wholesale")({
  head: () => ({
    meta: [
      { title: "Manajemen Grosir — Admin KelapaKu" },
      { name: "description", content: "Atur harga grosir dan pengajuan pelanggan grosir." },
      { property: "og:title", content: "Manajemen Grosir — Admin KelapaKu" },
      { property: "og:description", content: "Atur harga grosir dan pengajuan pelanggan grosir." },
    ],
  }),
  component: AdminWholesale,
});

function AdminWholesale() {
  return (
    <div>
      <AdminPageHeader title="Grosir" description="Kelola harga bertingkat dan pengajuan pelanggan grosir." />
      <Tabs defaultValue="tiers">
        <TabsList className="mb-5">
          <TabsTrigger value="tiers">Harga grosir</TabsTrigger>
          <TabsTrigger value="applications">Pengajuan grosir</TabsTrigger>
        </TabsList>
        <TabsContent value="tiers"><PriceTiers /></TabsContent>
        <TabsContent value="applications"><Applications /></TabsContent>
      </Tabs>
    </div>
  );
}

type Tier = { id: string; product_id: string; tier_name: string; min_quantity: number; max_quantity: number | null; unit_price: number; is_active: boolean };

const tierSchema = z
  .object({
    tier_name: z.string().trim().min(1, "Nama tier wajib diisi").max(50),
    min_quantity: z.coerce.number().gt(0, "Minimal harus lebih dari 0"),
    max_quantity: z.union([z.literal("").transform(() => null), z.coerce.number().gt(0, "Maksimal harus lebih dari 0")]),
    unit_price: z.coerce.number().min(0, "Harga minimal 0"),
    is_active: z.boolean(),
  })
  .refine((d) => d.max_quantity == null || d.max_quantity >= d.min_quantity, { message: "Maksimal harus ≥ minimal", path: ["max_quantity"] });

type TierValues = { tier_name: string; min_quantity: string; max_quantity: string; unit_price: string; is_active: boolean };

function PriceTiers() {
  const qc = useQueryClient();
  const [productId, setProductId] = useState<string>("");
  const [editing, setEditing] = useState<Tier | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Tier | null>(null);
  const [values, setValues] = useState<TierValues>({ tier_name: "Grosir", min_quantity: "", max_quantity: "", unit_price: "", is_active: true });
  const [errors, setErrors] = useState<Partial<Record<keyof TierValues, string | undefined>>>({});

  const products = useQuery({
    queryKey: ["admin", "products", "options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, unit, retail_price, wholesale_min_quantity").order("name");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    if (!productId && products.data?.[0]) setProductId(products.data[0].id);
  }, [products.data, productId]);
  const product = products.data?.find((p) => p.id === productId);

  const tiers = useQuery({
    queryKey: ["admin", "tiers", productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_price_tiers").select("*").eq("product_id", productId).order("min_quantity");
      if (error) throw error;
      return data as Tier[];
    },
  });

  const openForm = (t: Tier | null) => {
    setEditing(t);
    setErrors({});
    setValues(
      t
        ? { tier_name: t.tier_name, min_quantity: String(t.min_quantity), max_quantity: t.max_quantity == null ? "" : String(t.max_quantity), unit_price: String(t.unit_price), is_active: t.is_active }
        : { tier_name: "Grosir", min_quantity: String(product?.wholesale_min_quantity || ""), max_quantity: "", unit_price: "", is_active: true },
    );
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async (v: z.output<typeof tierSchema>) => {
      const { error } = editing
        ? await supabase.from("product_price_tiers").update(v).eq("id", editing.id)
        : await supabase.from("product_price_tiers").insert({ ...v, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tiers", productId] });
      qc.invalidateQueries({ queryKey: ["price-tiers"] });
      toast.success("Harga grosir disimpan");
      setOpen(false);
    },
    onError: (e) => toast.error("Gagal menyimpan harga grosir", { description: dbErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_price_tiers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tiers", productId] });
      toast.success("Harga grosir dihapus");
      setToDelete(null);
    },
    onError: (e) => toast.error("Gagal menghapus", { description: dbErrorMessage(e) }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = tierSchema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    save.mutate(parsed.data);
  };

  const columns: Column<Tier>[] = [
    { header: "Nama tier", cell: (t) => <span className="font-medium">{t.tier_name}</span> },
    { header: "Jumlah", cell: (t) => `${formatNumber(t.min_quantity)}${t.max_quantity != null ? ` – ${formatNumber(t.max_quantity)}` : "+"} ${product?.unit ?? ""}` },
    { header: "Harga satuan", cell: (t) => formatRupiah(t.unit_price) },
    { header: "Status", cell: (t) => <StatusBadge label={t.is_active ? "Aktif" : "Nonaktif"} tone={t.is_active ? "success" : "neutral"} /> },
    {
      header: "Aksi",
      className: "text-right",
      cell: (t) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(t)} aria-label="Ubah"><Pencil /></Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setToDelete(t)} aria-label="Hapus"><Trash2 /></Button>
        </div>
      ),
    },
  ];

  if (!products.isLoading && !products.data?.length) {
    return <EmptyState title="Belum ada produk" description="Tambahkan produk terlebih dahulu untuk mengatur harga grosir." />;
  }

  const field = (k: Exclude<keyof TierValues, "is_active">, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`t-${k}`}>{label}</Label>
      <Input id={`t-${k}`} value={values[k]} onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))} className="rounded-xl" {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={productId} onValueChange={setProductId}>
          <SelectTrigger className="h-10 w-full rounded-full bg-card sm:w-80"><SelectValue placeholder="Pilih produk" /></SelectTrigger>
          <SelectContent>{products.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => openForm(null)} disabled={!productId}><Plus /> Tambah tier</Button>
      </div>
      {product && <p className="text-sm text-muted-foreground">Harga eceran: {formatRupiah(product.retail_price)} / {product.unit}. Harga grosir hanya berlaku untuk pelanggan grosir yang disetujui.</p>}
      <DataTable columns={columns} rows={tiers.data} rowKey={(t) => t.id} loading={tiers.isLoading || products.isLoading} error={tiers.isError} onRetry={() => tiers.refetch()} emptyTitle="Belum ada harga grosir" emptyDescription="Tambahkan tier harga untuk produk ini." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? "Ubah tier harga" : "Tambah tier harga"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            {field("tier_name", "Nama tier")}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("min_quantity", "Minimal jumlah", { type: "number", min: 0, step: "any" })}
              {field("max_quantity", "Maksimal jumlah (opsional)", { type: "number", min: 0, step: "any", placeholder: "Tanpa batas" })}
            </div>
            {field("unit_price", "Harga satuan (Rp)", { type: "number", min: 0 })}
            <label className="flex items-center gap-2 text-sm"><Switch checked={values.is_active} onCheckedChange={(c) => setValues((v) => ({ ...v, is_active: c }))} /> Aktif</label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="animate-spin" />} Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Hapus tier harga ini?" onConfirm={() => toDelete && remove.mutate(toDelete.id)} loading={remove.isPending} />
    </div>
  );
}

type Application = {
  id: string;
  user_id: string;
  full_name: string;
  business_name: string;
  business_type: string;
  whatsapp: string;
  email: string;
  business_address: string;
  estimated_purchase_quantity: string | null;
  notes: string | null;
  status: WholesaleStatus;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const APP_OPTIONS = (Object.keys(WHOLESALE_STATUS) as WholesaleStatus[]).map((s) => ({ value: s, label: WHOLESALE_STATUS[s].label }));

function Applications() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState("all");
  const [action, setAction] = useState<{ app: Application; next: Exclude<WholesaleStatus, "pending"> } | null>(null);
  const [note, setNote] = useState("");

  const apps = useQuery({
    queryKey: ["admin", "wholesale-apps"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wholesale_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
  });
  const filtered = useMemo(() => (apps.data ?? []).filter((a) => status === "all" || a.status === status), [apps.data, status]);

  const review = useMutation({
    mutationFn: async ({ app, next }: { app: Application; next: Exclude<WholesaleStatus, "pending"> }) => {
      const a = await supabase
        .from("wholesale_applications")
        .update({ status: next, reviewed_by: user!.id, reviewed_at: new Date().toISOString(), review_notes: note.trim() || null })
        .eq("id", app.id);
      if (a.error) throw a.error;
      // account_type pada profiles menentukan akses harga grosir (fungsi is_approved_wholesale).
      const accountType = next === "approved" ? "wholesale" : "retail";
      const b = await supabase.from("profiles").update({ account_type: accountType }).eq("id", app.user_id);
      if (b.error) throw b.error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(`Pengajuan ${WHOLESALE_STATUS[v.next].label.toLowerCase()}`);
      setAction(null);
      setNote("");
    },
    onError: (e) => toast.error("Gagal memproses pengajuan", { description: dbErrorMessage(e) }),
  });

  const columns: Column<Application>[] = [
    { header: "Usaha", cell: (a) => <div><p className="font-medium">{a.business_name}</p><p className="text-xs text-muted-foreground">{a.business_type}</p></div> },
    { header: "Pemohon", cell: (a) => <div><p>{a.full_name}</p><p className="text-xs text-muted-foreground">{a.email} · {a.whatsapp}</p></div> },
    { header: "Estimasi pembelian", cell: (a) => a.estimated_purchase_quantity || "-" },
    { header: "Tanggal", cell: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(a.created_at)}</span> },
    { header: "Status", cell: (a) => <StatusBadge {...WHOLESALE_STATUS[a.status]} /> },
    {
      header: "Aksi",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end gap-1">
          {a.status !== "approved" && <Button size="sm" onClick={() => setAction({ app: a, next: "approved" })}><Check /> Setujui</Button>}
          {a.status === "pending" && <Button size="sm" variant="outline" className="text-destructive" onClick={() => setAction({ app: a, next: "rejected" })}><X /> Tolak</Button>}
          {a.status === "approved" && <Button size="sm" variant="outline" onClick={() => setAction({ app: a, next: "suspended" })}><Pause /> Tangguhkan</Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <FilterSelect value={status} onChange={setStatus} options={APP_OPTIONS} />
      <DataTable columns={columns} rows={filtered} rowKey={(a) => a.id} loading={apps.isLoading} error={apps.isError} onRetry={() => apps.refetch()} emptyTitle="Belum ada pengajuan grosir" />
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        destructive={action?.next !== "approved"}
        title={action ? `${action.next === "approved" ? "Setujui" : action.next === "rejected" ? "Tolak" : "Tangguhkan"} pengajuan ${action.app.business_name}?` : ""}
        confirmLabel="Ya, lanjutkan"
        description={
          <span className="block space-y-3">
            <span className="block">
              {action?.next === "approved"
                ? "Akun pemohon akan diubah menjadi pelanggan grosir dan dapat melihat harga grosir."
                : "Akun pemohon akan menjadi pelanggan eceran."}
            </span>
            {action?.app.notes && <span className="block text-xs">Catatan pemohon: {action.app.notes}</span>}
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan peninjauan (opsional)" maxLength={500} rows={2} />
          </span>
        }
        onConfirm={() => action && review.mutate(action)}
        loading={review.isPending}
      />
    </div>
  );
}
