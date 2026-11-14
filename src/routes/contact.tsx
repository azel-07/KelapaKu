import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Kontak — KelapaKu" },
      { name: "description", content: "Hubungi KelapaKu untuk pertanyaan produk, pesanan, dan kerja sama grosir." },
      { property: "og:title", content: "Kontak — KelapaKu" },
      { property: "og:description", content: "Hubungi tim KelapaKu melalui WhatsApp atau email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const items = [
    { icon: Phone, label: "WhatsApp", value: SITE.whatsappDisplay, href: whatsappLink() },
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: MapPin, label: "Alamat", value: SITE.address },
    { icon: Clock, label: "Jam operasional", value: SITE.hours },
  ];
  return (
    <SiteLayout>
      <section className="bg-leaf-soft">
        <div className="container-page py-16">
          <span className="eyebrow">Kontak</span>
          <h1 className="mt-2 text-4xl font-bold text-primary">Ada yang bisa kami bantu?</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Tim KelapaKu siap membantu pertanyaan seputar produk, pesanan, dan kerja sama pembelian grosir.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-8 py-14 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-earth">{label}</p>
              {href ? (
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-1 block font-medium hover:text-primary">{value}</a>
              ) : (
                <p className="mt-1 font-medium">{value}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-col justify-center rounded-[2rem] bg-forest p-8 text-primary-foreground">
          <MessageCircle className="size-8 text-leaf" />
          <h2 className="mt-4 text-2xl font-bold">Butuh pasokan rutin untuk usaha?</h2>
          <p className="mt-2 text-primary-foreground/80">
            Ceritakan kebutuhan Anda, kami bantu siapkan penawaran harga grosir terbaik.
          </p>
          <Button variant="leaf" size="lg" className="mt-6 self-start" asChild>
            <a href={whatsappLink("Halo KelapaKu, saya ingin bertanya tentang pembelian grosir.")} target="_blank" rel="noreferrer">
              Chat via WhatsApp
            </a>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
