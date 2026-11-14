import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { AccountHeader } from "@/components/account/AccountNav";
import { AddressFormDialog } from "@/components/account/AddressFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { addressesQuery, formatAddress, saveAddress, type Address } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil Saya — KelapaKu" },
      { name: "description", content: "Kelola profil dan alamat pengiriman Anda di KelapaKu." },
      { property: "og:title", content: "Profil Saya — KelapaKu" },
      { property: "og:description", content: "Kelola profil dan alamat pengiriman." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().trim().regex(/^$|^(\+62|62|0)[0-9]{8,13}$/, "Nomor telepon tidak valid (contoh: 081234567890)"),
});

function ProfilePage() {
  const { user, loading } = useAuth();
  return (
    <SiteLayout>
      <AccountHeader title="Profil Saya" subtitle="Kelola data diri dan alamat pengiriman Anda." />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_1.4fr]">
        {loading || !user ? <LoadingState /> : <ProfileCard userId={user.id} />}
        {user && <AddressList userId={user.id} />}
      </div>
    </SiteLayout>
  );
}

function ProfileCard({ userId }: { userId: string }) {
  const { profile, user, isWholesale } = useAuth();
  const qc = useQueryClient();
  const [values, setValues] = useState({ full_name: "", phone: "" });
  const [errors, setErrors] = useState<{ full_name?: string | undefined; phone?: string | undefined }>({});

  useEffect(() => {
    setValues({ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" });
  }, [profile?.full_name, profile?.phone]);

  const mutation = useMutation({
    mutationFn: async (v: { full_name: string; phone: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: v.full_name, phone: v.phone || null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Profil berhasil disimpan");
    },
    onError: (e: Error) => toast.error("Gagal menyimpan profil", { description: e.message }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ full_name: f.full_name?.[0], phone: f.phone?.[0] });
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <section className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Data diri</h2>
          <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
        </div>
        <StatusBadge label={isWholesale ? "Pelanggan Grosir" : "Pelanggan Eceran"} tone={isWholesale ? "success" : "info"} />
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="full_name">Nama lengkap</Label>
          <Input id="full_name" value={values.full_name} onChange={(e) => setValues((v) => ({ ...v, full_name: e.target.value }))} className="rounded-xl" />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile?.email || user?.email || ""} disabled className="rounded-xl" />
          <p className="text-xs text-muted-foreground">Email digunakan untuk masuk dan tidak dapat diubah di sini.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor telepon</Label>
          <Input id="phone" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} placeholder="081234567890" className="rounded-xl" />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" />} Simpan perubahan
        </Button>
      </form>
    </section>
  );
}

function AddressList({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(addressesQuery(userId));
  const [editing, setEditing] = useState<Address | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Address | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Alamat dihapus");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error("Gagal menghapus alamat", { description: e.message }),
  });

  const makeDefault = useMutation({
    mutationFn: (a: Address) => {
      const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = a;
      return saveAddress(userId, { ...rest, is_default: true }, a.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Alamat utama diperbarui");
    },
    onError: (e: Error) => toast.error("Gagal memperbarui alamat", { description: e.message }),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alamat pengiriman</h2>
        <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus /> Tambah alamat
        </Button>
      </div>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Alamat tidak dapat dimuat." onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState icon={MapPin} title="Belum ada alamat" description="Tambahkan alamat untuk mempermudah checkout." />
      ) : (
        <ul className="space-y-3">
          {data.map((a) => (
            <li key={a.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {a.recipient_name}
                    {a.is_default && <StatusBadge label="Utama" tone="success" />}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.phone}</p>
                  <p className="mt-2 text-sm">{formatAddress(a)}</p>
                  {a.notes && <p className="mt-1 text-xs text-muted-foreground">Catatan: {a.notes}</p>}
                </div>
                <div className="flex gap-1">
                  {!a.is_default && (
                    <Button variant="ghost" size="icon" onClick={() => makeDefault.mutate(a)} aria-label="Jadikan utama" title="Jadikan utama">
                      <Star />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setFormOpen(true); }} aria-label="Ubah alamat">
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setToDelete(a)} aria-label="Hapus alamat">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddressFormDialog open={formOpen} onOpenChange={setFormOpen} userId={userId} address={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Hapus alamat ini?"
        description="Alamat akan dihapus permanen. Pesanan lama tetap menyimpan salinan alamatnya."
        onConfirm={() => toDelete && del.mutate(toDelete.id)}
        loading={del.isPending}
      />
    </section>
  );
}
