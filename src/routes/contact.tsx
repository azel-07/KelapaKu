import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states/ErrorState";
import { formatWhatsappDisplay, instagramLink, useStoreSettings, whatsappLink } from "@/lib/site";

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

type Item = { icon: typeof Phone; label: string; value: string; href?: string };

function ContactPage() {
  const { data: s, isLoading, isError, refetch } = useStoreSettings();

  const items: Item[] = [];
  if (s?.whatsapp_number) items.push({ icon: MessageCircle, label: "WhatsApp", value: formatWhatsappDisplay(s.whatsapp_number), href: whatsappLink(s.whatsapp_number) });
  if (s?.phone) items.push({ icon: Phone, label: "Telepon", value: s.phone, href: `tel:${s.phone.replace(/[^\d+]/g, "")}` });
  if (s?.email) items.push({ icon: Mail, label: "Email", value: s.email, href: `mailto:${s.email}` });
  if (s?.instagram) items.push({ icon: Instagram, label: "Instagram", value: s.instagram, href: instagramLink(s.instagram) });
  if (s?.address) {
  items.push({
    icon: MapPin,
    label: "Alamat",
    value: s.address,
    ...(s.maps_url ? { href: s.maps_url } : {}),
  });
}
  if (s?.operating_hours) items.push({ icon: Clock, label: "Jam operasional", value: s.operating_hours });

  return (
    <SiteLayout>
      <section className="bg-leaf-soft">
        <div className="container-page py-16">
          <span className="eyebrow">Kontak</span>
          <h1 className="mt-2 text-4xl font-bold text-primary">Ada yang bisa kami bantu?</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Tim {s?.store_name || "KelapaKu"} siap membantu pertanyaan seputar produk, pesanan, dan kerja sama pembelian grosir.
          </p>
        </div>
      </section>
      <section className="container-page grid gap-8 py-14 lg:grid-cols-[1.2fr_1fr]">
        {isError ? (
          <ErrorState message="Informasi kontak tidak dapat dimuat." onRetry={() => refetch()} />
        ) : (
          <div className="grid content-start gap-4 sm:grid-cols-2">
            {isLoading
              ? [0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-muted" aria-hidden />)
              : items.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-earth">{label}</p>
                    {href ? (
                      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-1 block whitespace-pre-line break-words font-medium hover:text-primary">{value}</a>
                    ) : (
                      <p className="mt-1 whitespace-pre-line break-words font-medium">{value}</p>
                    )}
                  </div>
                ))}
          </div>
        )}
        <div className="flex flex-col justify-center rounded-[2rem] bg-forest p-8 text-primary-foreground">
          <MessageCircle className="size-8 text-leaf" />
          <h2 className="mt-4 text-2xl font-bold">Butuh pasokan rutin untuk usaha?</h2>
          <p className="mt-2 text-primary-foreground/80">
            Ceritakan kebutuhan Anda, kami bantu siapkan penawaran harga grosir terbaik.
          </p>
          {s?.whatsapp_number && (
            <Button variant="leaf" size="lg" className="mt-6 self-start" asChild>
              <a href={whatsappLink(s.whatsapp_number, `Halo ${s.store_name}, saya ingin bertanya tentang pembelian grosir.`)} target="_blank" rel="noreferrer">
                Chat via WhatsApp
              </a>
            </Button>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
