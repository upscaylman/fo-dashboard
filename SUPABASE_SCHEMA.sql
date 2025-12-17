-- ================================================
-- SCHEMA SUPABASE - FO MÉTAUX DASHBOARD
-- ================================================
-- Ce script crée toutes les tables nécessaires pour le dashboard
-- Exécutez-le dans le SQL Editor de Supabase

-- ================================================
-- 1. TABLE USERS (Profils des secrétaires)
-- ================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Secrétaire',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. TABLE DOCUMENT_TYPES (Types de documents)
-- ================================================
CREATE TABLE IF NOT EXISTS document_types (
  id SERIAL PRIMARY KEY,
  type_name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT 'bg-slate-500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. TABLE DOCUMENTS (Lettres générées)
-- ================================================
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type_id INTEGER REFERENCES document_types(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. TABLE SIGNATURES (Tracking des signatures)
-- ================================================
CREATE TABLE IF NOT EXISTS signatures (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature_data TEXT, -- Base64 ou URL de la signature
  ip_address TEXT
);

-- ================================================
-- 5. TABLE ACTIVITIES (Activité hebdomadaire)
-- ================================================
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Lundi, 6=Dimanche
  letters_count INTEGER DEFAULT 0,
  signatures_count INTEGER DEFAULT 0,
  week_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 6. TABLE TEMPLATES (Modèles Word/Excel)
-- ================================================
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- word, excel
  size_label TEXT NOT NULL, -- DOCX, XLSM, etc.
  file_url TEXT NOT NULL,
  description TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 7. TABLE BOOKMARKS (Favoris utilisateurs)
-- ================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL,
  item_type TEXT NOT NULL, -- news, template, document
  title TEXT NOT NULL,
  url TEXT,
  subtitle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id, item_type)
);

-- ================================================
-- INDEXES pour performances
-- ================================================
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_id ON documents(type_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_signatures_document_id ON signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_week_start ON activities(week_start_date);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);

-- ================================================
-- TRIGGERS pour updated_at automatique
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants avant de les recréer
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================
-- Active RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : Les utilisateurs peuvent lire toutes les données
CREATE POLICY "Allow read access for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow read access for documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow read access for signatures" ON signatures
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create signatures" ON signatures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow read access for activities" ON activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for templates" ON templates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for document_types" ON document_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read their own bookmarks" ON bookmarks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks" ON bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- ================================================
-- SUCCÈS ! Toutes les tables sont créées
-- ================================================
-- Prochaine étape : Insérer les données initiales avec SUPABASE_SEED.sql
