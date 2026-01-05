# Trouver les Permissions Mail dans Azure

## 🔍 Vous Voyez d'Autres Permissions

Vous êtes dans la liste des permissions Microsoft Graph, mais vous voyez des catégories comme :
- CallDelegation
- DelegatedAdminRelationship
- etc.

**C'est normal !** Il y a beaucoup de permissions. Il faut chercher celles qui commencent par **"Mail"**.

---

## ✅ Solution : Chercher les Permissions Mail

### Méthode 1 : Utiliser la Recherche

1. **Dans la fenêtre des permissions**, regardez s'il y a une **barre de recherche** en haut
2. **Tapez** : `Mail`
3. **Les permissions Mail apparaîtront** dans les résultats :
   - `Mail.Read` (Lire le courrier)
   - `Mail.Send` (Envoyer le courrier)
   - `Mail.ReadWrite` (Lire et écrire)
   - etc.

### Méthode 2 : Scroller dans la Liste

1. **Scrollez vers le bas** dans la liste des permissions
2. **Cherchez la section "Mail"** ou les permissions qui commencent par "Mail."
3. **Vous devriez voir** :
   - **Mail.Read** : "Read user mail"
   - **Mail.Send** : "Send mail"
   - etc.

### Méthode 3 : Utiliser Ctrl+F (Recherche dans la page)

1. **Appuyez sur Ctrl+F** (ou Cmd+F sur Mac)
2. **Tapez** : `Mail.Read` ou juste `Mail`
3. **Naviguez** dans les résultats trouvés

### Méthode 4 : Filtrer par Catégorie

Si vous voyez des **filtres ou catégories** dans l'interface :
1. **Cherchez la catégorie "Mail"** ou "Email"
2. **Cliquez dessus** pour filtrer

---

## 📋 Permissions à Sélectionner

Une fois que vous trouvez les permissions Mail, **cochez** :

✅ **Mail.Read** 
   - Description : "Read user mail"
   - Permet de lire les emails

✅ **Mail.Send**
   - Description : "Send mail"
   - Permet d'envoyer des emails

✅ **User.Read** 
   - Pour lire le profil utilisateur
   - Si vous ne la voyez pas, cherchez "User" dans la liste

---

## 🎯 Étapes Complètes

1. **Dans la fenêtre des permissions**, utilisez une des méthodes ci-dessus
2. **Trouvez et cochez** :
   - ✅ Mail.Read
   - ✅ Mail.Send
   - ✅ User.Read (optionnel mais recommandé)
3. **Cliquez sur "Add permissions"** (Ajouter les autorisations) en bas
4. **Retournez à la liste des permissions**
5. **Vérifiez** que les 3 permissions apparaissent maintenant dans la liste
6. **Si vous voyez "Grant admin consent for [organisation]"** :
   - **Cliquez dessus**
   - **Acceptez** (cela accorde les permissions)

---

## 🐛 Si Vous Ne Trouvez Pas Mail

### Vérification 1 : Êtes-vous dans les Bonnes Permissions ?

Vous devez être dans :
- **Microsoft Graph** (pas autre chose)
- **Delegated permissions** (pas Application permissions)

### Vérification 2 : Cherchez "Email" au lieu de "Mail"

Parfois les permissions peuvent être sous "Email" :
- Tapez `Email` dans la recherche
- Ou cherchez `Email.Read`, `Email.Send`

### Vérification 3 : Vérifiez les Filtres

Assurez-vous qu'aucun filtre ne masque les permissions Mail.

---

## 💡 Astuce

**Les permissions les plus utilisées sont souvent groupées ensemble.** Si vous trouvez une permission Mail, les autres (Mail.Read, Mail.Send) sont généralement juste à côté.

---

## ✅ Une Fois les Permissions Sélectionnées

Après avoir :
- ✅ Coché Mail.Read
- ✅ Coché Mail.Send  
- ✅ Coché User.Read
- ✅ Cliqué sur "Add permissions"

Vous devriez voir ces 3 permissions dans votre liste. Ensuite :

1. **Cliquez sur "Grant admin consent"** si disponible
2. **Acceptez**
3. **Vous êtes prêt !**

---

**Utilisez la recherche ou scrollez dans la liste pour trouver Mail.Read et Mail.Send !** 🔍

