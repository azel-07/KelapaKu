import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { saveAddress, type Address } from "@/lib/account";

const schema = z.object({
  recipient_name: z.string().trim().min(2, "Nama penerima wajib diisi").max(100),
  phone: z.string().trim().regex(/^(\+62|62|0)[0-9]{8,13}$/, "Nomor telepon tidak valid (contoh: 081234567890)"),
  address_line: z.string().trim().min(5, "Alamat lengkap wajib diisi").max(300),
  district: z.string().trim().min(2, "Kecamatan wajib diisi").max(100),
  city_regency: z.string().trim().min(2, "Kota/Kabupaten wajib diisi").max(100),
  province: z.string().trim().min(2, "Provinsi wajib diisi").max(100),
  postal_code: z.string().trim().regex(/^$|^[0-9]{5}$/, "Kode pos harus 5 digit").max(5),
  notes: z.string().trim().max(300),
  is_default: z.boolean(),
});

type Values = z.infer<typeof schema>;
type Key = keyof Values;

const EMPTY: Values = {
  recipient_name: "",
  phone: "",
  address_line: "",
  district: "",
  city_regency: "",
  province: "",
  postal_code: "",
  notes: "",
  is_default: false,
};

const FIELDS: { key: Exclude<Key, "is_default" | "notes" | "address_line">; label: string; placeholder?: string }[] = [
  { key: "recipient_name", label: "Nama penerima" },
  { key: "phone", label: "Nomor telepon", placeholder: "081234567890" },
  { key: "district", label: "Kecamatan" },
  { key: "city_regency", label: "Kota / Kabupaten" },
  { key: "province", label: "Provinsi" },
  { key: "postal_code", label: "Kode pos", placeholder: "Opsional" },
];

export function AddressFormDialog({
  open,
  onOpenChange,
  userId,
  address,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  address?: Address | null;
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Key, string | undefined>>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      address
        ? {
            recipient_name: address.recipient_name,
            phone: address.phone,
            address_line: address.address_line,
            district: address.district,
            city_regency: address.city_regency,
            province: address.province,
            postal_code: address.postal_code ?? "",
            notes: address.notes ?? "",
            is_default: address.is_default,
          }
        : EMPTY,
    );
  }, [open, address]);

  const mutation = useMutation({
    mutationFn: (v: Values) =>
      saveAddress(
        userId,
        { ...v, postal_code: v.postal_code || null, notes: v.notes || null },
        address?.id,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success(address ? "Alamat diperbarui" : "Alamat ditambahkan");
      onOpenChange(false);
      onSaved?.();
    },
    onError: (e: Error) => toast.error("Gagal menyimpan alamat", { description: e.message }),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v?.[0]])));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{address ? "Ubah alamat" : "Tambah alamat baru"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="address_line">Alamat lengkap</Label>
            <Textarea id="address_line" value={values.address_line} onChange={set("address_line")} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan" rows={2} />
            {errors.address_line && <p className="text-xs text-destructive">{errors.address_line}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} value={values[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className="rounded-xl" />
                {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan untuk kurir</Label>
            <Input id="notes" value={values.notes} onChange={set("notes")} placeholder="Opsional, contoh: pagar hijau" className="rounded-xl" />
            {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={values.is_default} onCheckedChange={(c) => setValues((v) => ({ ...v, is_default: c === true }))} />
            Jadikan alamat utama
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />} Simpan alamat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
