-- One-row transaction locks make duplicate scheduler deliveries idempotent: each
-- sample charges only the interval since the previous committed sample.
CREATE OR REPLACE FUNCTION public.meter_coder_customer_compute(
  p_slot_id uuid, p_running boolean
) RETURNS TABLE (used_ms bigint, max_ms bigint, should_stop boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_row public.coder_customer_compute_usage%ROWTYPE;
DECLARE v_now timestamptz := clock_timestamp();
DECLARE v_elapsed bigint;
BEGIN
  IF p_slot_id IS NULL OR p_running IS NULL THEN RAISE EXCEPTION 'Invalid metering sample'; END IF;
  SELECT * INTO v_row FROM public.coder_customer_compute_usage
    WHERE slot_id = p_slot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unregistered customer workspace'; END IF;
  v_elapsed := GREATEST(0, floor(extract(epoch FROM (v_now - v_row.last_checked_at)) * 1000)::bigint);
  UPDATE public.coder_customer_compute_usage u
     SET used_ms = v_row.used_ms + CASE WHEN p_running THEN v_elapsed ELSE 0 END,
         last_checked_at = v_now,
         updated_at = v_now
   WHERE u.slot_id = p_slot_id
   RETURNING u.used_ms, u.max_ms INTO used_ms, max_ms;
  should_stop := used_ms >= max_ms;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.meter_coder_customer_compute(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.meter_coder_customer_compute(uuid, boolean) TO service_role;
