import { useMemo, useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductGridSkeleton } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery, productsQuery } from "@/lib/catalog";
import { cn } from "@/lib/utils";

type SortKey = "terbaru" | "termurah" | "termahal";
type ProductSearch = { kategori?: string; q?: string; urut?: SortKey };

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): ProductSearch => ({
    kategori: typeof search.kategori === "string" && search.kategori ? search.kategori : undefined,
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    urut: search.urut === "termurah" || search.urut === "termahal" ? search.urut : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Katalog Produk Kelapa — KelapaKu" },
      { name: "description", content: "Jelajahi kelapa muda, kelapa tua, santan, kelapa parut, cocochip dan cocopeat di KelapaKu." },
      { property: "og:title", content: "Katalog Produk Kelapa — KelapaKu" },
      { property: "og:description", content: "Temukan produk kelapa segar dan olahan dengan harga eceran maupun grosir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });
  const [term, setTerm] = useState(search.q ?? "");
  const categories = useQuery(categoriesQuery());
  const products = useQuery(productsQuery());

  // Debounce pencarian ke URL.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((search.q ?? "") !== term.trim()) {
        navigate({ search: (prev) => ({ ...prev, q: term.trim() || undefined }), replace: true });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [term, search.q, navigate]);

  const filtered = useMemo(() => {
    let list = products.data ?? [];
    if (search.kategori) list = list.filter((p) => p.categories?.slug === search.kategori);
    if (search.q) {
      const q = search.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (search.urut === "termurah") list = [...list].sort((a, b) => a.retail_price - b.retail_price);
    if (search.urut === "termahal") list = [...list].sort((a, b) => b.retail_price - a.retail_price);
    return list;
  }, [products.data, search.kategori, search.q, search.urut]);

  const setCategory = (slug?: string) => navigate({ search: (prev) => ({ ...prev, kategori: slug }) });
  const activeCategory = categories.data?.find((c) => c.slug === search.kategori);
  const hasFilter = !!(search.kategori || search.q);

  return (
    <SiteLayout>
      <section className="bg-leaf-soft">
        <div className="container-page py-12 md:py-16">
          <span className="eyebrow">Katalog</span>
          <h1 className="mt-2 text-3xl font-bold text-primary sm:text-4xl">
            {activeCategory ? activeCategory.name : "Semua Produk"}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {activeCategory?.description || "Produk kelapa segar dan olahan pilihan untuk kebutuhan rumah tangga maupun usaha."}
          </p>
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Cari produk berdasarkan nama…"
              className="h-11 rounded-full bg-card pl-11"
              aria-label="Cari produk"
              maxLength={80}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <Select
              value={search.urut ?? "terbaru"}
              onValueChange={(v) =>
                navigate({ search: (prev) => ({ ...prev, urut: v === "terbaru" ? undefined : (v as SortKey) }) })
              }
            >
              <SelectTrigger className="h-11 w-48 rounded-full bg-card" aria-label="Urutkan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terbaru">Terbaru</SelectItem>
                <SelectItem value="termurah">Harga termurah</SelectItem>
                <SelectItem value="termahal">Harga termahal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1">
          <CategoryChip active={!search.kategori} onClick={() => setCategory(undefined)}>
            Semua
          </CategoryChip>
          {categories.data?.map((c) => (
            <CategoryChip key={c.id} active={search.kategori === c.slug} onClick={() => setCategory(c.slug)}>
              {c.name}
            </CategoryChip>
          ))}
        </div>

        {products.isLoading ? (
          <ProductGridSkeleton />
        ) : products.isError ? (
          <ErrorState message="Produk tidak dapat dimuat dari server." onRetry={() => products.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={hasFilter ? "Produk tidak ditemukan" : "Belum ada produk"}
            description={
              hasFilter
                ? "Coba kata kunci lain atau pilih kategori berbeda."
                : "Katalog sedang disiapkan. Silakan kembali lagi nanti."
            }
            action={
              hasFilter ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTerm("");
                    navigate({ search: {} });
                  }}
                >
                  <X /> Hapus filter
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filtered.length} produk ditemukan</p>
            <ProductGrid products={filtered} />
          </>
        )}
      </section>
    </SiteLayout>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}
