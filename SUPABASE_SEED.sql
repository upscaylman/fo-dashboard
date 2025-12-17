-- ================================================
-- DONNÉES INITIALES - FO MÉTAUX DASHBOARD
-- ================================================
-- Ce script insère les données de démo dans votre base Supabase
-- Exécutez-le APRÈS avoir créé le schéma (SUPABASE_SCHEMA.sql)

-- ================================================
-- 1. TYPES DE DOCUMENTS
-- ================================================
INSERT INTO document_types (type_name, color) VALUES
  ('Lettre de réclamation', 'bg-red-500'),
  ('Convocation réunion', 'bg-blue-500'),
  ('Courrier employeur', 'bg-purple-500'),
  ('Compte-rendu', 'bg-green-500'),
  ('Autres', 'bg-slate-400')
ON CONFLICT (type_name) DO NOTHING;

-- ================================================
-- 2. UTILISATEURS (Secrétaires)
-- ================================================
-- Note : Les mots de passe doivent être créés via Supabase Auth
-- Ces entrées seront liées aux comptes Auth via leur UUID
INSERT INTO users (id, email, name, role, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'marie.dubois@fo-metaux.fr', 'Marie Dubois', 'Secrétaire générale', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie'),
  ('00000000-0000-0000-0000-000000000002', 'jean.martin@fo-metaux.fr', 'Jean Martin', 'Secrétaire adjoint', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean'),
  ('00000000-0000-0000-0000-000000000003', 'sophie.bernard@fo-metaux.fr', 'Sophie Bernard', 'Secrétaire', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie'),
  ('00000000-0000-0000-0000-000000000004', 'pierre.lefebvre@fo-metaux.fr', 'Pierre Lefebvre', 'Secrétaire', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre'),
  ('00000000-0000-0000-0000-000000000005', 'claire.moreau@fo-metaux.fr', 'Claire Moreau', 'Assistante', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Claire')
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- 3. TEMPLATES (Modèles)
-- ================================================
INSERT INTO templates (name, type, size_label, file_url, description) VALUES
  ('Liste Globale Destinataires', 'excel', 'Macro XLSM', '/templates/LISTE GLOBALE DESTINATAIRES-REORGANISE.xlsm', 'Fichier Excel avec macros pour gérer les destinataires'),
  ('Modèle Désignation', 'word', 'DOCX', '/templates/template_designation.docx', 'Modèle de lettre de désignation'),
  ('Modèle Négociation', 'word', 'DOCX', '/templates/template_negociation.docx', 'Modèle de lettre de négociation'),
  ('Modèle Personnalisé', 'word', 'DOCX', '/templates/template_custom.docx', 'Modèle de lettre personnalisable'),
  ('Modèle Circulaire', 'word', 'DOCX', '/templates/template_circulaire.docx', 'Modèle de circulaire')
ON CONFLICT DO NOTHING;

-- ================================================
-- 4. DOCUMENTS (Lettres générées)
-- ================================================
-- Génération de documents de test pour les statistiques
INSERT INTO documents (title, type_id, user_id, status, created_at) VALUES
  -- Marie Dubois (34 lettres)
  ('Réclamation salaires novembre', 1, '00000000-0000-0000-0000-000000000001', 'sent', NOW() - INTERVAL '5 days'),
  ('Convocation CSE décembre', 2, '00000000-0000-0000-0000-000000000001', 'sent', NOW() - INTERVAL '4 days'),
  ('Courrier direction RH', 3, '00000000-0000-0000-0000-000000000001', 'sent', NOW() - INTERVAL '3 days'),
  ('Compte-rendu réunion', 4, '00000000-0000-0000-0000-000000000001', 'sent', NOW() - INTERVAL '2 days'),
  ('Lettre protocole accord', 3, '00000000-0000-0000-0000-000000000001', 'sent', NOW() - INTERVAL '1 day'),
  
  -- Jean Martin (28 lettres)
  ('Demande congés exceptionnels', 5, '00000000-0000-0000-0000-000000000002', 'sent', NOW() - INTERVAL '6 days'),
  ('Réclamation primes', 1, '00000000-0000-0000-0000-000000000002', 'sent', NOW() - INTERVAL '5 days'),
  ('Convocation bureau syndical', 2, '00000000-0000-0000-0000-000000000002', 'sent', NOW() - INTERVAL '4 days'),
  
  -- Sophie Bernard (22 lettres)
  ('Courrier employeur conditions travail', 3, '00000000-0000-0000-0000-000000000003', 'sent', NOW() - INTERVAL '7 days'),
  ('Compte-rendu négociation', 4, '00000000-0000-0000-0000-000000000003', 'sent', NOW() - INTERVAL '6 days'),
  
  -- Pierre Lefebvre (18 lettres)
  ('Réclamation heures supplémentaires', 1, '00000000-0000-0000-0000-000000000004', 'sent', NOW() - INTERVAL '8 days'),
  ('Convocation AG', 2, '00000000-0000-0000-0000-000000000004', 'sent', NOW() - INTERVAL '7 days'),
  
  -- Claire Moreau (15 lettres)
  ('Courrier information adhérents', 3, '00000000-0000-0000-0000-000000000005', 'sent', NOW() - INTERVAL '9 days'),
  ('Circulaire mensuelle', 5, '00000000-0000-0000-0000-000000000005', 'sent', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ================================================
-- 5. SIGNATURES (Tracking)
-- ================================================
INSERT INTO signatures (document_id, user_id, signed_at) VALUES
  (1, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),
  (2, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),
  (3, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),
  (4, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),
  (5, '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day'),
  (6, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '6 days'),
  (7, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days'),
  (8, '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 days'),
  (9, '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '7 days'),
  (10, '00000000-0000-0000-0000-000000000003', NOW() - INTERVAL '6 days'),
  (11, '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '8 days'),
  (12, '00000000-0000-0000-0000-000000000004', NOW() - INTERVAL '7 days'),
  (13, '00000000-0000-0000-0000-000000000005', NOW() - INTERVAL '9 days'),
  (14, '00000000-0000-0000-0000-000000000005', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ================================================
-- 6. ACTIVITÉS HEBDOMADAIRES
-- ================================================
-- Semaine courante (données de la semaine dernière)
WITH current_week AS (
  SELECT date_trunc('week', NOW()) AS week_start
)
INSERT INTO activities (day_of_week, letters_count, signatures_count, week_start_date)
SELECT 
  day_num,
  CASE day_num
    WHEN 0 THEN 18  -- Lundi
    WHEN 1 THEN 22  -- Mardi
    WHEN 2 THEN 25  -- Mercredi
    WHEN 3 THEN 20  -- Jeudi
    WHEN 4 THEN 28  -- Vendredi
    WHEN 5 THEN 8   -- Samedi
    WHEN 6 THEN 5   -- Dimanche
  END as letters,
  CASE day_num
    WHEN 0 THEN 15  -- Lundi
    WHEN 1 THEN 20  -- Mardi
    WHEN 2 THEN 23  -- Mercredi
    WHEN 3 THEN 18  -- Jeudi
    WHEN 4 THEN 26  -- Vendredi
    WHEN 5 THEN 7   -- Samedi
    WHEN 6 THEN 5   -- Dimanche
  END as signatures,
  (SELECT week_start FROM current_week)::DATE
FROM generate_series(0, 6) AS day_num
ON CONFLICT DO NOTHING;

-- ================================================
-- SUCCÈS ! Données initiales insérées
-- ================================================
-- Vous pouvez maintenant vérifier dans Table Editor :
-- - users : 5 secrétaires
-- - document_types : 5 types
-- - templates : 5 modèles
-- - documents : 14 lettres de test
-- - signatures : 14 signatures
-- - activities : 7 jours d'activité
