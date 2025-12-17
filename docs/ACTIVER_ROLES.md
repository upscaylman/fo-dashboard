# 🚀 Instructions Rapides - Activation du Système de Rôles

## ✅ Étape 1 : Assignez-vous le Rôle Super Admin

Dans Supabase SQL Editor, exécutez :

```sql
-- 1. Voir vos utilisateurs
SELECT id, email, name, role_level FROM users;

-- 2. Assignez-vous le rôle super_admin
-- REMPLACEZ l'email par le vôtre !
UPDATE users 
SET role_level = 'super_admin'
WHERE email = 'votre.email@fo-metaux.fr';

-- 3. Vérifiez que ça a marché
SELECT email, role_level FROM users WHERE email = 'votre.email@fo-metaux.fr';
```

## ✅ Étape 2 : Redémarrer le Serveur

Dans le terminal :
1. Appuyez sur **Ctrl+C** pour arrêter
2. Tapez : `npm run dev`
3. Attendez que ça démarre

## ✅ Étape 3 : Tester

1. Allez sur http://localhost:4081/
2. Déconnectez-vous
3. Reconnectez-vous
4. Votre badge de rôle devrait apparaître !

---

**Une fois fait, dites-moi "c'est fait" et on vérifiera ensemble !**
