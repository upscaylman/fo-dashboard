-- ================================================
-- MIGRATION: TABLE ACTIVE_SESSIONS (Présence en ligne)
-- ================================================
-- Cette table gère la présence en temps réel des utilisateurs
-- Exécutez ce script dans le SQL Editor de Supabase

-- ================================================
-- 1. TABLE ACTIVE_SESSIONS
-- ================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  avatar_url TEXT,
  current_page TEXT DEFAULT 'dashboard',
  current_tool TEXT, -- 'docease', 'signease', ou null
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. INDEX pour performances
-- ================================================
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);

-- ================================================
-- 3. FONCTION pour nettoyer les sessions expirées
-- ================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Supprimer les sessions inactives depuis plus de 5 minutes
  DELETE FROM active_sessions 
  WHERE last_activity < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 4. POLITIQUES RLS (Row Level Security)
-- ================================================
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut voir les sessions actives
CREATE POLICY "Allow read access for authenticated users" ON active_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Chaque utilisateur peut gérer ses propres sessions
CREATE POLICY "Users can insert their own sessions" ON active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON active_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Les super admins peuvent voir et gérer toutes les sessions
CREATE POLICY "Super admin full access to sessions" ON active_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- ================================================
-- 5. REALTIME: Activer les notifications en temps réel
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE active_sessions;

-- ================================================
-- VERIFICATION
-- ================================================
-- Vérifier que la table a été créée:
-- SELECT * FROM active_sessions LIMIT 5;
