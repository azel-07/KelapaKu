import { Link } from "@tanstack/react-router";
import { Package, ShoppingCart, UserRound } from "lucide-react";

const ITEMS = [
  { to: "/profile", label: "Profil & Alamat", icon: UserRound },
  { to: "/cart", label: "Keranjang", icon: ShoppingCart },
  { to: "/my-orders", label: "Pesanan Saya", icon: Package },
] as const;

export function AccountNav() {
  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}

export function AccountHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-leaf-soft">
      <div className="container-page space-y-5 py-10">
        <div>
          <h1 className="text-3xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        <AccountNav />
      </div>
    </div>
  );
}
