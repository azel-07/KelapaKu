import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Package, ShoppingBag, ShoppingCart, User, UserRound, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/products", label: "Produk" },
  { to: "/about", label: "Tentang Kami" },
  { to: "/contact", label: "Kontak" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between gap-4 md:h-18">
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? (
            <div className="h-9 w-40 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <CartButton count={itemCount} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="cream" className="max-w-52">
                    <User /> <span className="truncate">{profile?.full_name || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                  <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><LayoutDashboard /> Dashboard Admin</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile"><UserRound /> Profil & Alamat</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-orders" search={{ pesanan: undefined }}><Package /> Pesanan Saya</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Masuk</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Daftar</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <CartButton count={itemCount} />}
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-primary hover:bg-primary-soft md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        </div>
      </nav>

      <div className={cn("border-t border-border/60 bg-background md:hidden", open ? "block" : "hidden")}>
        <div className="container-page flex flex-col gap-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted data-[status=active]:bg-primary-soft data-[status=active]:text-primary"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
              {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-primary hover:bg-muted">Dashboard Admin</Link>}
              <Link to="/profile" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted">Profil & Alamat</Link>
              <Link to="/my-orders" search={{ pesanan: undefined }} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-muted">Pesanan Saya</Link>
            </div>
          )}
          <div className="mt-3 flex gap-2 border-t border-border pt-4">
            {user ? (
              <Button variant="outline" className="flex-1" onClick={handleSignOut}>
                <LogOut /> Keluar
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Masuk</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link to="/register" onClick={() => setOpen(false)}>
                    <ShoppingBag /> Daftar
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function CartButton({ count }: { count: number }) {
  return (
    <Link
      to="/cart"
      className="relative grid size-10 place-items-center rounded-full text-primary transition-colors hover:bg-primary-soft"
      aria-label={`Keranjang (${count} produk)`}
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-earth px-1 text-[10px] font-bold text-earth-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
