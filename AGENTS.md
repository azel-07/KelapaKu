<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Public pages wrap content in `SiteLayout` (Navbar + Footer); admin pages will use their own layout. Why: admin needs a sidebar shell, storefront does not.
- Catalog reads go through query options in `src/lib/catalog.ts` using the browser Supabase client and public RLS. Why: one place for column names that match the existing schema.
- Auth/profile state comes from `AuthProvider` in `src/lib/auth.tsx`; role checks read `profiles.role`. Why: roles live in the existing profiles table.
- Image paths in `product_images.image_url` / `categories.image_url` may be full URLs or paths inside the `product-images` bucket; resolve via `resolveImageUrl`. Why: bucket already holds uploaded photos.
- Orders are created only via the `create_order_from_cart` database function (customer insert policies on orders/order_items were removed). Why: prices, stock decrement and duplicate prevention must be enforced server-side in one transaction.
- Wholesale price selection in `src/lib/pricing.ts` mirrors `create_order_from_cart`; change both together. Why: cart preview must match the final order total.
- Signed-in customer pages live under `src/routes/_authenticated/` (client-only gate redirecting to `/login?redirect=`). Why: the session is stored in the browser.
- Admin pages live under `src/routes/_authenticated/admin/`; the layout gate calls the `is_admin()` DB function and RLS admin policies protect every query. Why: admin access must be validated by the database, not by hidden buttons.
- Admin uploads go to `product-images/products/<productId>/…`; only files under that prefix are deleted with a product. Why: root-level bucket photos are shared.
