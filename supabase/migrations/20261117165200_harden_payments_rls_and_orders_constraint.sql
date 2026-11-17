-- 1. Selaraskan data pesanan historis completed agar payment_status terkonfirmasi
UPDATE public.orders
SET 
    payment_status = 'confirmed',
    admin_note = COALESCE(admin_note || E'\n', '') || 'Diselaraskan sistem: pesanan berstatus completed disesuaikan ke payment_status confirmed',
    updated_at = now()
WHERE order_status = 'completed' 
  AND payment_status <> 'confirmed';

-- 2. Tambahkan CHECK constraint pada orders agar status completed WAJIB memiliki payment_status = confirmed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_completed_must_be_paid'
    ) THEN
        ALTER TABLE public.orders
        ADD CONSTRAINT chk_orders_completed_must_be_paid
        CHECK (((order_status <> 'completed'::order_status) OR (payment_status = 'confirmed'::payment_status)));
    END IF;
END $$;

-- 3. Batasi policy INSERT pada tabel payments hanya untuk admin (tutup celah manipulasi client)
ALTER POLICY "payments own submit" ON public.payments 
WITH CHECK (public.is_admin());

-- 4. Amankan fungsi trigger handle_new_auth_user dari eksekusi RPC publik/anon
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM public, anon;
