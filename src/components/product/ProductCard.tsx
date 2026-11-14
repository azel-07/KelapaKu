import { Link } from "@tanstack/react-router";
import { Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "./ProductImage";
import type { CatalogProduct } from "@/lib/catalog";
import { formatNumber, formatRupiah } from "@/lib/format";
import { primaryImage } from "@/lib/images";
import { useAddToCart } from "@/hooks/use-add-to-cart";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { addToCart, isPending } = useAddToCart();
  const stock = Number(product.stock_quantity);
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock <= 10;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="relative block aspect-square overflow-hidden bg-muted">
        <ProductImage
          src={primaryImage(product.product_images)}
          alt={product.name}
          className="size-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.label && (
            <span className="rounded-full bg-earth px-2.5 py-1 text-[11px] font-semibold text-earth-foreground">{product.label}</span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-foreground/80 px-2.5 py-1 text-[11px] font-semibold text-background">Stok habis</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          {product.categories && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-earth">{product.categories.name}</p>
          )}
          <h3 className="line-clamp-2 font-semibold leading-snug text-foreground">
            <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="mt-auto space-y-1">
          <p className="text-lg font-bold text-primary">
            {formatRupiah(product.retail_price)}
            <span className="text-xs font-normal text-muted-foreground"> / {product.unit}</span>
          </p>
          <p className={lowStock ? "text-xs font-medium text-earth" : "text-xs text-muted-foreground"}>
            Stok: {formatNumber(stock)} {product.unit}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/products/$slug" params={{ slug: product.slug }}>
              <Eye /> Detail
            </Link>
          </Button>
          <Button
            size="sm"
            disabled={outOfStock || isPending}
            onClick={() =>
              addToCart({
                productId: product.id,
                quantity: Number(product.min_retail_quantity) || 1,
                stock,
                productName: product.name,
              })
            }
            aria-label={`Tambah ${product.name} ke keranjang`}
          >
            <ShoppingCart /> Tambah
          </Button>
        </div>
      </div>
    </article>
  );
}
