import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { SLUG_REGEX, slugify } from "@/lib/slug";
import { dbErrorMessage } from "@/lib/db-error";

export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

const schema = z.object({
  name: z.string().trim().min(2, "Nama kategori wajib diisi").max(100),
  slug: z.string().trim().regex(SLUG_REGEX, "Slug hanya huruf kecil, angka, dan tanda hubung").max(80),
  description: z.string().trim().max(1000),
  image_url: z.string().trim().max(500),
  sort_order: z.coerce.number().int("Urutan harus bilangan bulat").min(0, "Urutan minimal 0"),
  is_active: z.boolean(),
});

type Values = { name: string; slug: string; description: string; image_url: string; sort_order: string; is_active: boolean };

const toValues = (c?: CategoryRow | null): Values => ({
  name: c?.name ?? "",
  slug: c?.slug ?? "",
  description: c?.description ?? "",
  image_url: c?.image_url ?? "",
  sort_order: String(c?.sort_order ?? 0),
  is_active: c?.is_active ?? true,
});

export function FormCategory({ category, onDone }: { category?: CategoryRow | null; onDone: () => void }) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Values>(toValues(category));
  const [slugTouched, setSlugTouched] = useState(!!category);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string | undefined>>>({});

  useEffect(() => {
    setValues(toValues(category));
    setSlugTouched(!!category);
  }, [category]);

  const mutation = useMutation({
    mutationFn: async (v: z.output<typeof schema>) => {
      const payload = { ...v, description: v.description || null, image_url: v.image_url || null };
      const { error } = category
        ? await supabase.from("categories").update(payload).eq("id", category.id)
        : await supabase.from("categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(category ? "Kategori diperbarui" : "Kategori ditambahkan");
      onDone();
    },
    onError: (e) => toast.error("Gagal menyimpan kategori", { description: dbErrorMessage(e) }),
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

  const field = (k: Exclude<keyof Values, "is_active" | "description">, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`c-${k}`}>{label}</Label>
      <Input id={`c-${k}`} value={values[k]} onChange={set(k)} className="rounded-xl" {...props} />
      {errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Nama kategori")}
        {field("slug", "Slug URL")}
        {field("sort_order", "Urutan tampil", { type: "number", min: 0 })}
        {field("image_url", "Gambar (opsional)", { placeholder: "URL atau nama file di bucket" })}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-description">Deskripsi</Label>
        <Textarea id="c-description" value={values.description} onChange={set("description")} rows={3} />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm"><Switch checked={values.is_active} onCheckedChange={(c) => setValues((v) => ({ ...v, is_active: c }))} /> Aktif</label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>Batal</Button>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="animate-spin" />} Simpan</Button>
      </div>
    </form>
  );
}
