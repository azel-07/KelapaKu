import { Link } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { formatWhatsappDisplay, instagramLink, useStoreSettings, whatsappLink } from "@/lib/site";

export function Footer() {
  const { data: s, isLoading } = useStoreSettings();
  const linkCls = "hover:text-leaf";
  return (
    <footer className="bg-forest text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/75">
            {s?.tagline ||
              "Platform produk kelapa segar dan olahan kelapa untuk kebutuhan rumah tangga, usaha kuliner, hingga pembelian grosir."}
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-leaf">Navigasi</h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/" className={linkCls}>Beranda</Link></li>
            <li><Link to="/products" className={linkCls}>Produk</Link></li>
            <li><Link to="/about" className={linkCls}>Tentang Kami</Link></li>
            <li><Link to="/contact" className={linkCls}>Kontak</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-leaf">Akun</h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/80">
            <li><Link to="/login" className={linkCls}>Masuk</Link></li>
            <li><Link to="/register" className={linkCls}>Daftar Akun</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-leaf">Kontak</h3>
          {isLoading ? (
            <div className="space-y-3" aria-hidden>
              {[0, 1, 2].map((i) => <div key={i} className="h-4 w-40 animate-pulse rounded-full bg-primary-foreground/10" />)}
            </div>
          ) : (
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              {s?.whatsapp_number && (
                <li className="flex gap-3"><MessageCircle className="size-4 shrink-0 text-leaf" />
                  <a href={whatsappLink(s.whatsapp_number)} target="_blank" rel="noreferrer" className={linkCls}>{formatWhatsappDisplay(s.whatsapp_number)}</a>
                </li>
              )}
              {s?.phone && (
                <li className="flex gap-3"><Phone className="size-4 shrink-0 text-leaf" />
                  <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className={linkCls}>{s.phone}</a>
                </li>
              )}
              {s?.email && (
                <li className="flex gap-3"><Mail className="size-4 shrink-0 text-leaf" />
                  <a href={`mailto:${s.email}`} className={linkCls}>{s.email}</a>
                </li>
              )}
              {s?.instagram && (
                <li className="flex gap-3"><Instagram className="size-4 shrink-0 text-leaf" />
                  <a href={instagramLink(s.instagram)} target="_blank" rel="noreferrer" className={linkCls}>{s.instagram}</a>
                </li>
              )}
              {s?.address && (
                <li className="flex gap-3"><MapPin className="size-4 shrink-0 text-leaf" />
                  {s.maps_url ? <a href={s.maps_url} target="_blank" rel="noreferrer" className={linkCls}>{s.address}</a> : s.address}
                </li>
              )}
              {s?.operating_hours && <li className="flex gap-3"><Clock className="size-4 shrink-0 text-leaf" /><span className="whitespace-pre-line">{s.operating_hours}</span></li>}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-primary-foreground/60 sm:flex-row">
          <p>© {new Date().getFullYear()} {s?.store_name || "KelapaKu"}. Seluruh hak cipta dilindungi.</p>
          <p>Segar dari kebun, untuk kebutuhan Anda.</p>
        </div>
      </div>
    </footer>
  );
}
