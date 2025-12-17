-- ================================================
-- FORCER LESdroits SUPER ADMIN (V3 Infaillible)
-- ================================================

-- 1. D'abord, on s'assure que les utilisateurs existent dans la table publique
-- (Copie depuis auth.users vers public.users s'ils manquent)
INSERT INTO public.users (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
WHERE email IN (
  'contact@fo-metaux.fr',
  'aguillermin@fo-metaux.fr',
  'vrodriguez@fo-metaux.fr',
  'bouvier.jul@gmail.com'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Ensuite, on force le rôle sur ces 4 utilisateurs
UPDATE public.users 
SET role_level = 'super_admin'
WHERE email IN (
  'contact@fo-metaux.fr',
  'aguillermin@fo-metaux.fr',
  'vrodriguez@fo-metaux.fr',
  'bouvier.jul@gmail.com'
);

-- 3. Vérification finale
SELECT email, role_level, id 
FROM public.users 
WHERE email IN (
  'contact@fo-metaux.fr',
  'aguillermin@fo-metaux.fr',
  'vrodriguez@fo-metaux.fr',
  'bouvier.jul@gmail.com'
);
