import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function QuantityStepper({
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const n = Number(draft);
    if (!Number.isFinite(n) || n <= 0) return setDraft(String(value));
    const clamped = Math.min(Math.max(n, min), Math.max(max, min));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div className="inline-flex items-center rounded-full border border-input bg-background">
      <Button variant="ghost" size="icon" className="size-8" disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label="Kurangi jumlah">
        <Minus />
      </Button>
      <Input
        value={draft}
        inputMode="decimal"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        disabled={disabled}
        className="h-8 w-14 border-0 px-1 text-center shadow-none focus-visible:ring-0"
        aria-label="Jumlah"
      />
      <Button variant="ghost" size="icon" className="size-8" disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label="Tambah jumlah">
        <Plus />
      </Button>
    </div>
  );
}
