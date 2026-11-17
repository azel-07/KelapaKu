-- 1. Tangani data anomali pembayaran Rp110.000 untuk pesanan Rp15.000 tanpa bukti pembayaran
UPDATE public.payments
SET 
    status = 'rejected',
    admin_note = 'Ditolak sistem: Nominal tidak sesuai total pesanan dan bukti pembayaran tidak tersedia',
    updated_at = now()
WHERE id = '711a466a-f309-4d1a-9c6d-680b98b6bfb9'
  AND status = 'pending_confirmation';

-- 2. Buat partial unique index untuk mencegah pembayaran ganda (pending atau confirmed) pada 1 pesanan
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_single_pending_or_confirmed
ON public.payments (order_id)
WHERE status IN ('pending_confirmation', 'confirmed');

-- 3. Fungsi RPC Atomik: Verifikasi Pembayaran oleh Admin
CREATE OR REPLACE FUNCTION public.admin_verify_payment(
    p_payment_id uuid,
    p_action text,
    p_admin_note text DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
BEGIN
    -- Validasi hak akses admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat memproses pembayaran';
    END IF;

    -- Validasi aksi
    IF p_action NOT IN ('confirmed', 'rejected') THEN
        RAISE EXCEPTION 'Aksi tidak valid: harus confirmed atau rejected';
    END IF;

    -- Kunci dan ambil data pembayaran
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data pembayaran tidak ditemukan';
    END IF;

    IF v_payment.status <> 'pending_confirmation' THEN
        RAISE EXCEPTION 'Pembayaran sudah diproses sebelumnya (status: %)', v_payment.status;
    END IF;

    -- Kunci dan ambil data pesanan
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pesanan terkait tidak ditemukan';
    END IF;

    -- Validasi wajib jika dikonfirmasi (Issue 3 & 4)
    IF p_action = 'confirmed' THEN
        IF v_payment.proof_url IS NULL OR trim(v_payment.proof_url) = '' THEN
            RAISE EXCEPTION 'Gagal konfirmasi: Bukti pembayaran wajib diunggah terlebih dahulu';
        END IF;

        IF v_payment.amount <> v_order.total_amount THEN
            RAISE EXCEPTION 'Gagal konfirmasi: Nominal pembayaran (Rp%) tidak sesuai dengan tagihan pesanan (Rp%)',
                to_char(v_payment.amount, 'FM999,999,999'),
                to_char(v_order.total_amount, 'FM999,999,999');
        END IF;
    END IF;

    -- Perbarui tabel payments
    UPDATE public.payments
    SET
        status = p_action::payment_status,
        verified_by = v_uid,
        verified_at = now(),
        admin_note = NULLIF(trim(p_admin_note), ''),
        updated_at = now()
    WHERE id = v_payment.id
    RETURNING * INTO v_payment;

    -- Perbarui tabel orders secara atomik (Issue 5 & 2)
    IF p_action = 'confirmed' THEN
        UPDATE public.orders
        SET
            payment_status = 'confirmed',
            order_status = CASE 
                WHEN order_status = 'awaiting_payment' THEN 'payment_confirmed'::order_status 
                ELSE order_status 
            END,
            updated_at = now()
        WHERE id = v_order.id;
    ELSE
        UPDATE public.orders
        SET
            payment_status = 'rejected',
            updated_at = now()
        WHERE id = v_order.id;
    END IF;

    RETURN v_payment;
END;
$$;

-- 4. Fungsi RPC Atomik: Perubahan Pesanan oleh Admin dengan Sinkronisasi Total & Pembayaran
CREATE OR REPLACE FUNCTION public.admin_update_order(
    p_order_id uuid,
    p_order_status text,
    p_shipping_cost numeric,
    p_admin_note text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_cost numeric := COALESCE(p_shipping_cost, 0);
    v_new_total numeric;
BEGIN
    -- Validasi hak akses admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat mengubah pesanan';
    END IF;

    IF v_cost < 0 THEN
        RAISE EXCEPTION 'Ongkos kirim tidak boleh bernilai negatif';
    END IF;

    -- Kunci dan ambil data pesanan
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pesanan tidak ditemukan';
    END IF;

    -- Validasi Issue 2: Pesanan tidak boleh diselesaikan jika pembayaran belum confirmed
    IF p_order_status = 'completed' AND v_order.payment_status <> 'confirmed' THEN
        RAISE EXCEPTION 'Pesanan belum dapat diselesaikan (completed) karena pembayaran belum dikonfirmasi (status: %)', v_order.payment_status;
    END IF;

    v_new_total := v_order.subtotal + v_cost;

    -- Perbarui pesanan
    UPDATE public.orders
    SET
        order_status = p_order_status::order_status,
        shipping_cost = v_cost,
        total_amount = v_new_total,
        admin_note = NULLIF(trim(p_admin_note), ''),
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    -- Issue 6: Sinkronkan nominal pembayaran pending jika total pesanan diubah
    UPDATE public.payments
    SET
        amount = v_new_total,
        updated_at = now()
    WHERE order_id = p_order_id
      AND status = 'pending_confirmation';

    RETURN v_order;
END;
$$;

-- 5. Atur hak akses fungsi
REVOKE EXECUTE ON FUNCTION public.admin_verify_payment(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_payment(uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_update_order(uuid, text, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_order(uuid, text, numeric, text) TO authenticated;
