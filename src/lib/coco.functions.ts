import { createServerFn } from "@tanstack/react-start";
import { cocoInputSchema } from "./coco-prompt";

/** Kirim pesan pengunjung ke Coco; jawaban disusun dari data toko di Supabase. */
export const askCoco = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cocoInputSchema.parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const { generateResponse, GatewayError, PaymentRequiredError, RateLimitError } = await import("@lovable.dev/ai-gateway");
    const { trimHistory, buildStoreContext, COCO_INSTRUCTIONS } = await import("./coco-prompt");
    const { ORDER_STATUS, PAYMENT_STATUS } = await import("./status");
    type Db = import("@/integrations/supabase/types").Database;

    const history = trimHistory(data.messages);

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Konfigurasi toko belum lengkap.");

    const token = data.accessToken && data.accessToken.split(".").length === 3 ? data.accessToken : undefined;
    // Klien dengan RLS: anonim, atau sebagai pengunjung yang login (hanya melihat datanya sendiri).
    const supabase = createClient<Db>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          if (token) h.set("Authorization", `Bearer ${token}`);
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    let userId: string | null = null;
    if (token) {
      const { data: claims } = await supabase.auth.getClaims(token);
      userId = (claims?.claims?.sub as string | undefined) ?? null;
    }

    const [settingsRes, categoriesRes, productsRes] = await Promise.all([
      supabase
        .from("store_settings")
        .select("store_name, tagline, whatsapp_number, phone, email, address, operating_hours, instagram")
        .eq("id", 1)
        .maybeSingle(),
      supabase.from("categories").select("name, slug, description").eq("is_active", true).order("sort_order"),
      supabase
        .from("products")
        .select("name, slug, unit, retail_price, stock_quantity, min_retail_quantity, wholesale_min_quantity, label, description, categories(name)")
        .eq("is_active", true)
        .order("name")
        .limit(150),
    ]);
    if (productsRes.error) console.error("[coco] products", productsRes.error.message);

    let customer = null;
    if (userId) {
      const [profileRes, ordersRes, tiersRes] = await Promise.all([
        supabase.from("profiles").select("full_name, account_type").eq("id", userId).maybeSingle(),
        supabase
          .from("orders")
          .select("order_number, created_at, order_status, payment_status, total_amount, shipping_cost, order_items(product_name_snapshot, quantity, unit_snapshot)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("product_price_tiers")
          .select("tier_name, min_quantity, max_quantity, unit_price, products(name)")
          .eq("is_active", true)
          .order("min_quantity")
          .limit(100),
      ]);
      customer = {
        full_name: profileRes.data?.full_name ?? null,
        account_type: profileRes.data?.account_type ?? "retail",
        orders: (ordersRes.data ?? []).map((o) => ({
          order_number: o.order_number,
          created_at: o.created_at,
          order_status: o.order_status,
          payment_status: o.payment_status,
          total_amount: o.total_amount,
          shipping_cost: o.shipping_cost,
          items: (o.order_items ?? []).map((i) => ({ name: i.product_name_snapshot, quantity: i.quantity, unit: i.unit_snapshot })),
        })),
        tiers: (tiersRes.data ?? []).map((t) => ({
          product: t.products?.name ?? "-",
          tier_name: t.tier_name,
          min_quantity: t.min_quantity,
          max_quantity: t.max_quantity,
          unit_price: t.unit_price,
        })),
      };
    }

    const context = buildStoreContext(
      {
        settings: settingsRes.data ?? null,
        categories: categoriesRes.data ?? [],
        products: (productsRes.data ?? []).map((p) => ({ ...p, category: p.categories?.name ?? null })),
        customer,
      },
      {
        order: Object.fromEntries(Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label])),
        payment: Object.fromEntries(Object.entries(PAYMENT_STATUS).map(([k, v]) => [k, v.label])),
      },
    );

    try {
      const res = await generateResponse({
        model: "openai/gpt-6.1-sol",
        instructions: `${COCO_INSTRUCTIONS}\n\n# Data toko (diambil langsung dari database)\n${context}`,
        input: history.map((m) => ({ role: m.role, content: m.content })),
        reasoning: { effort: "low" },
        max_output_tokens: 1200,
      });
      const text = res.output
        .flatMap((item) => (item.type === "message" ? item.content : []))
        .map((c) => (c.type === "output_text" ? c.text : c.type === "refusal" ? c.refusal : ""))
        .join("")
        .trim();
      return { reply: text || "Maaf, saya belum bisa menjawab itu. Silakan hubungi toko lewat WhatsApp." };
    } catch (err) {
      if (err instanceof RateLimitError) return { error: "Coco sedang ramai. Coba lagi sebentar lagi." };
      if (err instanceof PaymentRequiredError) return { error: "Layanan Coco sedang tidak tersedia. Silakan hubungi toko lewat WhatsApp." };
      if (err instanceof GatewayError) {
        console.error("[coco] gateway", err.code, err.message, err.ids);
        return { error: "Coco gagal menjawab. Silakan coba lagi." };
      }
      throw err;
    }
  });
