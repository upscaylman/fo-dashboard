-- ================================================
-- MISE À JOUR RLS : GESTION DES UTILISATEURS
-- ================================================

-- 1. Permettre aux admins de supprimer des utilisateurs
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role_level IN ('super_admin', 'admin')
        )
    );

-- 2. Permettre aux admins d'insérer des utilisateurs (si besoin de créer manuellement)
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role_level IN ('super_admin', 'admin')
        )
    );

-- 3. Permettre aux admins de modifier tous les profils
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role_level IN ('super_admin', 'admin')
        )
    );
