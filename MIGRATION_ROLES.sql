-- ================================================
-- MIGRATION : SYSTÈME DE RÔLES ET PERMISSIONS
-- ================================================
-- Ce script migre votre base de données existante pour ajouter
-- un système de rôles et permissions

-- ================================================
-- 1. CRÉATION DE L'ENUM POUR LES RÔLES
-- ================================================
-- Création du type enum pour les rôles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'secretary_general', 'secretary', 'assistant', 'guest');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================================
-- 2. MODIFICATION DE LA TABLE USERS
-- ================================================
-- Ajout de la colonne role_level (nouveau système)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_level user_role DEFAULT 'secretary';

-- Migration des rôles existants vers le nouveau système
UPDATE users SET role_level = 
  CASE 
    WHEN role ILIKE '%général%' OR role ILIKE '%general%' THEN 'secretary_general'::user_role
    WHEN role ILIKE '%adjoint%' THEN 'secretary'::user_role
    WHEN role ILIKE '%assist%' THEN 'assistant'::user_role
    WHEN role ILIKE '%admin%' THEN 'admin'::user_role
    ELSE 'secretary'::user_role
  END
WHERE role_level IS NULL;

-- Optionnel : Supprimer l'ancienne colonne role après migration
-- ALTER TABLE users DROP COLUMN IF EXISTS role;
-- ALTER TABLE users RENAME COLUMN role_level TO role;

-- ================================================
-- 3. TABLE PERMISSIONS (Permissions disponibles)
-- ================================================
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des permissions de base
INSERT INTO permissions (name, description, category) VALUES
  -- Documents
  ('documents.create', 'Créer des documents', 'documents'),
  ('documents.read.own', 'Lire ses propres documents', 'documents'),
  ('documents.read.all', 'Lire tous les documents', 'documents'),
  ('documents.update.own', 'Modifier ses propres documents', 'documents'),
  ('documents.update.all', 'Modifier tous les documents', 'documents'),
  ('documents.delete.own', 'Supprimer ses propres documents', 'documents'),
  ('documents.delete.all', 'Supprimer tous les documents', 'documents'),
  
  -- Utilisateurs
  ('users.create', 'Créer des utilisateurs', 'users'),
  ('users.read', 'Consulter les utilisateurs', 'users'),
  ('users.update', 'Modifier des utilisateurs', 'users'),
  ('users.delete', 'Supprimer des utilisateurs', 'users'),
  ('users.manage_roles', 'Gérer les rôles des utilisateurs', 'users'),
  
  -- Statistiques
  ('stats.view.own', 'Voir ses propres statistiques', 'stats'),
  ('stats.view.all', 'Voir toutes les statistiques', 'stats'),
  ('stats.export', 'Exporter les statistiques', 'stats'),
  
  -- Templates
  ('templates.read', 'Consulter les modèles', 'templates'),
  ('templates.download', 'Télécharger les modèles', 'templates'),
  ('templates.create', 'Créer des modèles', 'templates'),
  ('templates.update', 'Modifier des modèles', 'templates'),
  ('templates.delete', 'Supprimer des modèles', 'templates'),
  
  -- Signatures
  ('signatures.create.own', 'Signer ses documents', 'signatures'),
  ('signatures.create.all', 'Signer tous les documents', 'signatures'),
  ('signatures.view.own', 'Voir ses signatures', 'signatures'),
  ('signatures.view.all', 'Voir toutes les signatures', 'signatures'),
  
  -- Paramètres
  ('settings.view', 'Voir les paramètres', 'settings'),
  ('settings.manage', 'Gérer les paramètres système', 'settings')
ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 4. TABLE ROLE_PERMISSIONS (Liaison rôles-permissions)
-- ================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role user_role NOT NULL,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role, permission_id)
);

-- ================================================
-- 5. ASSIGNATION DES PERMISSIONS AUX RÔLES
-- ================================================

