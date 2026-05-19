-- Public bucket for prize images. Anyone can read; only the
-- service_role (server-side) writes/updates/deletes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('prize-images', 'prize-images', TRUE)
ON CONFLICT (id) DO NOTHING;
