-- ============================================================
-- claim_tickets(): atomically marks a set of tickets as sold,
-- locking the rows to prevent races between concurrent buyers.
-- Returns FALSE when any of the requested tickets is no longer
-- 'available', leaving the table untouched.
-- ============================================================

CREATE OR REPLACE FUNCTION claim_tickets(
  p_ticket_ids  UUID[],
  p_purchase_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INT;
BEGIN
  SELECT COUNT(*)
    INTO conflict_count
    FROM tickets
   WHERE id = ANY(p_ticket_ids)
     AND status <> 'available'
     FOR UPDATE;

  IF conflict_count > 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE tickets
     SET status   = 'sold',
         buyer_id = p_purchase_id
   WHERE id = ANY(p_ticket_ids);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- claim_bundle(): same idea for the bundle product. Marks the
-- bundle row + its 5 sub-tickets as sold atomically.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_bundle(
  p_bundle_id   UUID,
  p_purchase_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  bundle_status TEXT;
BEGIN
  SELECT status
    INTO bundle_status
    FROM bundles
   WHERE id = p_bundle_id
     FOR UPDATE;

  IF bundle_status IS NULL OR bundle_status <> 'available' THEN
    RETURN FALSE;
  END IF;

  UPDATE bundles
     SET status = 'sold',
         buyer_id = p_purchase_id
   WHERE id = p_bundle_id;

  UPDATE tickets
     SET status = 'sold',
         buyer_id = p_purchase_id
   WHERE bundle_id = p_bundle_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
