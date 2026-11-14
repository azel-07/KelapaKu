import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SidebarAdmin } from "./SidebarAdmin";
import { useAuth } from "@/lib/auth";

export function AdminHeader() {
  const [open, setOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu admin">
          <Menu />
        </Button>
        <p className="text-sm text-muted-foreground">
          Halo, <span className="font-semibold text-foreground">{profile?.full_name || user?.email}</span>
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await signOut();
          navigate({ to: "/login", search: { redirect: undefined }, replace: true });
        }}
      >
        <LogOut /> Keluar
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Menu admin</SheetTitle>
          <SidebarAdmin onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function AdminPageHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
