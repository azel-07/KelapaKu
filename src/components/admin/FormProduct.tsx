import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SLUG_REGEX, slugify } from "@/lib/slug";
import { dbErrorMessage } from "@/lib/db-error";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const num = (label: string, min = 0) =>
  z.coerce.number({ invalid_type_error: `${label} harus berupa angka` }).min(min, `${label} minimal ${min}`);

const schema = z.object({
  name: z.string().trim().min(2, "Nama produk wajib diisi").max(150),
  slug: z.string().trim().regex(SLUG_REGEX, "Slug hanya huruf kecil, angka, dan tanda hubung").max(80),
  category_id: z.string().uuid("Pilih kategori"),
  unit: z.string().trim().min(1, "Satuan wajib diisi").max(30),
  retail_price: num("Harga eceran"),
  stock_quantity: num("Stok"),
  min_retail_quantity: z.coerce.number().gt(0, "Minimal pembelian harus lebih dari 0"),
  wholesale_min_quantity: num("Minimal grosir"),
  description: z.string().trim().max(5000),
  package_info: z.string().trim().max(300),
  storage_info: z.string().trim().max(300),
  freshness_info: z.string().trim().max(300),
  label: z.string().trim().max(40),
  is_active: z.boolean(),
  is_featured: z.boolean(),
});

type Values = { [K in keyof z.input<typeof schema>]: K extends "is_active" | "is_featured" ? boolean : string };

const toValues = (p?: ProductRow | null): Values => ({
  name: p?.name ?? "",
  slug: p?.slug ?? "",
  category_id: p?.category_id ?? "",
  unit: p?.unit ?? "",
  retail_price: String(p?.retail_price ?? ""),
  stock_quantity: String(p?.stock_quantity ?? "0"),
  min_retail_quantity: String(p?.min_retail_quantity ?? "1"),
  wholesale_min_quantity: String(p?.wholesale_min_quantity ?? "0"),
  description: p?.description ?? "",
  package_info: p?.package_info ?? "",
  storage_info: p?.storage_info ?? "",
  freshness_info: p?.freshness_info ?? "",
  label: p?.label ?? "",
  is_active: p?.is_active ?? false,
  is_featured: p?.is_featured ?? false,
});

export function FormProduct({ product, onSaved, onCancel }: { product?: ProductRow | null; onSaved: (p: ProductRow) => void; onCancel: () => void }) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Values>(toValues(product));
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string | undefined>>>({});
  const categories = useQuery({
    queryKey: ["admin", "categories", "options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, is_active").order("sort_order").order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setValues(toValues(product));
    setSlugTouched(!!product);
  }, [product]);

  const mutation = useMutation({
    mutationFn: async (v: z.output<typeof schema>) => {
      const cat = categories.data?.find((c) => c.id === v.category_id);
      if (cat && !cat.is_active && cat.id !== product?.category_id) {
        throw new Error("Kategori yang dipilih sedang nonaktif. Silakan pilih kategori aktif.");
      }

      const payload = {
        ...v,
        description: v.description || null,
        package_info: v.package_info || null,
        storage_info: v.storage_info || null,
        freshness_info: v.freshness_info || null,
        label: v.label || null,
      };
      const q = product
        ? supabase.from("products").update(payload).eq("id", product.id).select().single()
        : supabase.from("products").insert(payload).select().single();
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? "Produk diperbarui" : "Produk ditambahkan");
      onSaved(p);
    },
    onError: (e) => toast.error("Gagal menyimpan produk", { description: dbErrorMessage(e) }),
  });

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [k]: val, ...(k === "name" && !slugTouched ? { slug: slugify(val) } : {}) }));
    if (k === "slug") setSlugTouched(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  const field = (k: keyof Values, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`p-${k}`}>{label}</Label>
      <Input id={`p-${k}`} value={values[k] as string} onChange={set(k)} className="rounded-xl" {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Nama produk")}
        {field("slug", "Slug URL", { placeholder: "kelapa-muda-hijau" })}
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={values.category_id} onValueChange={(v) => setValues((s) => ({ ...s, category_id: v }))}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={categories.isLoading ? "Memuat…" : "Pilih kategori"} /></SelectTrigger>
            <SelectContent>
              {categories.data?.map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.id}
                  disabled={!c.is_active && c.id !== values.category_id}
                >
                  {c.name}{!c.is_active ? " (nonaktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
        </div>
        {field("unit", "Satuan", { placeholder: "butir, kg, liter, pack" })}
        {field("retail_price", "Harga eceran (Rp)", { type: "number", min: 0, inputMode: "numeric" })}
        {field("stock_quantity", "Stok", { type: "number", min: 0, step: "any" })}
        {field("min_retail_quantity", "Minimal pembelian eceran", { type: "number", min: 0, step: "any" })}
        {field("wholesale_min_quantity", "Minimal pembelian grosir", { type: "number", min: 0, step: "any" })}
        {field("label", "Label (opsional)", { placeholder: "Terlaris, Baru" })}
        {field("package_info", "Info kemasan (opsional)")}
        {field("storage_info", "Info penyimpanan (opsional)")}
        {field("freshness_info", "Info kesegaran (opsional)")}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-description">Deskripsi</Label>
        <Textarea id="p-description" value={values.description} onChange={set("description")} rows={4} />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm"><Switch checked={values.is_active} onCheckedChange={(c) => setValues((v) => ({ ...v, is_active: c }))} /> Aktif (tampil di toko)</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={values.is_featured} onCheckedChange={(c) => setValues((v) => ({ ...v, is_featured: c }))} /> Produk unggulan</label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="animate-spin" />} Simpan produk</Button>
      </div>
    </form>
  );
}
