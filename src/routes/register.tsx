import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar Akun — KelapaKu" },
      { name: "description", content: "Buat akun KelapaKu untuk belanja produk kelapa eceran maupun grosir." },
      { property: "og:title", content: "Daftar Akun — KelapaKu" },
      { property: "og:description", content: "Buat akun KelapaKu gratis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(100, "Nama terlalu panjang"),
    email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
    password: z.string().min(8, "Password minimal 8 karakter").max(72, "Password maksimal 72 karakter"),
    confirm: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.password === d.confirm, { message: "Konfirmasi password tidak sama", path: ["confirm"] });

type Field = "fullName" | "email" | "password" | "confirm";

function RegisterPage() {
  const [values, setValues] = useState<Record<Field, string>>({ fullName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<Field | "form", string>>>({});
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ fullName: f.fullName?.[0], email: f.email?.[0], password: f.password?.[0], confirm: f.confirm?.[0] });
      return;
    }
    setErrors({});
    setLoading(true);
    // Role tidak dikirim dari form: profil dibuat oleh trigger database dengan role default "customer".
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      setErrors({
        form: /already registered/i.test(error.message) ? "Email sudah terdaftar. Silakan masuk." : `Pendaftaran gagal: ${error.message}`,
      });
      return;
    }
    if (data.session) {
      toast.success("Akun berhasil dibuat. Selamat berbelanja!");
      window.location.assign("/products");
      return;
    }
    setSentTo(parsed.data.email);
  };

  if (sentTo) {
    return (
      <AuthShell title="Cek email Anda" subtitle="Satu langkah lagi untuk mengaktifkan akun.">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary"><MailCheck className="size-6" /></span>
          <p className="mt-4 text-sm text-muted-foreground">
            Kami telah mengirim tautan konfirmasi ke <span className="font-semibold text-foreground">{sentTo}</span>. Klik tautan tersebut lalu masuk ke akun Anda.
          </p>
          <Button className="mt-6 w-full" asChild><Link to="/login">Ke halaman masuk</Link></Button>
        </div>
      </AuthShell>
    );
  }

  const fields: { key: Field; label: string; type: string; auto: string }[] = [
    { key: "fullName", label: "Nama lengkap", type: "text", auto: "name" },
    { key: "email", label: "Email", type: "email", auto: "email" },
    { key: "password", label: "Password", type: "password", auto: "new-password" },
    { key: "confirm", label: "Konfirmasi password", type: "password", auto: "new-password" },
  ];

  return (
    <AuthShell title="Buat akun KelapaKu" subtitle="Daftar gratis untuk mulai berbelanja.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {errors.form && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{errors.form}</div>
        )}
        {fields.map((f) => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label}</Label>
            <Input id={f.key} type={f.type} autoComplete={f.auto} value={values[f.key]} onChange={set(f.key)} className="h-11 rounded-xl" aria-invalid={!!errors[f.key]} />
            {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
          </div>
        ))}
        <Button type="submit" size="xl" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Daftar
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun? <Link to="/login" className="font-medium text-primary hover:underline">Masuk</Link>
        </p>
      </form>
    </AuthShell>
  );
}
