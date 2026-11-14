import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { SITE, whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-forest text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/75">
            Platform produk kelapa segar dan olahan kelapa untuk kebutuhan rumah tangga, usaha kuliner, hingga
            pembelian grosir.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-leaf">Navigasi</h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/" className="hover:text-leaf">Beranda</Link></li>
            <li><Link to="/products" className="hover:text-leaf">Produk</Link></li>
            <li><Link to="/about" className="hover:text-leaf">Tentang Kami</Link></li>
            <li><Link to="/contact" className="hover:text-leaf">Kontak</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-leaf">Akun</h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/login" className="hover:text-leaf">Masuk</Link></li>
            <li><Link to="/register" className="hover:text-leaf">Daftar Akun</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-leaf">Kontak</h3>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li className="flex gap-3"><Phone className="size-4 shrink-0 text-leaf" />
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-leaf">{SITE.whatsappDisplay}</a>
            </li>
            <li className="flex gap-3"><Mail className="size-4 shrink-0 text-leaf" />
              <a href={`mailto:${SITE.email}`} className="hover:text-leaf">{SITE.email}</a>
            </li>
            <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-leaf" />{SITE.address}</li>
            <li className="flex gap-3"><Clock className="size-4 shrink-0 text-leaf" />{SITE.hours}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} KelapaKu. Seluruh hak cipta dilindungi.</p>
          <p>Segar dari kebun, untuk kebutuhan Anda.</p>
        </div>
      </div>
    </footer>
  );
}
