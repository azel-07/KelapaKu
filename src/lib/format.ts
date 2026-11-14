const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatRupiah = (value: number | null | undefined) => rupiah.format(Number(value ?? 0));

export const formatNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value ?? 0));

export const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
