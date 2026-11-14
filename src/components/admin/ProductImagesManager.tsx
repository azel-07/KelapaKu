import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Images, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingState } from "@/components/states/LoadingState";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_BUCKET, resolveImageUrl, storagePublicUrl } from "@/lib/images";
import { dbErrorMessage } from "@/lib/db-error";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;

type Img = { id: string; image_url: string; is_primary: boolean; sort_order: number; alt_text: string | null };

export function ProductImagesManager({ productId, productName }: { productId: string; productName: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [toDelete, setToDelete] = useState<Img | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const key = ["admin", "product-images", productId];

  const images = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_images").select("id, image_url, is_primary, sort_order, alt_text").eq("product_id", productId).order("sort_order");
      if (error) throw error;
      return data as Img[];
    },
  });

  const gallery = useQuery({
    queryKey: ["admin", "bucket-root"],
    enabled: galleryOpen,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(PRODUCT_BUCKET).list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      return data.filter((f) => f.id && /\.(jpe?g|png|webp|gif)$/i.test(f.name));
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const addRow = async (path: string) => {
    const list = images.data ?? [];
    const { error } = await supabase.from("product_images").insert({
      product_id: productId,
      image_url: path,
      alt_text: productName,
      is_primary: list.length === 0,
      sort_order: list.length,
    });
    if (error) throw error;
  };

  const upload = useMutation({
    mutationFn: async (files: File[]) => {
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} bukan file gambar`);
        if (file.size > MAX_SIZE) throw new Error(`${file.name} lebih dari 5 MB`);
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, { contentType: file.type });
        if (error) throw error;
        await addRow(path);
      }
    },
    onSuccess: () => { refresh(); toast.success("Gambar diunggah"); },
    onError: (e) => toast.error("Gagal mengunggah gambar", { description: dbErrorMessage(e) }),
  });

  const pick = useMutation({
    mutationFn: addRow,
    onSuccess: () => { refresh(); toast.success("Gambar ditambahkan"); setGalleryOpen(false); },
    onError: (e) => toast.error("Gagal menambahkan gambar", { description: dbErrorMessage(e) }),
  });

  const setPrimary = useMutation({
    mutationFn: async (img: Img) => {
      const a = await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId).neq("id", img.id);
      if (a.error) throw a.error;
      const b = await supabase.from("product_images").update({ is_primary: true }).eq("id", img.id);
      if (b.error) throw b.error;
    },
    onSuccess: () => { refresh(); toast.success("Gambar utama diperbarui"); },
    onError: (e) => toast.error("Gagal", { description: dbErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: async (img: Img) => {
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw error;
      // Hanya hapus file yang diunggah khusus untuk produk ini; foto bersama di root bucket dibiarkan.
      if (img.image_url.startsWith(`products/${productId}/`)) {
        await supabase.storage.from(PRODUCT_BUCKET).remove([img.image_url]);
      }
      const rest = (images.data ?? []).filter((i) => i.id !== img.id);
      if (img.is_primary && rest[0]) {
        await supabase.from("product_images").update({ is_primary: true }).eq("id", rest[0].id);
      }
    },
    onSuccess: () => { refresh(); toast.success("Gambar dihapus"); setToDelete(null); },
    onError: (e) => toast.error("Gagal menghapus gambar", { description: dbErrorMessage(e) }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) upload.mutate(f); e.target.value = ""; }} />
        <Button type="button" onClick={() => input.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? <Loader2 className="animate-spin" /> : <ImagePlus />} Unggah gambar
        </Button>
        <Button type="button" variant="outline" onClick={() => setGalleryOpen((o) => !o)}>
          <Images /> {galleryOpen ? "Tutup galeri" : "Pilih dari penyimpanan"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Format gambar (JPG, PNG, WEBP), maksimal 5 MB per file.</p>

      {galleryOpen && (
        <div className="rounded-2xl border border-border bg-muted/40 p-3">
          {gallery.isLoading ? <LoadingState /> : gallery.isError ? (
            <p className="text-sm text-destructive">Galeri tidak dapat dimuat.</p>
          ) : !gallery.data?.length ? (
            <p className="text-sm text-muted-foreground">Tidak ada gambar di penyimpanan.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {gallery.data.map((f) => (
                <button key={f.name} type="button" disabled={pick.isPending} onClick={() => pick.mutate(f.name)} className="group overflow-hidden rounded-xl border border-border bg-card text-left" title={f.name}>
                  <img src={storagePublicUrl(f.name)} alt={f.name} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                  <p className="truncate px-2 py-1 text-[11px]">{f.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {images.isLoading ? <LoadingState /> : !images.data?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Belum ada gambar untuk produk ini.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.data.map((img) => (
            <div key={img.id} className={cn("overflow-hidden rounded-2xl border-2 bg-card", img.is_primary ? "border-primary" : "border-border")}>
              <img src={resolveImageUrl(img.image_url) ?? ""} alt={img.alt_text ?? productName} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between p-1.5">
                {img.is_primary ? (
                  <span className="px-2 text-xs font-semibold text-primary">Utama</span>
                ) : (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setPrimary.mutate(img)}><Star /> Utama</Button>
                )}
                <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setToDelete(img)} aria-label="Hapus gambar"><Trash2 /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title="Hapus gambar ini?" description="Gambar akan dilepas dari produk." onConfirm={() => toDelete && remove.mutate(toDelete)} loading={remove.isPending} />
    </div>
  );
}
