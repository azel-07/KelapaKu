import { Link } from "@tanstack/react-router";
import {
  ClipboardList,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Package,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export const ADMIN_NAV = [
  { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Produk", icon: Package },
  { to: "/admin/categories", label: "Kategori", icon: FolderTree },
  { to: "/admin/orders", label: "Pesanan", icon: ClipboardList },
  { to: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { to: "/admin/customers", label: "Pelanggan", icon: Users },
  { to: "/admin/wholesale", label: "Grosir", icon: Tags },
  { to: "/admin/quotations", label: "Penawaran", icon: ClipboardList },
] as const;

export function SidebarAdmin({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <Logo inverted />
        <p className="mt-1 pl-12 text-xs text-sidebar-foreground/60">Panel Admin</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {ADMIN_NAV.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: "exact" in rest }}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
          >
            <Icon className="size-4" /> {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent"
        >
          <Store className="size-4" /> Lihat toko
        </Link>
      </div>
    </div>
  );
}
