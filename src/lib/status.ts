import type { Database } from "@/integrations/supabase/types";

type Enums = Database["public"]["Enums"];
export type OrderStatus = Enums["order_status"];
export type PaymentStatus = Enums["payment_status"];
export type PaymentMethod = Enums["payment_method"];
export type QuotationStatus = Enums["quotation_status"];
export type WholesaleStatus = Enums["wholesale_application_status"];

export type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "Menunggu Pembayaran", tone: "warning" },
  payment_confirmed: { label: "Pembayaran Dikonfirmasi", tone: "info" },
  processing: { label: "Diproses", tone: "info" },
  ready_to_ship: { label: "Siap Dikirim", tone: "info" },
  shipped: { label: "Dikirim", tone: "info" },
  completed: { label: "Selesai", tone: "success" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  unpaid: { label: "Belum Dibayar", tone: "warning" },
  pending_confirmation: { label: "Menunggu Verifikasi", tone: "info" },
  confirmed: { label: "Terverifikasi", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
  refunded: { label: "Dikembalikan", tone: "neutral" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  bank_transfer: "Transfer Bank",
  manual: "Manual",
  other: "Lainnya",
  qris_gopay: "QRIS",
};

export const QUOTATION_STATUS: Record<QuotationStatus, { label: string; tone: Tone }> = {
  waiting: { label: "Menunggu", tone: "warning" },
  processing: { label: "Diproses", tone: "info" },
  quote_sent: { label: "Penawaran Dikirim", tone: "info" },
  approved: { label: "Disetujui", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
};

export const WHOLESALE_STATUS: Record<WholesaleStatus, { label: string; tone: Tone }> = {
  pending: { label: "Menunggu", tone: "warning" },
  approved: { label: "Disetujui", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
  suspended: { label: "Ditangguhkan", tone: "neutral" },
};
