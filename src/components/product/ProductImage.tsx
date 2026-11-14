import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductImage({ src, alt, className, eager = false }: { src: string | null; alt: string; className?: string; eager?: boolean }) {
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-leaf-soft text-primary/40", className)}>
        <Leaf className="size-10" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className={cn("object-cover", className)} />;
}
