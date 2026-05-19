-- Subtitle : club, nationalité, ou titre libre affiché sous le nom du joueur
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS subtitle TEXT;

-- Numéro de ticket visible (ex: "N°34") — assigné côté serveur à la création
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_number INT;

-- Index pour garantir l'unicité et pouvoir trier par numéro
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)
  WHERE ticket_number IS NOT NULL;

-- Numéroter les tickets existants selon leur display_order
UPDATE tickets
SET ticket_number = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, created_at) AS rn
  FROM tickets
  WHERE ticket_number IS NULL
) sub
WHERE tickets.id = sub.id;
