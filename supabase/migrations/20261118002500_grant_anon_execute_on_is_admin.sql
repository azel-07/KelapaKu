-- Izinkan role anon untuk mengeksekusi public.is_admin()
-- Diperlukan karena kebijakan RLS pada tabel categories, products, product_images,
-- dan shipping_rates mengevaluasi is_admin() untuk pengunjung publik (anonim).
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