-- Helper function pour assigner facilement les permissions
CREATE OR REPLACE FUNCTION assign_permission_to_role(role_name user_role, permission_name TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO role_permissions (role, permission_id)
  SELECT role_name, id FROM permissions WHERE name = permission_name
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- SUPER ADMIN : Toutes les permissions
DO $$
DECLARE
  perm RECORD;
BEGIN
  FOR perm IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions (role, permission_id)
    VALUES ('super_admin', perm.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ADMIN : Gestion complète sauf utilisateurs
SELECT assign_permission_to_role('admin', 'documents.create');
SELECT assign_permission_to_role('admin', 'documents.read.all');
SELECT assign_permission_to_role('admin', 'documents.update.all');
SELECT assign_permission_to_role('admin', 'documents.delete.all');
SELECT assign_permission_to_role('admin', 'users.read');
SELECT assign_permission_to_role('admin', 'stats.view.all');
SELECT assign_permission_to_role('admin', 'stats.export');
SELECT assign_permission_to_role('admin', 'templates.read');
SELECT assign_permission_to_role('admin', 'templates.download');
SELECT assign_permission_to_role('admin', 'templates.create');
SELECT assign_permission_to_role('admin', 'templates.update');
SELECT assign_permission_to_role('admin', 'templates.delete');
SELECT assign_permission_to_role('admin', 'signatures.create.all');
SELECT assign_permission_to_role('admin', 'signatures.view.all');
SELECT assign_permission_to_role('admin', 'settings.view');

-- SECRÉTAIRE GÉNÉRAL : Comme admin mais moins de gestion templates
SELECT assign_permission_to_role('secretary_general', 'documents.create');
SELECT assign_permission_to_role('secretary_general', 'documents.read.all');
SELECT assign_permission_to_role('secretary_general', 'documents.update.all');
SELECT assign_permission_to_role('secretary_general', 'documents.delete.own');
SELECT assign_permission_to_role('secretary_general', 'users.read');
SELECT assign_permission_to_role('secretary_general', 'stats.view.all');
SELECT assign_permission_to_role('secretary_general', 'stats.export');
SELECT assign_permission_to_role('secretary_general', 'templates.read');
SELECT assign_permission_to_role('secretary_general', 'templates.download');
SELECT assign_permission_to_role('secretary_general', 'signatures.create.own');
SELECT assign_permission_to_role('secretary_general', 'signatures.view.all');
SELECT assign_permission_to_role('secretary_general', 'settings.view');

-- SECRÉTAIRE : Gestion de ses propres documents
SELECT assign_permission_to_role('secretary', 'documents.create');
SELECT assign_permission_to_role('secretary', 'documents.read.own');
SELECT assign_permission_to_role('secretary', 'documents.update.own');
SELECT assign_permission_to_role('secretary', 'documents.delete.own');
SELECT assign_permission_to_role('secretary', 'users.read');
SELECT assign_permission_to_role('secretary', 'stats.view.own');
SELECT assign_permission_to_role('secretary', 'templates.read');
SELECT assign_permission_to_role('secretary', 'templates.download');
SELECT assign_permission_to_role('secretary', 'signatures.create.own');
SELECT assign_permission_to_role('secretary', 'signatures.view.own');

-- ASSISTANT : Permissions limitées
SELECT assign_permission_to_role('assistant', 'documents.create');
SELECT assign_permission_to_role('assistant', 'documents.read.own');
SELECT assign_permission_to_role('assistant', 'documents.update.own');
SELECT assign_permission_to_role('assistant', 'stats.view.own');
SELECT assign_permission_to_role('assistant', 'templates.read');
SELECT assign_permission_to_role('assistant', 'templates.download');
SELECT assign_permission_to_role('assistant', 'signatures.create.own');
SELECT assign_permission_to_role('assistant', 'signatures.view.own');

-- INVITÉ : Lecture seule
SELECT assign_permission_to_role('guest', 'templates.read');
SELECT assign_permission_to_role('guest', 'users.read');

-- ================================================
-- 6. MISE À JOUR DES POLITIQUES RLS
-- ================================================

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Allow read access for documents" ON documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;

-- Nouvelles politiques basées sur les rôles

-- Documents : Admins peuvent tout lire, autres seulement les leurs
CREATE POLICY "Documents read policy" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role_level IN ('super_admin', 'admin', 'secretary_general')
                OR documents.user_id = auth.uid()
            )
        )
    );

-- Documents : Création selon permissions
CREATE POLICY "Documents create policy" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role_level IN ('super_admin', 'admin', 'secretary_general', 'secretary', 'assistant')
        )
        AND user_id = auth.uid()
    );

-- Documents : Mise à jour
CREATE POLICY "Documents update policy" ON documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role_level IN ('super_admin', 'admin', 'secretary_general')
                OR (documents.user_id = auth.uid() AND users.role_level IN ('secretary', 'assistant'))
            )
        )
    );

-- Documents : Suppression
CREATE POLICY "Documents delete policy" ON documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND (
                users.role_level IN ('super_admin', 'admin')
                OR documents.user_id = auth.uid()
            )
        )
    );

-- ================================================
-- 7. FONCTION HELPER POUR VÉRIFIER LES PERMISSIONS
-- ================================================
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  has_perm BOOLEAN;
BEGIN
  -- Récupérer le rôle de l'utilisateur
  SELECT role_level INTO user_role_val FROM users WHERE id = user_id;
  
  -- Super admin a toutes les permissions
  IF user_role_val = 'super_admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Vérifier si le rôle a la permission
  SELECT EXISTS (
    SELECT 1 
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    WHERE rp.role = user_role_val AND p.name = permission_name
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. ENABLE RLS SUR LES NOUVELLES TABLES
-- ================================================
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les permissions (pour l'UI)
CREATE POLICY "Public read permissions" ON permissions
    FOR SELECT USING (true);

-- Tout le monde peut lire les role_permissions (pour l'UI)
CREATE POLICY "Public read role_permissions" ON role_permissions
    FOR SELECT USING (true);

-- ================================================
-- 9. INDEX POUR PERFORMANCES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_users_role_level ON users(role_level);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

-- ================================================
-- MIGRATION TERMINÉE ! ✅
-- ================================================
-- Le système de rôles et permissions est maintenant en place
-- 
-- Rôles disponibles :
-- - super_admin : Accès total
-- - admin : Gestion complète sauf utilisateurs
-- - secretary_general : Gestion documents + stats tous
-- - secretary : Gestion de ses documents
-- - assistant : Permissions limitées
-- - guest : Lecture seule
-- 
-- Prochaine étape : Mettre à jour le code TypeScript
