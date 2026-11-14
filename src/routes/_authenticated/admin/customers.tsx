import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect, SearchInput } from "@/components/admin/AdminToolbar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LoadingState } from "@/components/states/LoadingState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatAddress } from "@/lib/account";
import { formatDate, formatRupiah } from "@/lib/format";
import { dbErrorMessage } from "@/lib/db-error";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({
    meta: [
      { title: "Manajemen Pelanggan — Admin KelapaKu" },
      { name: "description", content: "Daftar pelanggan KelapaKu." },
      { property: "og:title", content: "Manajemen Pelanggan — Admin KelapaKu" },
      { property: "og:description", content: "Daftar pelanggan KelapaKu." },
    ],
  }),
  component: AdminCustomers,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  account_type: string;
  account_active: boolean;
  created_at: string;
};

const ROLE_LABEL: Record<string, string> = { customer: "Customer", admin: "Admin" };
const TYPE_LABEL: Record<string, string> = { retail: "Eceran", wholesale: "Grosir" };

function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState<Profile | null>(null);

  const profiles = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email, phone, role, account_type, account_active, created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (profiles.data ?? []).filter(
      (p) =>
        (!q || (p.full_name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q) || (p.phone ?? "").includes(q)) &&
        (type === "all" || p.account_type === type || p.role === type),
    );
  }, [profiles.data, search, type]);

  const columns: Column<Profile>[] = [
    { header: "Nama", cell: (p) => <span className="font-medium">{p.full_name || "-"}</span> },
    { header: "Email", cell: (p) => p.email || "-" },
    { header: "Telepon", cell: (p) => p.phone || "-" },
    { header: "Role", cell: (p) => <StatusBadge label={ROLE_LABEL[p.role] ?? p.role} tone={p.role === "admin" ? "success" : "neutral"} /> },
    { header: "Tipe akun", cell: (p) => <StatusBadge label={TYPE_LABEL[p.account_type] ?? p.account_type} tone={p.account_type === "wholesale" ? "info" : "neutral"} /> },
    { header: "Status", cell: (p) => <StatusBadge label={p.account_active ? "Aktif" : "Nonaktif"} tone={p.account_active ? "success" : "danger"} /> },
  ];

  return (
    <div>
      <AdminPageHeader title="Pelanggan" description="Klik baris untuk melihat detail profil pelanggan." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, email, atau telepon…" />
        <FilterSelect value={type} onChange={setType} allLabel="Semua pengguna" options={[{ value: "retail", label: "Eceran" }, { value: "wholesale", label: "Grosir" }, { value: "admin", label: "Admin" }]} />
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} loading={profiles.isLoading} error={profiles.isError} onRetry={() => profiles.refetch()} emptyTitle="Belum ada pelanggan" onRowClick={setSelected} />
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{selected && <CustomerDetail profile={selected} />}</SheetContent>
      </Sheet>
    </div>
  );
}

function CustomerDetail({ profile }: { profile: Profile }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isSelf = user?.id === profile.id;
  const [role, setRole] = useState(profile.role);
  const [accountType, setAccountType] = useState(profile.account_type);
  const [active, setActive] = useState(profile.account_active);
  const [confirm, setConfirm] = useState(false);

  const detail = useQuery({
    queryKey: ["admin", "customer", profile.id],
    queryFn: async () => {
      const [addresses, orders] = await Promise.all([
        supabase.from("addresses").select("*").eq("user_id", profile.id),
        supabase.from("orders").select("id, order_number, total_amount, created_at").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (addresses.error) throw addresses.error;
      if (orders.error) throw orders.error;
      return { addresses: addresses.data, orders: orders.data };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const update: { account_type: string; role?: string; account_active?: boolean } = { account_type: accountType };
      if (!isSelf) {
        update.role = role;
        update.account_active = active;
      }
      const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
      toast.success("Profil pelanggan diperbarui");
      setConfirm(false);
    },
    onError: (e) => toast.error("Gagal memperbarui", { description: dbErrorMessage(e) }),
  });

  const changed = role !== profile.role || accountType !== profile.account_type || active !== profile.account_active;

  return (
    <div className="space-y-6">
      <SheetHeader className="p-0">
        <SheetTitle>{profile.full_name || "Tanpa nama"}</SheetTitle>
        <p className="text-sm text-muted-foreground">{profile.email} · {profile.phone || "tanpa telepon"}</p>
        <p className="text-xs text-muted-foreground">Terdaftar {formatDate(profile.created_at)}</p>
      </SheetHeader>

      <section className="space-y-4 rounded-2xl border border-border p-4">
        <h3 className="text-sm font-semibold">Pengaturan akun</h3>
        <div className="space-y-1.5">
          <Label>Tipe akun</Label>
          <Select value={accountType} onValueChange={setAccountType}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="retail">Eceran</SelectItem><SelectItem value="wholesale">Grosir</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole} disabled={isSelf}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="customer">Customer</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
          </Select>
          {isSelf && <p className="text-xs text-muted-foreground">Anda tidak dapat mengubah role atau status akun Anda sendiri.</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={active} onCheckedChange={setActive} disabled={isSelf} /> Akun aktif
        </label>
        <Button className="w-full" disabled={!changed || save.isPending} onClick={() => setConfirm(true)}>Simpan pengaturan</Button>
      </section>

      {detail.isLoading ? <LoadingState /> : detail.data && (
        <>
          <section>
            <h3 className="mb-2 text-sm font-semibold">Alamat ({detail.data.addresses.length})</h3>
            {detail.data.addresses.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada alamat.</p> : (
              <ul className="space-y-2 text-sm">
                {detail.data.addresses.map((a) => (
                  <li key={a.id} className="rounded-xl bg-secondary/50 p-3">
                    <p className="font-medium">{a.recipient_name} · {a.phone} {a.is_default && <StatusBadge label="Utama" tone="success" className="ml-1" />}</p>
                    <p className="text-muted-foreground">{formatAddress(a)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold">Pesanan terakhir</h3>
            {detail.data.orders.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pesanan.</p> : (
              <ul className="divide-y divide-border text-sm">
                {detail.data.orders.map((o) => (
                  <li key={o.id} className="flex justify-between py-2"><span>{o.order_number}</span><span className="font-medium">{formatRupiah(o.total_amount)}</span></li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive={role === "admin" && profile.role !== "admin"}
        title="Simpan perubahan akun?"
        description={role !== profile.role ? `Role akan diubah menjadi ${ROLE_LABEL[role]}. ${role === "admin" ? "Pengguna ini akan mendapat akses penuh ke panel admin." : ""}` : "Perubahan tipe/status akun akan langsung berlaku."}
        confirmLabel="Ya, simpan"
        onConfirm={() => save.mutate()}
        loading={save.isPending}
      />
    </div>
  );
}
