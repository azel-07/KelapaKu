import { useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfile } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Masuk — KelapaKu" },
      { name: "description", content: "Masuk ke akun KelapaKu untuk berbelanja produk kelapa." },
      { property: "og:title", content: "Masuk — KelapaKu" },
      { property: "og:description", content: "Masuk ke akun KelapaKu Anda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().min(1, "Email wajib diisi").email("Format email tidak valid").max(255),
  password: z.string().min(1, "Password wajib diisi").max(72),
});

type Errors = Partial<Record<"email" | "password" | "form", string | undefined>>;

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { redirect: redirectTo } = Route.useSearch();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({ email: f.email?.[0], password: f.password?.[0] });
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      setLoading(false);
      const msg =
        error?.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error?.message === "Email not confirmed"
            ? "Email belum dikonfirmasi. Silakan cek kotak masuk Anda."
            : "Gagal masuk. Silakan coba lagi.";
      setErrors({ form: msg });
      return;
    }
    try {
      const profile = await fetchProfile(data.user.id);
      queryClient.setQueryData(["profile", data.user.id], profile);
      if (profile && !profile.account_active) {
        await supabase.auth.signOut();
        setErrors({ form: "Akun Anda sedang dinonaktifkan. Hubungi admin KelapaKu." });
        setLoading(false);
        return;
      }
      toast.success(`Selamat datang, ${profile?.full_name || "Pelanggan"}!`);
      // Kembali ke halaman yang diminta (hanya path internal), atau arahkan berdasarkan role di tabel profiles.
      const safe = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.startsWith("/login");
      if (safe && profile?.role !== "admin") {
        router.history.replace(redirectTo);
      } else if (profile?.role === "admin") {
        navigate({ to: "/", replace: true });
      } else {
        navigate({ to: "/my-orders", search: { pesanan: undefined }, replace: true });
      }
    } catch {
      setErrors({ form: "Profil pengguna tidak dapat dimuat." });
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Masuk ke akun Anda" subtitle="Belanja kelapa segar dan pantau pesanan Anda.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        {errors.form && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {errors.form}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" aria-invalid={!!errors.email} />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl pr-11" aria-invalid={!!errors.password} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={show ? "Sembunyikan password" : "Tampilkan password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <Button type="submit" size="xl" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Masuk
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Daftar sekarang</Link>
        </p>
      </form>
    </AuthShell>
  );
}
