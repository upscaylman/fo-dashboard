-- Migration: Stockage du contenu de la documentation DocEase
-- Date: 2026-01-21
-- Description: Permet aux administrateurs de modifier la documentation et persister les changements

-- Table pour stocker le contenu des sections de la documentation
CREATE TABLE IF NOT EXISTS documentation_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id VARCHAR(100) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par section
CREATE INDEX IF NOT EXISTS idx_documentation_section ON documentation_content(section_id);

-- Table pour l'historique des modifications
CREATE TABLE IF NOT EXISTS documentation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  modified_by VARCHAR(255) NOT NULL,
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour l'historique
CREATE INDEX IF NOT EXISTS idx_documentation_history_section ON documentation_history(section_id);
CREATE INDEX IF NOT EXISTS idx_documentation_history_date ON documentation_history(modified_at DESC);

-- Activer RLS (Row Level Security)
ALTER TABLE documentation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentation_history ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire le contenu
CREATE POLICY "documentation_content_read_all" ON documentation_content
  FOR SELECT USING (true);

-- Politique: Seuls les admins autorisés peuvent modifier
CREATE POLICY "documentation_content_write_admins" ON documentation_content
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'contact@fo-metaux.fr',
      'contact@fometaux.fr', 
      'bouvier.jul@gmail.com',
      'aguillermin@fo-metaux.fr'
    )
  );

-- Politique: Tout le monde peut lire l'historique
CREATE POLICY "documentation_history_read_all" ON documentation_history
  FOR SELECT USING (true);

-- Politique: Seuls les admins peuvent ajouter à l'historique
CREATE POLICY "documentation_history_write_admins" ON documentation_history
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'contact@fo-metaux.fr',
      'contact@fometaux.fr',
      'bouvier.jul@gmail.com',
      'aguillermin@fo-metaux.fr'
    )
  );

-- Fonction pour sauvegarder avec historique automatique
CREATE OR REPLACE FUNCTION save_documentation_content(
  p_section_id VARCHAR(100),
  p_content TEXT,
  p_updated_by VARCHAR(255)
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Sauvegarder l'ancienne version dans l'historique si elle existe
  INSERT INTO documentation_history (section_id, content, modified_by)
  SELECT section_id, content, updated_by
  FROM documentation_content
  WHERE section_id = p_section_id;

  -- Insérer ou mettre à jour le contenu
  INSERT INTO documentation_content (section_id, content, updated_by, updated_at)
  VALUES (p_section_id, p_content, p_updated_by, NOW())
  ON CONFLICT (section_id) 
  DO UPDATE SET 
    content = EXCLUDED.content,
    updated_by = EXCLUDED.updated_by,
    updated_at = NOW()
  RETURNING json_build_object(
    'id', id,
    'section_id', section_id,
    'updated_by', updated_by,
    'updated_at', updated_at
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions sur la fonction
GRANT EXECUTE ON FUNCTION save_documentation_content TO authenticated;
GRANT EXECUTE ON FUNCTION save_documentation_content TO anon;

-- Commentaires
COMMENT ON TABLE documentation_content IS 'Stockage du contenu modifiable de la documentation DocEase';
COMMENT ON TABLE documentation_history IS 'Historique des modifications de la documentation';
COMMENT ON FUNCTION save_documentation_content IS 'Sauvegarde le contenu avec historique automatique';
