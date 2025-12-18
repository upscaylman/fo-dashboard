-- ================================================================
-- MIGRATION : Ajouter file_url à la table docease_documents
-- ================================================================
-- Cette migration ajoute la colonne file_url pour stocker les URLs
-- des fichiers Word/PDF générés par DocEase dans Supabase Storage
-- 
-- Date: 2025-12-18
-- Description: Permet le téléchargement direct des documents depuis le dashboard
-- ================================================================

-- Vérifier si la colonne existe déjà (pour éviter les erreurs)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'docease_documents' 
        AND column_name = 'file_url'
    ) THEN
        -- Ajouter la colonne file_url (nullable car les anciens documents n'ont pas de fichier)
        ALTER TABLE docease_documents 
        ADD COLUMN file_url TEXT;
        
        RAISE NOTICE 'Colonne file_url ajoutée à docease_documents';
    ELSE
        RAISE NOTICE 'Colonne file_url existe déjà dans docease_documents';
    END IF;
END $$;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_docease_documents_file_url 
ON docease_documents(file_url) 
WHERE file_url IS NOT NULL;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN docease_documents.file_url IS 
'URL du fichier Word/PDF stocké dans Supabase Storage (bucket: docease-files)';

-- ================================================================
-- BUCKET STORAGE POUR LES FICHIERS DOCEASE (Optionnel)
-- ================================================================
-- Si vous souhaitez stocker les fichiers DocEase dans Supabase Storage,
-- créez un bucket avec les commandes suivantes :

-- Créer le bucket (si nécessaire)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'docease-files',
  'docease-files',
  true, -- Public pour permettre le téléchargement direct
  52428800, -- 50 MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'application/pdf', -- .pdf
    'application/msword' -- .doc (legacy)
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy : Tout le monde peut lire les fichiers DocEase
CREATE POLICY IF NOT EXISTS "Public read access for docease files"
ON storage.objects FOR SELECT
USING (bucket_id = 'docease-files');

-- Policy : Seuls les admins et super_admins peuvent uploader
CREATE POLICY IF NOT EXISTS "Admins can upload docease files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'docease-files' 
  AND auth.uid() IN (
    SELECT id FROM users 
    WHERE role_level IN ('admin', 'super_admin')
  )
);

-- Policy : Seuls les admins et super_admins peuvent supprimer
CREATE POLICY IF NOT EXISTS "Admins can delete docease files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'docease-files' 
  AND auth.uid() IN (
    SELECT id FROM users 
    WHERE role_level IN ('admin', 'super_admin')
  )
);

-- ================================================================
-- INSTRUCTIONS
-- ================================================================
-- Pour utiliser cette migration :
-- 
-- 1. Ouvrez Supabase Dashboard : https://supabase.com/dashboard/project/geljwonckfmdkaywaxly
-- 2. Allez dans SQL Editor
-- 3. Copiez et collez ce script
-- 4. Exécutez-le
-- 
-- Pour que DocEase stocke les fichiers :
-- 1. Modifiez le workflow DocEase pour uploader les fichiers dans le bucket 'docease-files'
-- 2. Récupérez l'URL publique : supabase.storage.from('docease-files').getPublicUrl(fileName)
-- 3. Incluez cette URL dans le champ file_url lors de l'insertion dans docease_documents
-- 
-- Exemple d'insertion avec file_url :
-- INSERT INTO docease_documents (user_email, document_type, title, metadata, file_url)
-- VALUES (
--   'user@example.com',
--   'designation',
--   'Document_Test.docx',
--   '{"format": "docx"}',
--   'https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/public/docease-files/Document_Test.docx'
-- );
-- ================================================================
