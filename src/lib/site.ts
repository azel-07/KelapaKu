// Informasi kontak toko. Ganti dengan data asli KelapaKu.
export const SITE = {
  name: "KelapaKu",
  tagline: "Produk kelapa segar & olahan, eceran maupun grosir.",
  whatsapp: "6281200000000",
  whatsappDisplay: "+62 812-0000-0000",
  email: "halo@kelapaku.id",
  address: "Indonesia",
  hours: "Senin – Sabtu, 08.00 – 17.00 WIB",
};

export const whatsappLink = (text = "Halo KelapaKu, saya ingin bertanya.") =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
