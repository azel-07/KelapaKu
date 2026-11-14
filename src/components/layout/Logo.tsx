import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="KelapaKu beranda">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full transition-transform group-hover:rotate-12",
          inverted ? "bg-leaf text-leaf-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="13.5" r="7" />
          <path d="M12 6.5c0-2 1.5-3.5 3.5-3.5" />
          <circle cx="9.5" cy="11.5" r="0.9" fill="currentColor" />
          <circle cx="12" cy="10" r="0.9" fill="currentColor" />
          <circle cx="14.5" cy="11.5" r="0.9" fill="currentColor" />
        </svg>
      </span>
      <span className={cn("text-xl font-semibold tracking-tight", inverted ? "text-primary-foreground" : "text-primary")}>
        Kelapa<span className={inverted ? "text-leaf" : "text-earth"}>Ku</span>
      </span>
    </Link>
  );
}
