-- ================================================
-- CORRECTION DES WARNINGS DE SÉCURITÉ SUPABASE
-- ================================================
-- Ce script corrige les 5 fonctions avec search_path mutable
-- Pour appliquer : Copier-coller dans Supabase SQL Editor
-- Date : 2025-12-17

-- ================================================
-- 1. FIX : update_updated_at_column()
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. FIX : assign_permission_to_role()
-- ================================================
CREATE OR REPLACE FUNCTION assign_permission_to_role(role_name user_role, permission_name TEXT)
RETURNS VOID 
SET search_path = public
AS $$
BEGIN
  INSERT INTO role_permissions (role, permission_id)
  SELECT role_name, id FROM permissions WHERE name = permission_name
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 3. FIX : has_permission()
-- ================================================
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN 
SET search_path = public
AS $$
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
-- 4. FIX : handle_new_user_role()
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  -- ================================================
  -- RÈGLES D'ATTRIBUTION DES RÔLES
  -- ================================================
  
  -- 1. SUPER ADMINS (Accès total)
  IF new.email IN (
    'contact@fo-metaux.fr',
    'aguillermin@fo-metaux.fr',
    'vrodriguez@fo-metaux.fr',
    'bouvier.jul@gmail.com'
  ) THEN
    new.role_level := 'super_admin';
    
  -- 2. ADMINS (À compléter si besoin)
  ELSIF new.email IN (
    'admin@fo-metaux.fr' -- Exemple
  ) THEN
    new.role_level := 'admin';

  -- 3. SECRÉTAIRES GÉNÉRAUX (À compléter si besoin)
  ELSIF new.email IN (
    'sg@fo-metaux.fr' -- Exemple
  ) THEN
    new.role_level := 'secretary_general';
    
  -- 4. ASSISTANTS (À compléter si besoin)
  ELSIF new.email IN (
    'assistant@fo-metaux.fr' -- Exemple
  ) THEN
    new.role_level := 'assistant';
    
  -- 5. INVITÉS (À compléter si besoin)
  ELSIF new.email IN (
    'invite@fo-metaux.fr' -- Exemple
  ) THEN
    new.role_level := 'guest';
    
  -- 6. DÉFAUT : SECRÉTAIRE
  -- Tout autre utilisateur authentifié reçoit ce rôle standard
  ELSE
    new.role_level := 'secretary';
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 5. FIX : handle_new_user()
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- ✅ CORRECTION TERMINÉE !
-- ================================================
-- Les 5 fonctions ont été mises à jour avec SET search_path = public
-- 
-- Vérification :
-- 1. Allez dans Supabase → Database → Advisors
-- 2. Les warnings "function_search_path_mutable" devraient disparaître
-- 
-- Prochaine étape :
-- Activer la protection des mots de passe divulgués :
-- → Supabase Dashboard → Authentication → Policies
-- → Enable "Leaked Password Protection"
