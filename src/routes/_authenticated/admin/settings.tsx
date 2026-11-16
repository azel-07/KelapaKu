import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { dbErrorMessage } from "@/lib/db-error";
import { formatWhatsappDisplay, normalizeWhatsapp, useStoreSettings, type StoreSettings } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Kontak Toko — Admin KelapaKu" },
      { name: "description", content: "Atur informasi kontak toko KelapaKu yang tampil di website." },
      { property: "og:title", content: "Kontak Toko — Admin KelapaKu" },
      { property: "og:description", content: "Atur informasi kontak toko KelapaKu." },
    ],
  }),
  component: AdminSettings,
});

const optionalText = (max: number) => z.string().trim().max(max);
const schema = z.object({
  store_name: z.string().trim().min(2, "Nama toko wajib diisi").max(80),
  tagline: optionalText(200),
  whatsapp_number: z
    .string()
    .trim()
    .refine((v) => /^62\d{8,13}$/.test(normalizeWhatsapp(v)), "Nomor WhatsApp tidak valid (contoh: 0812 3456 7890)"),
  phone: optionalText(30).refine((v) => !v || /^[\d+\-\s()]{6,30}$/.test(v), "Nomor telepon tidak valid"),
  email: optionalText(120).refine((v) => !v || z.string().email().safeParse(v).success, "Format email tidak valid"),
  address: optionalText(300),
  operating_hours: optionalText(120),
  instagram: optionalText(120),
  maps_url: optionalText(500).refine((v) => !v || /^https:\/\//i.test(v), "Link harus diawali https://"),
});

type Values = Record<keyof z.input<typeof schema>, string>;
const FIELDS: { key: keyof Values; label: string; placeholder?: string; hint?: string; multiline?: boolean }[] = [
  { key: "store_name", label: "Nama toko", placeholder: "KelapaKu" },
  { key: "tagline", label: "Deskripsi singkat (tampil di footer)", multiline: true },
  { key: "whatsapp_number", label: "Nomor WhatsApp", placeholder: "0812 3456 7890", hint: "Dipakai untuk semua tombol chat WhatsApp." },
  { key: "phone", label: "Nomor telepon (opsional)", placeholder: "(021) 123-4567" },
  { key: "email", label: "Email (opsional)", placeholder: "halo@kelapaku.id" },
  { key: "instagram", label: "Instagram (opsional)", placeholder: "@kelapaku" },
  { key: "address", label: "Alamat (opsional)", multiline: true },
  { key: "maps_url", label: "Link Google Maps (opsional)", placeholder: "https://maps.app.goo.gl/…" },
  { key: "operating_hours", label: "Jam operasional (opsional)", placeholder: "Senin – Sabtu, 08.00 – 17.00 WIB", multiline: true },
];

const toValues = (s?: StoreSettings | null): Values => ({
  store_name: s?.store_name ?? "KelapaKu",
  tagline: s?.tagline ?? "",
  whatsapp_number: s?.whatsapp_number ?? "",
  phone: s?.phone ?? "",
  email: s?.email ?? "",
  address: s?.address ?? "",
  operating_hours: s?.operating_hours ?? "",
  instagram: s?.instagram ?? "",
  maps_url: s?.maps_url ?? "",
});

function AdminSettings() {
  const qc = useQueryClient();
  const settings = useStoreSettings();
  const [values, setValues] = useState<Values>(toValues());
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});

  useEffect(() => {
    if (settings.data) setValues(toValues(settings.data));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async (v: z.output<typeof schema>) => {
      const payload = {
        store_name: v.store_name,
        whatsapp_number: normalizeWhatsapp(v.whatsapp_number),
        tagline: v.tagline || null,
        phone: v.phone || null,
        email: v.email || null,
        address: v.address || null,
        operating_hours: v.operating_hours || null,
        instagram: v.instagram || null,
        maps_url: v.maps_url || null,
      };
      const { data, error } = await supabase.from("store_settings").update(payload).eq("id", 1).select("id");
      if (error) throw error;
      if (!data?.length) throw { code: "42501" };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success("Kontak toko disimpan", { description: "Perubahan langsung tampil di website." });
    },
    onError: (e) => toast.error("Gagal menyimpan kontak toko", { description: dbErrorMessage(e) }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  if (settings.isLoading) return <LoadingState />;
  if (settings.isError) return <ErrorState message="Kontak toko tidak dapat dimuat." onRetry={() => settings.refetch()} />;

  const waPreview = formatWhatsappDisplay(values.whatsapp_number);

  return (
    <div>
      <AdminPageHeader title="Kontak Toko" description="Informasi ini tampil di footer dan halaman Kontak. Kolom opsional yang kosong tidak ditampilkan." />
      <form onSubmit={submit} className="grid max-w-3xl gap-5 rounded-3xl border border-border bg-card p-6 shadow-soft sm:grid-cols-2" noValidate>
        {FIELDS.map((f) => (
          <div key={f.key} className={f.multiline || f.key === "store_name" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
            <Label htmlFor={f.key}>{f.label}</Label>
            {f.multiline ? (
              <Textarea id={f.key} rows={2} value={values[f.key]} placeholder={f.placeholder} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            ) : (
              <Input id={f.key} value={values[f.key]} placeholder={f.placeholder} onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
            )}
            {errors[f.key] ? (
              <p className="text-xs text-destructive">{errors[f.key]}</p>
            ) : f.key === "whatsapp_number" && waPreview ? (
              <p className="text-xs text-muted-foreground">Tampil sebagai {waPreview}. {f.hint}</p>
            ) : f.hint ? (
              <p className="text-xs text-muted-foreground">{f.hint}</p>
            ) : null}
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />} Simpan perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
