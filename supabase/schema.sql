-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  Book Promo — Schema Supabase                               ║
-- ║  Tables: contacts, campaigns, send_logs                     ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- 1. Contacts (liste d'emails importés)
CREATE TABLE IF NOT EXISTS promo_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'import',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_promo_contacts_email ON promo_contacts(email);

-- 2. Campagnes
CREATE TABLE IF NOT EXISTS promo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  book_title TEXT NOT NULL,
  cover_url TEXT,
  amazon_url TEXT,
  description TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'failed')),
  total_emails INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 3. Logs d'envoi (un row par email envoyé)
CREATE TABLE IF NOT EXISTS promo_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES promo_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES promo_contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promo_send_logs_campaign ON promo_send_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_promo_send_logs_status ON promo_send_logs(campaign_id, status);

-- 4. RLS (Row Level Security) — désactivé car app privée
-- Si tu veux protéger plus tard, active RLS et ajoute des policies
ALTER TABLE promo_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_send_logs ENABLE ROW LEVEL SECURITY;

-- Policies: accès total via anon key (app privée, pas d'utilisateurs publics)
CREATE POLICY "Allow all on promo_contacts" ON promo_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on promo_campaigns" ON promo_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on promo_send_logs" ON promo_send_logs FOR ALL USING (true) WITH CHECK (true);
