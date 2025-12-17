-- ================================================
-- TRIGGER : ATTRIBUTION AUTOMATIQUE DES RÔLES (V2)
-- ================================================

-- 1. Fonction qui définit le rôle selon l'email
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
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

-- 2. Trigger qui s'exécute AVANT l'insertion
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();

-- 3. Fonction pour créer automatiquement le profil public
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
