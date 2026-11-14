import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
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
  const { user, profile, signOut, loading } = useAuth();
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
              <span className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                <User className="size-4" />
                <span className="max-w-32 truncate">{profile?.full_name || user.email}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut /> Keluar
              </Button>
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

        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-primary hover:bg-primary-soft md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
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
