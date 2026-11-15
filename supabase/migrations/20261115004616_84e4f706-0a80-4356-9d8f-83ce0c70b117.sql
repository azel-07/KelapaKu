CREATE TABLE public.store_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'KelapaKu',
  tagline text,
  whatsapp_number text NOT NULL DEFAULT '',
  phone text,
  email text,
  address text,
  operating_hours text,
  instagram text,
  maps_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store settings public read" ON public.store_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "store settings admin update" ON public.store_settings
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER store_settings_set_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.store_settings (id, store_name, tagline, whatsapp_number, phone, email, address, operating_hours)
VALUES (1, 'KelapaKu', 'Produk kelapa segar & olahan, eceran maupun grosir.', '6281200000000', '+62 812-0000-0000', 'halo@kelapaku.id', 'Indonesia', 'Senin – Sabtu, 08.00 – 17.00 WIB')
ON CONFLICT (id) DO NOTHING;