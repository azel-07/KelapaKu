import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { FormCheckout } from "@/components/checkout/FormCheckout";
import { LoadingState } from "@/components/states/LoadingState";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — KelapaKu" },
      { name: "description", content: "Selesaikan pesanan produk kelapa Anda di KelapaKu." },
      { property: "og:title", content: "Checkout — KelapaKu" },
      { property: "og:description", content: "Checkout pesanan KelapaKu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { lines, subtotal, isLoading, isError, refetch } = useCart();
  return (
    <SiteLayout>
      <div className="bg-leaf-soft">
        <div className="container-page py-10">
          <h1 className="text-3xl font-bold text-primary">Checkout</h1>
          <p className="mt-1 text-muted-foreground">Pilih alamat dan periksa ringkasan pesanan Anda.</p>
        </div>
      </div>
      <div className="container-page py-10">
        {isLoading || !user ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message="Keranjang tidak dapat dimuat." onRetry={() => refetch()} />
        ) : lines.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="Keranjang kosong"
            description="Tambahkan produk ke keranjang sebelum checkout."
            action={<Button asChild><Link to="/products">Lihat produk</Link></Button>}
          />
        ) : (
          <FormCheckout userId={user.id} lines={lines} subtotal={subtotal} />
        )}
      </div>
    </SiteLayout>
  );
}
