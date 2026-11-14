/** Ubah error Supabase/Postgres menjadi pesan yang mudah dipahami. */
export function dbErrorMessage(err: unknown): string {
  const e = err as { code?: string; message?: string; details?: string } | null;
  if (!e) return "Terjadi kesalahan.";
  if (e.code === "23505") return "Data dengan nilai yang sama sudah ada (misalnya slug atau nama sudah dipakai).";
  if (e.code === "23503") return "Data ini masih dipakai oleh data lain sehingga tidak dapat dihapus.";
  if (e.code === "23514") return "Nilai yang dimasukkan tidak memenuhi aturan database (misalnya angka negatif).";
  if (e.code === "42501") return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
  return e.message || "Terjadi kesalahan.";
}
