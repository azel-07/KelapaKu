import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  HandCoins,
  Leaf,
  ShieldCheck,
  Sprout,
  Truck,
  Building2,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { categoriesQuery, featuredProductsQuery } from "@/lib/catalog";
import { categoryImage } from "@/lib/images";
import heroImg from "@/assets/hero-kelapa.jpg";
import kebunImg from "@/assets/kebun-kelapa.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KelapaKu — Solusi Produk Kelapa Berkualitas" },
      {
        name: "description",
        content:
          "Belanja produk kelapa segar dan olahan kelapa dengan harga terbaik, baik eceran maupun grosir, di KelapaKu.",
      },
      { property: "og:title", content: "KelapaKu — Solusi Produk Kelapa Berkualitas" },
      {
        property: "og:description",
        content: "Kelapa muda, kelapa tua, santan, kelapa parut, cocochip dan cocopeat. Eceran & grosir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Advantages />
      <Wholesale />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <img
        src={heroImg}
        alt="Kelapa muda, kelapa tua, santan dan kelapa parut"
        width={1600}
        height={1104}
        className="absolute inset-0 size-full object-cover object-right"
      />
      <div className="absolute inset-0 bg-hero" />
      <div className="container-page relative flex min-h-[560px] items-center py-16 md:min-h-[640px]">
        <div className="max-w-xl animate-rise">
          <span className="eyebrow">
            <Leaf className="size-3.5" /> Segar dari kebun Nusantara
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] text-primary sm:text-5xl lg:text-6xl">
            Solusi Produk Kelapa Berkualitas untuk Kebutuhan Anda
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-foreground/75 sm:text-lg">
            Belanja produk kelapa segar dan olahan kelapa dengan harga terbaik, baik eceran maupun grosir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="hero" size="xl" asChild>
              <Link to="/products">
                Belanja Sekarang <ArrowRight />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="bg-background/70" asChild>
              <a href="#grosir">Layanan Grosir</a>
            </Button>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-primary/15 pt-6">
            {[
              ["Eceran", "& grosir"],
              ["Segar", "setiap hari"],
              ["Aman", "bertransaksi"],
            ].map(([a, b]) => (
              <div key={a}>
                <dt className="text-lg font-bold text-primary">{a}</dt>
                <dd className="text-xs text-muted-foreground">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="max-w-2xl">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function Categories() {
  const { data, isLoading, isError, refetch } = useQuery(categoriesQuery());

  return (
    <section className="container-page py-20">
      <SectionHeading
        eyebrow="Kategori"
        title="Pilih sesuai kebutuhan Anda"
        subtitle="Dari kelapa segar untuk minuman hingga media tanam cocopeat."
      />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="Kategori tidak dapat dimuat." onRetry={() => refetch()} />
      ) : !data?.length ? (
        <EmptyState title="Belum ada kategori" description="Kategori produk akan tampil di sini." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {data.map((cat) => {
            const img = categoryImage(cat);
            return (
              <Link
                key={cat.id}
                to="/products"
                search={{ kategori: cat.slug }}
                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl bg-primary-soft shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
              >
                {img && (
                  <img src={img} alt={cat.name} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <h3 className="font-semibold leading-tight text-background">{cat.name}</h3>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-background/80 group-hover:text-leaf">
                    Lihat produk <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FeaturedProducts() {
  const { data, isLoading, isError, refetch } = useQuery(featuredProductsQuery());

  return (
    <section className="bg-secondary/60 py-20">
      <div className="container-page">
        <SectionHeading
          eyebrow="Produk Unggulan"
          title="Pilihan terbaik minggu ini"
          action={
            <Button variant="outline" asChild>
              <Link to="/products">
                Semua produk <ArrowRight />
              </Link>
            </Button>
          }
        />
        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : isError ? (
          <ErrorState message="Produk tidak dapat dimuat." onRetry={() => refetch()} />
        ) : !data?.length ? (
          <EmptyState
            title="Produk segera hadir"
            description="Kami sedang menyiapkan katalog. Silakan kembali lagi sebentar lagi."
          />
        ) : (
          <ProductGrid products={data} />
        )}
      </div>
    </section>
  );
}

const ADVANTAGES = [
  { icon: Sprout, title: "Segar dari kebun", text: "Dipanen dan dikirim dalam kondisi terbaik untuk menjaga kesegaran." },
  { icon: BadgeCheck, title: "Kualitas terkurasi", text: "Setiap produk diseleksi sesuai standar mutu KelapaKu." },
  { icon: HandCoins, title: "Harga bersaing", text: "Harga eceran yang jujur, harga grosir untuk mitra usaha." },
  { icon: ShieldCheck, title: "Transaksi aman", text: "Pembayaran diverifikasi admin sebelum pesanan diproses." },
];

function Advantages() {
  return (
    <section className="container-page py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <img
            src={kebunImg}
            alt="Petani kelapa memanen di kebun"
            width={1408}
            height={1008}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-card"
          />
          <div className="absolute -bottom-6 right-6 hidden rounded-2xl bg-card p-5 shadow-card sm:block">
            <p className="text-sm text-muted-foreground">Mendukung</p>
            <p className="text-lg font-bold text-primary">Petani kelapa lokal</p>
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Keunggulan KelapaKu" title="Kenapa belanja di KelapaKu?" />
          <div className="grid gap-5 sm:grid-cols-2">
            {ADVANTAGES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-5 transition-shadow hover:shadow-soft">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const WHOLESALE_STEPS = [
  { icon: Building2, title: "Daftar akun", text: "Buat akun lalu ajukan sebagai pelanggan grosir." },
  { icon: ClipboardList, title: "Verifikasi", text: "Tim kami meninjau data usaha Anda." },
  { icon: Boxes, title: "Harga grosir", text: "Nikmati harga bertingkat sesuai jumlah pembelian." },
  { icon: Truck, title: "Pengiriman rutin", text: "Atur jadwal pengiriman untuk kebutuhan usaha." },
];

function Wholesale() {
  return (
    <section id="grosir" className="container-page pb-24 pt-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-forest px-6 py-14 text-primary-foreground sm:px-12">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-leaf/15" aria-hidden />
        <div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-earth/20" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <span className="eyebrow text-leaf">Layanan Grosir</span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Mitra pasokan kelapa untuk usaha Anda</h2>
            <p className="mt-4 leading-relaxed text-primary-foreground/80">
              Restoran, katering, produsen minuman, hingga pertanian — dapatkan harga grosir dan permintaan
              penawaran khusus dalam jumlah besar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="leaf" size="lg" asChild>
                <Link to="/register">
                  Daftar Sekarang <ArrowRight />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                <Link to="/contact">Hubungi Kami</Link>
              </Button>
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {WHOLESALE_STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-2xl bg-leaf text-leaf-foreground">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-semibold text-leaf">Langkah {i + 1}</span>
                </div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-primary-foreground/70">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
