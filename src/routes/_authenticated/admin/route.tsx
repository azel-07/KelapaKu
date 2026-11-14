import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarAdmin } from "@/components/admin/SidebarAdmin";
import { AdminHeader } from "@/components/admin/AdminHeader";

// Role divalidasi di database (fungsi is_admin membaca profiles.role); RLS tetap menjaga setiap query.
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data, error } = await supabase.rpc("is_admin");
    if (error || data !== true) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen bg-muted/40 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarAdmin />
      </aside>
      <AdminHeader />
      <main className="p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
