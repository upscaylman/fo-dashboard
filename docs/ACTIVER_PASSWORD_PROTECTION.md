# 🔒 Activer la Protection des Mots de Passe Divulgués

## ⚠️ Warning Supabase Détecté

```
auth_leaked_password_protection: Leaked password protection disabled
```

## 📋 Qu'est-ce que c'est ?

La **Leaked Password Protection** vérifie automatiquement si les mots de passe choisis par vos utilisateurs ont été compromis dans des fuites de données connues (via [HaveIBeenPwned.org](https://haveibeenpwned.com/)).

## ✅ Pourquoi l'activer ?

- **Sécurité** : Empêche l'utilisation de mots de passe déjà compromis
- **Protection utilisateurs** : Évite que vos utilisateurs réutilisent des mots de passe fuités
- **Bonne pratique** : Recommandé par Supabase pour la production

## 🚀 Comment l'activer

### Méthode 1 : Via Supabase Dashboard (Recommandé)

1. Connecte-toi à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet : **fo-metaux-dashboard**
3. Va dans **Authentication** (icône clé) dans le menu de gauche
4. Clique sur **Policies** dans le sous-menu
5. Trouve la section **Password Protection**
6. Active le toggle **Enable Leaked Password Protection**
7. Clique sur **Save** pour confirmer

### Méthode 2 : Via Supabase CLI

```bash
# Si tu as Supabase CLI installé
supabase auth update --enable-leaked-password-protection
```

## 🎯 Résultat Attendu

Une fois activé :
- ✅ Les utilisateurs ne pourront plus utiliser de mots de passe compromis
- ✅ Le warning Supabase `auth_leaked_password_protection` disparaîtra
- ✅ Message d'erreur automatique si mot de passe fuité : *"This password has been compromised in a data breach"*

## 📝 Notes Importantes

### Pour les utilisateurs existants

Les utilisateurs actuels **ne seront pas affectés** - la vérification s'applique uniquement :
- Lors de l'inscription de nouveaux utilisateurs
- Lors du changement de mot de passe

### Authentification OAuth (Outlook)

Cette protection ne concerne **que les comptes email/password**. Les utilisateurs qui se connectent via **Outlook OAuth** ne sont pas concernés (ils n'ont pas de mot de passe dans ta base).

### Impact sur l'UX

- Temps de vérification : **< 100ms** (API HaveIBeenPwned est très rapide)
- Aucun impact perceptible pour l'utilisateur
- Message d'erreur clair si mot de passe refusé

## 🔍 Vérification

Après activation, teste avec un mot de passe connu pour être compromis :

```
password123
qwerty
123456
```

Tu devrais recevoir une erreur de refus.

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs/guides/auth/auth-password-protection)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**Status** : ⚠️ À activer manuellement dans Supabase Dashboard  
**Priorité** : Moyenne (recommandé pour production)  
**Temps** : ~2 minutes
