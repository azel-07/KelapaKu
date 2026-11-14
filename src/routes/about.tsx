import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Leaf, Recycle, Users } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Button } from "@/components/ui/button";
import kebunImg from "@/assets/kebun-kelapa.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Tentang Kami — KelapaKu" },
      { name: "description", content: "Kenali KelapaKu, platform produk kelapa segar dan olahan yang mendukung petani lokal." },
      { property: "og:title", content: "Tentang Kami — KelapaKu" },
      { property: "og:description", content: "Cerita dan nilai KelapaKu dalam menghadirkan produk kelapa berkualitas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Leaf, title: "Alami & segar", text: "Produk dipilih langsung dari kebun dengan proses yang menjaga kualitas alaminya." },
  { icon: Users, title: "Bersama petani", text: "Kami bekerja sama dengan petani kelapa lokal untuk rantai pasok yang adil." },
  { icon: Recycle, title: "Ramah lingkungan", text: "Seluruh bagian kelapa dimanfaatkan — dari santan hingga cocopeat dan cocochip." },
  { icon: HeartHandshake, title: "Pelayanan jujur", text: "Harga transparan dan setiap pembayaran diverifikasi sebelum pesanan diproses." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-rise">
          <span className="eyebrow">Tentang Kami</span>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-primary sm:text-5xl">
            Menghadirkan kebaikan kelapa dari kebun ke meja Anda
          </h1>
          <p className="mt-5 leading-relaxed text-foreground/75">
            KelapaKu adalah platform belanja produk kelapa dan olahan kelapa untuk rumah tangga, pelaku usaha
            kuliner, hingga kebutuhan pertanian. Kami melayani pembelian eceran maupun grosir dengan proses yang
            mudah dan aman.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link to="/products">Lihat Produk <ArrowRight /></Link>
          </Button>
        </div>
        <img src={kebunImg} alt="Kebun kelapa" width={1408} height={1008} className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-card" />
      </section>
      <section className="bg-secondary/60 py-20">
        <div className="container-page">
          <h2 className="text-3xl font-bold">Nilai yang kami pegang</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl bg-card p-6 shadow-soft">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
