import type { ReactNode } from "react";
import { Logo } from "./Logo";
import heroImg from "@/assets/hero-kelapa.jpg";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-cream lg:block">
        <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-primary-foreground">
          <p className="text-3xl font-bold leading-tight">Kelapa segar & olahan,<br />eceran maupun grosir.</p>
          <p className="mt-3 text-primary-foreground/80">Belanja lebih mudah bersama KelapaKu.</p>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
