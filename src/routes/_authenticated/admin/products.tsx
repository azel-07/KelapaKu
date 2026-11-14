import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect, SearchInput } from "@/components/admin/AdminToolbar";
import { FormProduct, type ProductRow } from "@/components/admin/FormProduct";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";
import { ProductImage } from "@/components/product/ProductImage";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber, formatRupiah } from "@/lib/format";
import { PRODUCT_BUCKET, primaryImage } from "@/lib/images";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({
    meta: [
      { title: "Manajemen Produk — Admin KelapaKu" },
      { name: "description", content: "Kelola produk KelapaKu." },
      { property: "og:title", content: "Manajemen Produk — Admin KelapaKu" },
      { property: "og:description", content: "Kelola produk KelapaKu." },
    ],
  }),
  component: AdminProducts,
});

type Row = ProductRow & {
  categories: { name: string } | null;
  product_images: { image_url: string; is_primary: boolean; sort_order: number }[];
};

function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("data");
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), product_images(image_url, is_primary, sort_order)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products.data ?? []).filter(
      (p) =>
        (!q || p.name.toLowerCase().includes(q) || p.slug.includes(q)) &&
        (status === "all" || (status === "active" ? p.is_active : !p.is_active)),
    );
  }, [products.data, search, status]);

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(v.is_active ? "Produk diaktifkan" : "Produk dinonaktifkan");
    },
    onError: (e) => toast.error("Gagal mengubah status", { description: dbErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: async (p: Row) => {
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      const { data: files } = await supabase.storage.from(PRODUCT_BUCKET).list(`products/${p.id}`);
      if (files?.length) await supabase.storage.from(PRODUCT_BUCKET).remove(files.map((f) => `products/${p.id}/${f.name}`));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produk dihapus");
      setToDelete(null);
    },
    onError: (e) => toast.error("Gagal menghapus produk", { description: dbErrorMessage(e) }),
  });

  const openForm = (p: ProductRow | null) => {
    setEditing(p);
    setTab("data");
    setOpen(true);
  };

  const columns: Column<Row>[] = [
    {
      header: "Produk",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <ProductImage src={primaryImage(p.product_images)} alt={p.name} className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.categories?.name ?? "-"} {p.is_featured && "· Unggulan"}</p>
          </div>
        </div>
      ),
    },
    { header: "Harga", cell: (p) => <span>{formatRupiah(p.retail_price)} <span className="text-xs text-muted-foreground">/ {p.unit}</span></span> },
    {
      header: "Stok",
      cell: (p) => (
        <StatusBadge label={`${formatNumber(p.stock_quantity)} ${p.unit}`} tone={Number(p.stock_quantity) <= 0 ? "danger" : Number(p.stock_quantity) <= 10 ? "warning" : "neutral"} />
      ),
    },
    {
      header: "Aktif",
      cell: (p) => (
        <Switch checked={p.is_active} disabled={toggle.isPending} onCheckedChange={(c) => toggle.mutate({ id: p.id, is_active: c })} aria-label={`Status aktif ${p.name}`} />
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => openForm(p)} aria-label={`Ubah ${p.name}`}><Pencil /></Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setToDelete(p)} aria-label={`Hapus ${p.name}`}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Produk" description="Tambah, ubah, dan atur stok serta gambar produk." action={<Button onClick={() => openForm(null)}><Plus /> Tambah produk</Button>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama produk…" />
        <FilterSelect value={status} onChange={setStatus} options={[{ value: "active", label: "Aktif" }, { value: "inactive", label: "Nonaktif" }]} />
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} loading={products.isLoading} error={products.isError} onRetry={() => products.refetch()} emptyTitle="Belum ada produk" emptyDescription="Klik “Tambah produk” untuk membuat produk pertama." />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? `Ubah produk: ${editing.name}` : "Tambah produk"}</DialogTitle></DialogHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="data">Data produk</TabsTrigger>
              <TabsTrigger value="images" disabled={!editing}>Gambar {!editing && "(simpan dulu)"}</TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <FormProduct
                product={editing}
                onCancel={() => setOpen(false)}
                onSaved={(p) => {
                  if (!editing) {
                    setEditing(p);
                    setTab("images");
                  } else {
                    setOpen(false);
                  }
                }}
              />
            </TabsContent>
            <TabsContent value="images">{editing && <ProductImagesManager productId={editing.id} productName={editing.name} />}</TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Hapus produk "${toDelete?.name}"?`}
        description="Produk, gambar, harga grosir, dan item keranjang terkait akan dihapus. Riwayat pesanan tetap menyimpan nama dan harga produk."
        onConfirm={() => toDelete && remove.mutate(toDelete)}
        loading={remove.isPending}
      />
    </div>
  );
}
