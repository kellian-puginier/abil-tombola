# ABIL Tombola — Tour des Héraults

Application full-stack Next.js 14 pour la tombola numérique du club de badminton ABIL.
Chaque ticket porte le nom d'un joueur et est unique. Paiement via SumUp, base
Supabase, animations de tirage live pour l'administrateur.

## Stack

- **Framework** : Next.js 14 (App Router) + TypeScript
- **DB** : Supabase (PostgreSQL + Realtime + Storage + Auth)
- **Styling** : Tailwind CSS
- **State** : Zustand
- **Paiement** : SumUp Checkouts API
- **Déploiement** : Vercel

## Installation

```bash
npm install
cp .env.example .env.local
# Renseignez les variables Supabase + SumUp dans .env.local
npm run dev
```

## Configuration Supabase

1. Créez un projet Supabase.
2. Dans **SQL Editor**, exécutez dans l'ordre les migrations :
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_rls_policies.sql`
   - `supabase/migrations/0003_claim_tickets.sql`
   - `supabase/migrations/0004_storage_bucket.sql`
3. Dans **Authentication → Users**, créez l'utilisateur admin (email + mot de passe).
   Le même email doit être renseigné dans `ADMIN_EMAIL`.
4. Récupérez l'URL du projet, l'`anon key` et la `service_role key` pour `.env.local`.

## Configuration SumUp

1. Créez un compte développeur SumUp et générez une clé API (OAuth2 client credentials).
2. Récupérez votre `merchant_code`.
3. Définissez l'URL du webhook dans le tableau de bord SumUp :
   `https://votre-domaine.vercel.app/api/webhook/sumup`
4. Stockez le secret HMAC du webhook dans `SUMUP_WEBHOOK_SECRET`.

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUMUP_API_KEY=
SUMUP_MERCHANT_CODE=
SUMUP_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://votre-domaine.vercel.app
ADMIN_EMAIL=admin@abil.fr
```

## Architecture

```
app/
  (public)/              # Pages publiques
    page.tsx             # Landing + grille tickets + cartes lots
    checkout/            # Panier → infos → SumUp
    success/             # Confirmation post-paiement
  admin/
    login/               # Login (hors layout protégé)
    (protected)/         # Layout avec auth-guard
      dashboard/
      tickets/
      prizes/
      events/
      draw/              # Tirage live animé
  api/
    checkout/            # Crée le SumUp checkout
    verify-checkout/     # Vérifie + claim_tickets
    webhook/sumup/       # Fallback webhook
    admin/               # CRUD admin

lib/
  pricing.ts             # computeOptimalPrice (algo packs)
  supabase/              # client + server clients
  sumup.ts               # API SumUp + vérif HMAC
  auth.ts                # requireAdmin()
  utils.ts               # tel FR, helpers

store/
  cartStore.ts           # Zustand cart

components/
  public/                # TicketGrid, TicketCard, BundleCard, CartBar...
  admin/                 # TicketsAdmin, PrizesAdmin, DrawPanel...

supabase/
  migrations/            # SQL migrations
```

## Algorithme de prix (packs)

```
1 ticket  = 2 €
3 tickets = 5 €
5 tickets = 7 €
```

`computeOptimalPrice(n)` calcule le total optimal en favorisant les packs de 5,
puis 3, puis 1. Les tickets avec `discount_price` sont facturés à leur prix
unitaire spécial et exclus du calcul des packs.

## Concurrence (race conditions)

Les tickets ne sont **pas réservés** pendant le paiement. La fonction Postgres
`claim_tickets()` est appelée après confirmation SumUp et verrouille les lignes
(`FOR UPDATE`) avant de basculer leur statut à `sold`. En cas de conflit (deux
acheteurs sur le même ticket), le second paiement est marqué pour résolution
manuelle par l'admin.

## Sécurité

- `SUPABASE_SERVICE_ROLE_KEY` et `SUMUP_API_KEY` : jamais exposés côté client.
- Toutes les écritures DB passent par les routes API (jamais en direct depuis le client).
- Webhook SumUp : vérification HMAC SHA-256.
- Admin : session vérifiée côté serveur dans `(protected)/layout.tsx` + chaque route API.
- Téléphone français normalisé avant stockage.

## Scripts

```bash
npm run dev         # Dev server
npm run build       # Build production
npm run start       # Serveur production
npm run typecheck   # Vérification TypeScript
```
