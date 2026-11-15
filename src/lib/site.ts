import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  store_name: string;
  tagline: string | null;
  whatsapp_number: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  operating_hours: string | null;
  instagram: string | null;
  maps_url: string | null;
};

/** Ubah nomor WhatsApp apa pun (0812…, +62 812-…, 62812…) menjadi format wa.me: 62812… */
export function normalizeWhatsapp(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/** Tampilkan nomor 62812345678 sebagai +62 812-3456-78 agar mudah dibaca. */
export function formatWhatsappDisplay(input: string): string {
  const n = normalizeWhatsapp(input);
  if (!n) return "";
  const local = n.startsWith("62") ? n.slice(2) : n;
  const parts = [local.slice(0, 3), local.slice(3, 7), local.slice(7)].filter(Boolean);
  return `${n.startsWith("62") ? "+62 " : "+"}${parts.join("-")}`;
}

export function whatsappLink(number: string, text = "Halo KelapaKu, saya ingin bertanya.") {
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(text)}`;
}

/** Ubah "@kelapaku" atau URL Instagram menjadi URL profil lengkap. */
export function instagramLink(value: string) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  return `https://instagram.com/${v.replace(/^@/, "")}`;
}

export const storeSettingsQuery = () =>
  queryOptions({
    queryKey: ["store_settings"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("store_name, tagline, whatsapp_number, phone, email, address, operating_hours, instagram, maps_url")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data as StoreSettings | null;
    },
  });

export function useStoreSettings() {
  return useQuery(storeSettingsQuery());
}
