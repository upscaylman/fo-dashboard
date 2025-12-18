-- Migration: Création du bucket de stockage pour les documents partagés
-- Date: 2025-12-17

-- Créer le bucket pour les documents partagés (si pas déjà créé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared-documents',
  'shared-documents',
  true,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/avi',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Tous les utilisateurs authentifiés peuvent lire les fichiers
CREATE POLICY "Public read access for shared documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'shared-documents');

-- Policy: Admins et super_admins peuvent uploader
CREATE POLICY "Admins can upload shared documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shared-documents'
  AND auth.uid() IN (
    SELECT id FROM users WHERE role_level IN ('admin', 'super_admin')
  )
);

-- Policy: Admins et super_admins peuvent supprimer
CREATE POLICY "Admins can delete shared documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shared-documents'
  AND auth.uid() IN (
    SELECT id FROM users WHERE role_level IN ('admin', 'super_admin')
  )
);

-- Policy: Admins et super_admins peuvent mettre à jour
CREATE POLICY "Admins can update shared documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shared-documents'
  AND auth.uid() IN (
    SELECT id FROM users WHERE role_level IN ('admin', 'super_admin')
  )
);

COMMENT ON TABLE storage.buckets IS 'Buckets de stockage pour les fichiers';
