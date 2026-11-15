
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Store } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { storeSettingsQuery, type StoreSettings } from "@/lib/site";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan Toko — Admin KelapaKu" },
      { name: "description", content: "Kelola informasi toko KelapaKu." },
    ],
  }),
  component: AdminSettings,
});

type SettingsForm = {
  store_name: string;
  tagline: string;
  whatsapp_number: string;
  phone: string;
  email: string;
  address: string;
  operating_hours: string;
  instagram: string;
  maps_url: string;
};

const EMPTY_FORM: SettingsForm = {
  store_name: "",
  tagline: "",
  whatsapp_number: "",
  phone: "",
  email: "",
  address: "",
  operating_hours: "",
  instagram: "",
  maps_url: "",
};

const fields = [
  {
    name: "store_name",
    label: "Nama Toko",
    placeholder: "KelapaKu",
    required: true,
  },
  {
    name: "tagline",
    label: "Tagline",
    placeholder: "Segar dari kebun, untuk kebutuhan Anda",
  },
  {
    name: "whatsapp_number",
    label: "Nomor WhatsApp",
    placeholder: "+62 812 xxxx xxxx",
    required: true,
  },
  {
    name: "phone",
    label: "Nomor Telepon",
    placeholder: "+62 812 xxxx xxxx",
  },
  {
    name: "email",
    label: "Email Toko",
    placeholder: "email@contoh.com",
    type: "email",
  },
  {
    name: "instagram",
    label: "Instagram",
    placeholder: "@kelapaku",
  },
  {
    name: "maps_url",
    label: "Link Google Maps",
    placeholder: "https://maps.app.goo.gl/...",
    type: "url",
  },
] as const;

function AdminSettings() {
  const qc = useQueryClient();
  const queryOptions = storeSettingsQuery();
  const settings = useQuery(queryOptions);

  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM);

  useEffect(() => {
    if (!settings.data) return;

    setForm({
      store_name: settings.data.store_name ?? "",
      tagline: settings.data.tagline ?? "",
      whatsapp_number: settings.data.whatsapp_number ?? "",
      phone: settings.data.phone ?? "",
      email: settings.data.email ?? "",
      address: settings.data.address ?? "",
      operating_hours: settings.data.operating_hours ?? "",
      instagram: settings.data.instagram ?? "",
      maps_url: settings.data.maps_url ?? "",
    });
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .update({
          store_name: form.store_name.trim(),
          tagline: form.tagline.trim() || null,
          whatsapp_number: form.whatsapp_number.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          operating_hours: form.operating_hours.trim() || null,
          instagram: form.instagram.trim() || null,
          maps_url: form.maps_url.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select(
          "store_name, tagline, whatsapp_number, phone, email, address, operating_hours, instagram, maps_url"
        )
        .single();

      if (error) throw error;
      return data as StoreSettings;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryOptions.queryKey, data);
      qc.invalidateQueries({ queryKey: ["store_settings"] });
      toast.success("Pengaturan toko berhasil disimpan");
    },
    onError: (error) => {
      toast.error("Gagal menyimpan pengaturan", {
        description: dbErrorMessage(error),
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.store_name.trim() || !form.whatsapp_number.trim()) {
      toast.error("Nama toko dan nomor WhatsApp wajib diisi");
      return;
    }

    save.mutate();
  };

  const updateField = (name: keyof SettingsForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  if (settings.isLoading) {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          title="Kontak Toko"
          description="Kelola informasi toko KelapaKu."
        />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (settings.isError || !settings.data) {
    return (
      <div>
        <AdminPageHeader
          title="Kontak Toko"
          description="Kelola informasi toko KelapaKu."
        />
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="text-sm text-destructive">
            Pengaturan toko tidak dapat dimuat.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => settings.refetch()}>
            Coba lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Kontak Toko"
        description="Atur informasi dan kontak resmi yang ditampilkan di website KelapaKu."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 md:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">Informasi Toko</h2>
              <p className="text-sm text-muted-foreground">
                Identitas dan informasi dasar toko.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.name} className="block text-sm font-medium">
                {field.label}
                {"required" in field && field.required && (
                  <span className="text-destructive"> *</span>
                )}
                <input
                  type={"type" in field ? field.type : "text"}
                  className={inputClass}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  required={"required" in field && field.required}
                  onChange={(event) =>
                    updateField(field.name, event.target.value)
                  }
                />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium">
              Alamat Toko
              <textarea
                className={inputClass}
                rows={4}
                placeholder="Masukkan alamat lengkap toko"
                value={form.address}
                onChange={(event) =>
                  updateField("address", event.target.value)
                }
              />
            </label>

            <label className="block text-sm font-medium">
              Jam Operasional
              <textarea
                className={inputClass}
                rows={4}
                placeholder="Contoh: Senin – Sabtu, 08.00 – 17.00 WIB"
                value={form.operating_hours}
                onChange={(event) =>
                  updateField("operating_hours", event.target.value)
                }
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">Simpan pengaturan</p>
            <p className="text-sm text-muted-foreground">
              Perubahan akan ditampilkan pada halaman kontak dan footer website.
            </p>
          </div>

          <Button type="submit" disabled={save.isPending}>
            <Save className="mr-2 size-4" />
            {save.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
