-- 1. Lock privileged profile columns
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / SQL editor
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'ID profil tidak dapat diubah';
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.account_type IS DISTINCT FROM OLD.account_type
     OR NEW.account_active IS DISTINCT FROM OLD.account_active THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Tidak diizinkan mengubah role, tipe akun, atau status akun';
    END IF;
    IF OLD.id = auth.uid() AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.account_active IS DISTINCT FROM OLD.account_active) THEN
      RAISE EXCEPTION 'Admin tidak dapat mengubah role atau status akunnya sendiri';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 2. Storage policies for product-images (admin manage)
CREATE POLICY "product-images admin read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product-images admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product-images admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product-images admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin());

-- 3. Secure checkout
CREATE OR REPLACE FUNCTION public.create_order_from_cart(p_address_id uuid, p_customer_note text DEFAULT NULL)
RETURNS public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_address public.addresses%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_item record;
  v_wholesale boolean;
  v_price numeric;
  v_price_type text;
  v_subtotal numeric := 0;
  v_count int := 0;
  v_note text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Silakan masuk terlebih dahulu';
  END IF;

  -- Serialize checkouts per user to prevent duplicate orders
  PERFORM pg_advisory_xact_lock(hashtext('checkout:' || v_uid::text));

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND OR NOT v_profile.account_active THEN
    RAISE EXCEPTION 'Akun tidak aktif';
  END IF;
  v_wholesale := v_profile.account_type = 'wholesale';

  SELECT * INTO v_address FROM public.addresses WHERE id = p_address_id AND user_id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alamat pengiriman tidak valid';
  END IF;

  v_note := NULLIF(btrim(COALESCE(p_customer_note, '')), '');
  IF v_note IS NOT NULL AND length(v_note) > 1000 THEN
    RAISE EXCEPTION 'Catatan pesanan maksimal 1000 karakter';
  END IF;

  -- Validate every cart line with locked product rows
  FOR v_item IN
    SELECT c.id AS cart_id, c.quantity, p.id AS product_id, p.name, p.unit, p.retail_price,
           p.stock_quantity, p.min_retail_quantity, p.is_active
    FROM public.cart_items c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.user_id = v_uid
    ORDER BY p.id
    FOR UPDATE OF p, c
  LOOP
    v_count := v_count + 1;
    IF NOT v_item.is_active THEN
      RAISE EXCEPTION 'Produk "%" sudah tidak tersedia', v_item.name;
    END IF;
    IF v_item.quantity > v_item.stock_quantity THEN
      RAISE EXCEPTION 'Stok "%" tidak mencukupi (tersisa %)', v_item.name, v_item.stock_quantity;
    END IF;
    IF v_item.quantity < v_item.min_retail_quantity THEN
      RAISE EXCEPTION 'Minimal pembelian "%" adalah % %', v_item.name, v_item.min_retail_quantity, v_item.unit;
    END IF;
  END LOOP;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'Keranjang belanja kosong';
  END IF;

  INSERT INTO public.orders (
    user_id, address_id, customer_name_snapshot, customer_phone_snapshot, customer_email_snapshot,
    shipping_address_snapshot, customer_note, subtotal, shipping_cost, total_amount
  ) VALUES (
    v_uid, v_address.id,
    COALESCE(NULLIF(v_profile.full_name, ''), v_address.recipient_name),
    COALESCE(NULLIF(v_profile.phone, ''), v_address.phone),
    v_profile.email,
    jsonb_build_object(
      'recipient_name', v_address.recipient_name,
      'phone', v_address.phone,
      'address_line', v_address.address_line,
      'district', v_address.district,
      'city_regency', v_address.city_regency,
      'province', v_address.province,
      'postal_code', v_address.postal_code,
      'notes', v_address.notes
    ),
    v_note, 0, 0, 0
  ) RETURNING * INTO v_order;

  FOR v_item IN
    SELECT c.quantity, p.id AS product_id, p.name, p.unit, p.retail_price
    FROM public.cart_items c
    JOIN public.products p ON p.id = c.product_id
    WHERE c.user_id = v_uid
  LOOP
    v_price := v_item.retail_price;
    v_price_type := 'retail';
    IF v_wholesale THEN
      SELECT t.unit_price INTO v_price
      FROM public.product_price_tiers t
      WHERE t.product_id = v_item.product_id AND t.is_active
        AND v_item.quantity >= t.min_quantity
        AND (t.max_quantity IS NULL OR v_item.quantity <= t.max_quantity)
      ORDER BY t.min_quantity DESC
      LIMIT 1;
      IF FOUND THEN
        v_price_type := 'wholesale';
      ELSE
        v_price := v_item.retail_price;
      END IF;
    END IF;

    INSERT INTO public.order_items (
      order_id, product_id, product_name_snapshot, unit_snapshot, quantity,
      unit_price_snapshot, price_type_snapshot, subtotal
    ) VALUES (
      v_order.id, v_item.product_id, v_item.name, v_item.unit, v_item.quantity,
      v_price, v_price_type, v_price * v_item.quantity
    );

    UPDATE public.products SET stock_quantity = stock_quantity - v_item.quantity
    WHERE id = v_item.product_id;

    v_subtotal := v_subtotal + v_price * v_item.quantity;
  END LOOP;

  UPDATE public.orders
  SET subtotal = v_subtotal, total_amount = v_subtotal + shipping_cost
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  DELETE FROM public.cart_items WHERE user_id = v_uid;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_from_cart(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_from_cart(uuid, text) TO authenticated;

-- Orders / order items are now created only through create_order_from_cart
DROP POLICY IF EXISTS "orders own insert" ON public.orders;
DROP POLICY IF EXISTS "order items own order insert" ON public.order_items;

-- 4. Force initial status on customer submissions
CREATE OR REPLACE FUNCTION public.enforce_customer_initial_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'payments' THEN
    NEW.status := 'pending_confirmation';
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.admin_note := NULL;
  ELSIF TG_TABLE_NAME = 'wholesale_applications' THEN
    NEW.status := 'pending';
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    NEW.review_notes := NULL;
  ELSIF TG_TABLE_NAME = 'quotations' THEN
    NEW.status := 'waiting';
    NEW.quoted_total := NULL;
    NEW.admin_quote_notes := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
  ELSIF TG_TABLE_NAME = 'quotation_items' THEN
    NEW.offered_unit_price := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_customer_initial_status BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_initial_status();
CREATE TRIGGER enforce_customer_initial_status BEFORE INSERT ON public.wholesale_applications
FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_initial_status();
CREATE TRIGGER enforce_customer_initial_status BEFORE INSERT ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_initial_status();
CREATE TRIGGER enforce_customer_initial_status BEFORE INSERT ON public.quotation_items
FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_initial_status();

-- 5. Least privilege for anonymous visitors
REVOKE ALL ON public.addresses, public.cart_items, public.order_items, public.orders, public.payments,
  public.product_price_tiers, public.profiles, public.quotation_items, public.quotations,
  public.wholesale_applications FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.categories, public.products, public.product_images FROM anon;
GRANT SELECT ON public.categories, public.products, public.product_images TO anon;