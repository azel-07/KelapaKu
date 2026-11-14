import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Input = { productId: string; quantity: number; stock: number; productName: string };

export function useAddToCart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ productId, quantity, stock }: Input) => {
      if (!user) throw new Error("AUTH");
      const { data: existing, error: readError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (readError) throw readError;
      const nextQty = Number(existing?.quantity ?? 0) + quantity;
      if (nextQty > stock) throw new Error("STOCK");
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: nextQty }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({ user_id: user.id, product_id: productId, quantity });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Ditambahkan ke keranjang", { description: v.productName });
    },
    onError: (err: Error) => {
      if (err.message === "STOCK") toast.error("Jumlah melebihi stok yang tersedia");
      else toast.error("Gagal menambahkan ke keranjang", { description: err.message });
    },
  });

  const addToCart = (input: Input) => {
    if (!user) {
      toast.info("Silakan masuk terlebih dahulu untuk berbelanja");
      navigate({ to: "/login" });
      return;
    }
    if (input.stock <= 0) {
      toast.error("Stok produk sedang habis");
      return;
    }
    mutation.mutate(input);
  };

  return { addToCart, isPending: mutation.isPending };
}
