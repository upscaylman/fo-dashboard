# Gestion des Rôles Automatique

Ce fichier contient la logique pour l'attribution automatique des rôles lors de l'inscription.
Il définit quel email reçoit quel rôle.

**Pour mettre à jour les règles :**
1. Modifiez ce fichier SQL
2. Copiez-collez tout le contenu dans Supabase SQL Editor
3. Exécutez !

```sql
-- ================================================
-- TRIGGER : ATTRIBUTION AUTOMATIQUE DES RÔLES
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. SUPER ADMINS (Accès total)
  IF new.email IN (
    'contact@fo-metaux.fr',
    'aguillermin@fo-metaux.fr',
    'vrodriguez@fo-metaux.fr',
    'bouvier.jul@gmail.com'
  ) THEN
    new.role_level := 'super_admin';
    
  -- 2. ADMINS
  ELSIF new.email IN (
    'admin@fo-metaux.fr'
  ) THEN
    new.role_level := 'admin';

  -- 3. SECRÉTAIRES GÉNÉRAUX
  ELSIF new.email IN (
    'sg@fo-metaux.fr'
  ) THEN
    new.role_level := 'secretary_general';
    
  -- 4. ASSISTANTS
  ELSIF new.email IN (
    'assistant@fo-metaux.fr'
  ) THEN
    new.role_level := 'assistant';
    
  -- 5. INVITÉS
  ELSIF new.email IN (
    'invite@fo-metaux.fr'
  ) THEN
    new.role_level := 'guest';
    
  -- 6. DÉFAUT : SECRÉTAIRE
  -- Tout le monde reçoit ce rôle par défaut s'il n'est pas listé ci-dessus
  ELSE
    new.role_level := 'secretary';
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger (Ne pas modifier)
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_role();
```
