import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Minus, Package, Plus, Snowflake, Sprout, ShoppingCart, Tag } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { ProductImage } from "@/components/product/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { priceTiersQuery, productDetailQuery } from "@/lib/catalog";
import { formatNumber, formatRupiah } from "@/lib/format";
import { resolveImageUrl } from "@/lib/images";
import { useAuth } from "@/lib/auth";
import { useAddToCart } from "@/hooks/use-add-to-cart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/$slug")({
  head: () => ({
    meta: [
      { title: "Detail Produk — KelapaKu" },
      { name: "description", content: "Detail produk kelapa, harga eceran, stok, dan harga grosir di KelapaKu." },
      { property: "og:title", content: "Detail Produk — KelapaKu" },
      { property: "og:description", content: "Lihat detail produk kelapa dan olahan kelapa di KelapaKu." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const { data: product, isLoading, isError, refetch } = useQuery(productDetailQuery(slug));

  return (
    <SiteLayout>
      <div className="container-page py-8 md:py-12">
        <Link to="/products" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="size-4" /> Kembali ke katalog
        </Link>
        {isLoading ? (
          <LoadingState label="Memuat detail produk…" />
        ) : isError ? (
          <ErrorState message="Detail produk tidak dapat dimuat." onRetry={() => refetch()} />
        ) : !product ? (
          <EmptyState
            title="Produk tidak ditemukan"
            description="Produk ini tidak tersedia atau sudah tidak aktif."
            action={
              <Button asChild>
                <Link to="/products">Lihat produk lain</Link>
              </Button>
            }
          />
        ) : (
          <ProductDetail product={product} />
        )}
      </div>
    </SiteLayout>
  );
}

type Detail = NonNullable<Awaited<ReturnType<NonNullable<ReturnType<typeof productDetailQuery>["queryFn"]>>>>;

function ProductDetail({ product }: { product: Detail }) {
  const { user, isWholesale, isAdmin } = useAuth();
  const { addToCart, isPending } = useAddToCart();
  const images = useMemo(
    () =>
      [...(product.product_images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
      ),
    [product.product_images],
  );
  const [active, setActive] = useState(0);
  const stock = Number(product.stock_quantity);
  const minQty = Math.max(Number(product.min_retail_quantity) || 1, 1);
  const [qty, setQty] = useState(minQty);
  const tiers = useQuery(priceTiersQuery(product.id, user?.id));

  useEffect(() => {
    document.title = `${product.name} — KelapaKu`;
  }, [product.name]);

  const qtyError =
    stock <= 0
      ? "Stok sedang habis."
      : !Number.isFinite(qty) || qty < minQty
        ? `Minimal pembelian ${formatNumber(minQty)} ${product.unit}.`
        : qty > stock
          ? `Jumlah melebihi stok (${formatNumber(stock)} ${product.unit}).`
          : null;

  const applicableTier = tiers.data?.find(
    (t) => qty >= Number(t.min_quantity) && (t.max_quantity == null || qty <= Number(t.max_quantity)),
  );
  const unitPrice = applicableTier ? Number(applicableTier.unit_price) : Number(product.retail_price);

  const details = [
    { icon: Package, label: "Kemasan", value: product.package_info },
    { icon: Snowflake, label: "Penyimpanan", value: product.storage_info },
    { icon: Sprout, label: "Kesegaran", value: product.freshness_info },
  ].filter((d) => d.value);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-[2rem] border border-border bg-muted">
          <ProductImage
            src={resolveImageUrl(images[active]?.image_url)}
            alt={images[active]?.alt_text || product.name}
            className="size-full"
            eager
          />
        </div>
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors",
                  i === active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
                aria-label={`Lihat gambar ${i + 1}`}
              >
                <ProductImage src={resolveImageUrl(img.image_url)} alt={img.alt_text || product.name} className="size-full" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          {product.categories && (
            <Link
              to="/products"
              search={{ kategori: product.categories.slug }}
              className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary"
            >
              {product.categories.name}
            </Link>
          )}
          {product.label && (
            <span className="rounded-full bg-earth px-3 py-1 text-xs font-semibold text-earth-foreground">{product.label}</span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{product.name}</h1>

        <div className="mt-5 flex items-end gap-2">
          <p className="text-3xl font-bold text-primary">{formatRupiah(product.retail_price)}</p>
          <p className="pb-1 text-sm text-muted-foreground">/ {product.unit} (harga eceran)</p>
        </div>
        <p className={cn("mt-2 text-sm", stock <= 0 ? "font-medium text-destructive" : "text-muted-foreground")}>
          {stock <= 0 ? "Stok habis" : `Stok tersedia: ${formatNumber(stock)} ${product.unit}`}
        </p>

        {product.description && (
          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{product.description}</p>
        )}

        {details.length > 0 && (
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-secondary p-4">
                <dt className="flex items-center gap-2 text-xs font-semibold text-earth">
                  <Icon className="size-4" /> {label}
                </dt>
                <dd className="mt-1 text-sm text-secondary-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <WholesaleBox
          loggedIn={!!user}
          canSee={isWholesale || isAdmin}
          tiers={tiers.data ?? []}
          loading={tiers.isLoading && !!user}
          unit={product.unit}
          activeTierId={applicableTier?.id}
        />

        <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <label htmlFor="qty" className="text-sm font-medium">Jumlah pembelian</label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-input bg-background">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(minQty, q - 1))} aria-label="Kurangi" disabled={qty <= minQty}>
                <Minus />
              </Button>
              <Input
                id="qty"
                type="number"
                inputMode="numeric"
                min={minQty}
                max={stock}
                value={Number.isFinite(qty) ? qty : ""}
                onChange={(e) => setQty(e.target.value === "" ? NaN : Number(e.target.value))}
                className="h-9 w-20 border-0 text-center shadow-none focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(stock, (Number.isFinite(q) ? q : 0) + 1))} aria-label="Tambah" disabled={qty >= stock}>
                <Plus />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">{product.unit}</span>
          </div>
          {qtyError ? (
            <p className="mt-2 text-sm text-destructive">{qtyError}</p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Estimasi: <span className="font-semibold text-foreground">{formatRupiah(unitPrice * qty)}</span>
              {applicableTier && <span className="ml-1 text-primary">(harga {applicableTier.tier_name})</span>}
            </p>
          )}
          <Button
            size="xl"
            className="mt-5 w-full"
            disabled={!!qtyError || isPending}
            onClick={() => addToCart({ productId: product.id, quantity: qty, stock, productName: product.name })}
          >
            <ShoppingCart /> Tambah ke Keranjang
          </Button>
        </div>
      </div>
    </div>
  );
}

function WholesaleBox({
  loggedIn,
  canSee,
  tiers,
  loading,
  unit,
  activeTierId,
}: {
  loggedIn: boolean;
  canSee: boolean;
  tiers: { id: string; tier_name: string; min_quantity: number; max_quantity: number | null; unit_price: number }[];
  loading: boolean;
  unit: string;
  activeTierId?: string;
}) {
  if (canSee && !loading && tiers.length === 0) return null;
  return (
    <div className="mt-6 rounded-3xl border border-leaf/60 bg-primary-soft/50 p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Tag className="size-4" /> Harga Grosir
      </p>
      {!canSee ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {loggedIn
            ? "Harga grosir hanya tampil untuk pelanggan grosir yang sudah disetujui."
            : "Masuk sebagai pelanggan grosir terverifikasi untuk melihat harga grosir."}{" "}
          {!loggedIn && (
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">Masuk</Link>
          )}
        </p>
      ) : loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Memuat harga grosir…</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {tiers.map((t) => (
            <li key={t.id} className={cn("flex items-center justify-between py-2 text-sm", t.id === activeTierId && "font-semibold text-primary")}>
              <span>
                {t.tier_name}: {formatNumber(t.min_quantity)}
                {t.max_quantity != null ? `–${formatNumber(t.max_quantity)}` : "+"} {unit}
              </span>
              <span>{formatRupiah(t.unit_price)} / {unit}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
