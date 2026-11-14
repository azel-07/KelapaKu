import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FormCategory, type CategoryRow } from "@/components/admin/FormCategory";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { categoryImage } from "@/lib/images";
import { dbErrorMessage } from "@/lib/db-error";
import { ProductImage } from "@/components/product/ProductImage";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Manajemen Kategori — Admin KelapaKu" },
      { name: "description", content: "Kelola kategori produk KelapaKu." },
      { property: "og:title", content: "Manajemen Kategori — Admin KelapaKu" },
      { property: "og:description", content: "Kelola kategori produk KelapaKu." },
    ],
  }),
  component: AdminCategories,
});

type Row = CategoryRow & { products: { count: number }[] };

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const categories = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*, products(count)").order("sort_order").order("name");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("categories").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e) => toast.error("Gagal mengubah status", { description: dbErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori dihapus");
      setToDelete(null);
    },
    onError: (e) => toast.error("Gagal menghapus kategori", { description: dbErrorMessage(e) }),
  });

  const count = (c: Row) => c.products?.[0]?.count ?? 0;

  const columns: Column<Row>[] = [
    {
      header: "Kategori",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <ProductImage src={categoryImage(c)} alt={c.name} className="size-11 shrink-0 rounded-xl" />
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">/{c.slug}</p>
          </div>
        </div>
      ),
    },
    { header: "Deskripsi", cell: (c) => <span className="line-clamp-2 max-w-xs text-muted-foreground">{c.description || "-"}</span> },
    { header: "Produk", cell: (c) => <StatusBadge label={`${count(c)} produk`} tone="neutral" /> },
    { header: "Urutan", cell: (c) => c.sort_order },
    { header: "Aktif", cell: (c) => <Switch checked={c.is_active} onCheckedChange={(v) => toggle.mutate({ id: c.id, is_active: v })} aria-label={`Status ${c.name}`} /> },
    {
      header: "Aksi",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditing(c); setOpen(true); }} aria-label={`Ubah ${c.name}`}><Pencil /></Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setToDelete(c)} aria-label={`Hapus ${c.name}`}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Kategori" description="Atur kategori produk yang tampil di toko." action={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Tambah kategori</Button>} />
      <DataTable columns={columns} rows={categories.data} rowKey={(c) => c.id} loading={categories.isLoading} error={categories.isError} onRetry={() => categories.refetch()} emptyTitle="Belum ada kategori" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Ubah kategori" : "Tambah kategori"}</DialogTitle></DialogHeader>
          <FormCategory category={editing} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Hapus kategori "${toDelete?.name}"?`}
        description={toDelete && count(toDelete) > 0 ? `Kategori ini masih memiliki ${count(toDelete)} produk. Pindahkan atau hapus produknya terlebih dahulu.` : "Kategori akan dihapus permanen."}
        onConfirm={() => toDelete && (count(toDelete) > 0 ? toast.error("Kategori masih memiliki produk") : remove.mutate(toDelete.id))}
        loading={remove.isPending}
      />
    </div>
  );
}
