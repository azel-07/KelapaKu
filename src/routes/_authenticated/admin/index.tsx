import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ClipboardList, FolderTree, Package, Users, Wallet } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/states/LoadingState";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatNumber, formatRupiah } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/status";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — KelapaKu" },
      { name: "description", content: "Ringkasan toko KelapaKu." },
      { property: "og:title", content: "Dashboard Admin — KelapaKu" },
      { property: "og:description", content: "Ringkasan toko KelapaKu." },
    ],
  }),
  component: AdminOverview,
});

const LOW_STOCK = 10;

async function fetchOverview() {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const [products, categories, orders, customers, paid, recent, low, chart] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("orders").select("total_amount").eq("payment_status", "confirmed"),
    supabase.from("orders").select("id, order_number, customer_name_snapshot, total_amount, order_status, payment_status, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("products").select("id, name, unit, stock_quantity, is_active").lte("stock_quantity", LOW_STOCK).order("stock_quantity").limit(6),
    supabase.from("orders").select("created_at, total_amount").eq("payment_status", "confirmed").gte("created_at", since.toISOString()),
  ]);
  for (const r of [products, categories, orders, customers, paid, recent, low, chart]) if (r.error) throw r.error;

  const days: { key: string; label: string; total: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    days.push({ key: d.toDateString(), label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), total: 0 });
  }
  for (const o of chart.data ?? []) {
    const day = days.find((d) => d.key === new Date(o.created_at).toDateString());
    if (day) day.total += Number(o.total_amount);
  }

  return {
    products: products.count ?? 0,
    categories: categories.count ?? 0,
    orders: orders.count ?? 0,
    customers: customers.count ?? 0,
    revenue: (paid.data ?? []).reduce((s, o) => s + Number(o.total_amount), 0),
    recent: recent.data ?? [],
    low: low.data ?? [],
    chart: days,
  };
}

function AdminOverview() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["admin", "overview"], queryFn: fetchOverview });

  if (isLoading) return <LoadingState label="Memuat ringkasan…" />;
  if (isError || !data) return <ErrorState message="Ringkasan tidak dapat dimuat." onRetry={() => refetch()} />;

  const stats = [
    { label: "Total produk", value: formatNumber(data.products), icon: Package },
    { label: "Total kategori", value: formatNumber(data.categories), icon: FolderTree },
    { label: "Total pesanan", value: formatNumber(data.orders), icon: ClipboardList },
    { label: "Total pelanggan", value: formatNumber(data.customers), icon: Users },
    { label: "Pendapatan (terbayar)", value: formatRupiah(data.revenue), icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Ringkasan" description="Gambaran aktivitas toko KelapaKu." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <div key={label} className={`rounded-3xl border border-border bg-card p-5 shadow-soft ${i === 4 ? "col-span-2 lg:col-span-1" : ""}`}>
            <span className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
            <p className="mt-4 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-semibold">Penjualan 30 hari terakhir</h2>
        <p className="text-xs text-muted-foreground">Total pesanan dengan pembayaran terverifikasi per hari.</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chart} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={4} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => (v >= 1000000 ? `${v / 1000000}jt` : v >= 1000 ? `${v / 1000}rb` : String(v))} tickLine={false} axisLine={false} width={48} />
              <Tooltip formatter={(v: number) => formatRupiah(v)} labelStyle={{ color: "var(--foreground)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)" }} />
              <Bar dataKey="total" name="Penjualan" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Pesanan terbaru</h2>
            <Link to="/admin/orders" className="text-sm text-primary hover:underline">Lihat semua</Link>
          </div>
          {data.recent.length === 0 ? (
            <EmptyState title="Belum ada pesanan" className="py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {data.recent.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_name_snapshot} · {formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge {...ORDER_STATUS[o.order_status]} />
                    <StatusBadge {...PAYMENT_STATUS[o.payment_status]} />
                    <span className="font-semibold">{formatRupiah(o.total_amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-earth" /> Stok rendah (≤ {LOW_STOCK})</h2>
            <Link to="/admin/products" className="text-sm text-primary hover:underline">Kelola</Link>
          </div>
          {data.low.length === 0 ? (
            <EmptyState title="Stok aman" className="py-8" />
          ) : (
            <ul className="divide-y divide-border">
              {data.low.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{p.name}{!p.is_active && <span className="ml-1 text-xs text-muted-foreground">(nonaktif)</span>}</span>
                  <StatusBadge label={`${formatNumber(p.stock_quantity)} ${p.unit}`} tone={Number(p.stock_quantity) <= 0 ? "danger" : "warning"} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
