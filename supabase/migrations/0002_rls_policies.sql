-- ============================================================
-- Row Level Security
-- Public clients only ever read. All writes go through API
-- routes using the service_role key (which bypasses RLS).
-- ============================================================

ALTER TABLE tickets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read tickets"        ON tickets        FOR SELECT USING (TRUE);
CREATE POLICY "Public read bundles"        ON bundles        FOR SELECT USING (TRUE);
CREATE POLICY "Public read prizes"         ON prizes         FOR SELECT USING (TRUE);
CREATE POLICY "Public read special_events" ON special_events FOR SELECT USING (TRUE);

-- Purchases have no public-readable policy: they contain PII.
-- The service_role key (server-side only) bypasses RLS for admin and
-- transactional flows.
