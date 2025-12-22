-- ================================================
-- POLITIQUE D'ACCÈS PAR RÔLE - FO MÉTAUX DASHBOARD
-- ================================================
-- Ce fichier documente les politiques RLS pour tous les rôles
-- Créé le 22/12/2025 - Mis à jour le 22/12/2025

-- ================================================
-- HIÉRARCHIE DES RÔLES
-- ================================================
-- 1. super_admin (niveau 4) - Accès total, toutes fonctionnalités
-- 2. secretary_general (niveau 3) - Accès étendu, peut voir tous les documents
-- 3. secretary_federal (niveau 2) - Accès à SES PROPRES données uniquement
-- 4. secretary (niveau 1) - Accès à SES PROPRES données uniquement

-- ================================================
-- RÉSUMÉ DES ACCÈS PAR RÔLE
-- ================================================

-- ┌─────────────────────┬─────────────┬──────────────────┬──────────────────┬───────────┐
-- │ Ressource           │ super_admin │ secretary_general│ secretary_federal│ secretary │
-- ├─────────────────────┼─────────────┼──────────────────┼──────────────────┼───────────┤
-- │ Users (lecture)     │ ✅ Tous      │ ✅ Tous           │ ✅ Tous           │ ✅ Tous    │
-- │ Users (modification)│ ✅ Tous      │ ❌ Soi-même       │ ❌ Soi-même       │ ❌ Soi-même│
-- │ Documents           │ ✅ Tous      │ ✅ Tous           │ ⚠️ Ses propres   │ ⚠️ Ses propres│
-- │ DocEase Documents   │ ✅ Tous      │ ✅ Tous           │ ⚠️ Ses propres   │ ⚠️ Ses propres│
-- │ Signatures          │ ✅ Tous      │ ✅ Tous           │ ⚠️ Ses propres   │ ⚠️ Ses propres│
-- │ SignEase Activity   │ ✅ Tous      │ ✅ Tous           │ ⚠️ Ses propres   │ ⚠️ Ses propres│
-- │ Bookmarks           │ ✅ Tous      │ ⚠️ Ses propres   │ ⚠️ Ses propres   │ ⚠️ Ses propres│
-- │ Notifications       │ ✅ Tous      │ ✅ Tous           │ ⚠️ Ses propres   │ ⚠️ Ses propres│
-- │ Active Sessions     │ ✅ Tous      │ ✅ Tous           │ ⚠️ Sa session    │ ⚠️ Sa session│
-- │ Templates           │ ✅ Gestion   │ ✅ Gestion        │ 📖 Lecture       │ 📖 Lecture │
-- │ Shared Documents    │ ✅ Gestion   │ 📖 Lecture        │ 📖 Lecture       │ 📖 Lecture │
-- │ Stats Globales      │ ✅ Oui       │ ✅ Oui            │ ❌ Non           │ ❌ Non     │
-- │ Onglet DocEase      │ ✅ Visible   │ ✅ Visible        │ ❌ Masqué        │ ❌ Masqué  │
-- │ Onglet SignEase     │ ✅ Visible   │ ✅ Visible        │ ❌ Masqué        │ ❌ Masqué  │
-- └─────────────────────┴─────────────┴──────────────────┴──────────────────┴───────────┘

-- ✅ = Accès complet
-- ⚠️ = Accès limité (ses propres données)
-- ❌ = Pas d'accès ou lecture seule
-- 📖 = Lecture seule

-- ================================================
-- FONCTIONNALITÉS SUPER ADMIN DANS L'INTERFACE
-- ================================================
-- 
-- 📊 TABLEAU DE BORD
--   - Vue globale des statistiques de tous les utilisateurs
--   - Widget utilisateurs actifs en temps réel
--   - Indicateur de stockage global
--
-- 👥 GESTION DES UTILISATEURS
--   - Liste de tous les utilisateurs avec statistiques
--   - Bouton "Voir les données" (icône graphique) - Affiche le modal de détails
--   - Bouton "Se connecter en tant que" (icône œil) - Impersonation
--   - Modification des rôles de tous les utilisateurs
--   - Suppression d'utilisateurs
--   - Création de nouveaux utilisateurs
--
-- 📄 DOCUMENTS DOCEASE
--   - Visualisation de tous les documents générés
--   - Téléchargement de tous les fichiers
--   - Filtrage par utilisateur, type, format
--
-- ✍️ ACTIVITÉS SIGNEASE  
--   - Suivi de toutes les signatures envoyées/reçues
--   - Historique complet par utilisateur
--
-- ⚙️ PROFIL - ADMINISTRATION
--   - Purge des données par section (DocEase, signatures, favoris, etc.)
--   - Nettoyage du stockage

-- ================================================
-- POLITIQUES RLS APPLIQUÉES
-- ================================================

-- Les politiques suivantes ont été créées pour garantir l'accès super_admin:

-- 1. BOOKMARKS
-- CREATE POLICY "Super admin can read all bookmarks" ON bookmarks FOR SELECT
-- CREATE POLICY "Super admin can manage all bookmarks" ON bookmarks FOR ALL

-- 2. DOCEASE_DOCUMENTS  
-- CREATE POLICY "Super admin can access all docease documents" ON docease_documents FOR ALL

-- 3. NOTIFICATIONS
-- CREATE POLICY "Super admin full access to notifications" ON notifications FOR ALL

-- 4. SIGNATURES
-- CREATE POLICY "Super admin full access to signatures" ON signatures FOR ALL

-- 5. DOCUMENTS
-- CREATE POLICY "Super admin full access to documents" ON documents FOR ALL

-- 6. ACTIVITIES
-- CREATE POLICY "Super admin full access to activities" ON activities FOR ALL

-- 7. ACTIVE_SESSIONS
-- CREATE POLICY "Super admin can view all sessions" ON active_sessions FOR SELECT

-- 8. SIGNEASE_ACTIVITY
-- CREATE POLICY "Super admin full access to signease" ON signease_activity FOR ALL

-- 9. SHARED_DOCUMENTS
-- CREATE POLICY "Super admin full access to shared_documents" ON shared_documents FOR ALL

-- 10. TEMPLATES
-- CREATE POLICY "Super admin full access to templates" ON templates FOR ALL

-- 11. USERS (déjà existant)
-- "Admins can delete users", "Admins can insert users", "Admins can update users"

-- ================================================
-- VÉRIFICATION DES ACCÈS
-- ================================================
-- Pour vérifier que les politiques sont bien appliquées:

-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND (policyname ILIKE '%super%' OR policyname ILIKE '%admin%')
-- ORDER BY tablename;

-- ================================================
-- NOTES DE SÉCURITÉ
-- ================================================
-- - L'impersonation (voir en tant que) ne modifie PAS la session Supabase
-- - Le super_admin garde ses permissions RLS même en mode impersonation
-- - Les données sont récupérées via les politiques RLS côté serveur
-- - Le client ne peut pas contourner les politiques RLS

