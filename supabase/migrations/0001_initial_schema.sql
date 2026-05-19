-- ============================================================
-- ABIL Tombola — initial schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- PURCHASES (declared first since tickets/bundles reference it)
-- ------------------------------------------------------------
CREATE TABLE purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_first_name    TEXT NOT NULL,
  buyer_last_name     TEXT NOT NULL,
  buyer_club          TEXT NOT NULL,
  buyer_phone         TEXT NOT NULL,
  ticket_ids          UUID[] NOT NULL,
  total_amount        DECIMAL(10,2) NOT NULL,
  sumup_checkout_id   TEXT UNIQUE,
  sumup_checkout_url  TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'completed', 'failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ
);

CREATE INDEX idx_purchases_sumup ON purchases(sumup_checkout_id);
CREATE INDEX idx_purchases_status ON purchases(status);

-- ------------------------------------------------------------
-- TICKETS
-- ------------------------------------------------------------
CREATE TABLE tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name       TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  is_bundle_member  BOOLEAN NOT NULL DEFAULT FALSE,
  bundle_id         UUID,
  bundle_index      INT,
  status            TEXT NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available', 'sold', 'won')),
  buyer_id          UUID REFERENCES purchases(id) ON DELETE SET NULL,
  display_order     INT NOT NULL DEFAULT 0,
  discount_price    DECIMAL(10,2),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_bundle_id ON tickets(bundle_id);
CREATE INDEX idx_tickets_active ON tickets(is_active);

-- ------------------------------------------------------------
-- BUNDLES (special x5 ticket as a single purchasable product)
-- ------------------------------------------------------------
CREATE TABLE bundles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name   TEXT NOT NULL,
  special_label TEXT NOT NULL,
  special_price DECIMAL(10,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'available'
                  CHECK (status IN ('available', 'sold')),
  buyer_id      UUID REFERENCES purchases(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tickets
  ADD CONSTRAINT tickets_bundle_fk
  FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- PRIZES (lots)
-- ------------------------------------------------------------
CREATE TABLE prizes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  estimated_value     DECIMAL(10,2),
  image_url           TEXT,
  display_order       INT NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'drawn')),
  winner_ticket_id    UUID REFERENCES tickets(id),
  winner_purchase_id  UUID REFERENCES purchases(id),
  drawn_at            TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- SPECIAL EVENTS
-- ------------------------------------------------------------
CREATE TABLE special_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  ticket_id   UUID REFERENCES tickets(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('discount', 'announcement')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
