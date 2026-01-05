# Modifier le Workflow pour Utiliser SMTP au lieu d'OAuth2

## 🔄 Solution Simple : Utiliser SMTP pour Tout

Si vous préférez ne pas utiliser OAuth2/Azure, vous pouvez modifier le workflow pour utiliser SMTP Office 365 (que vous avez déjà configuré) pour l'envoi final.

---

## 📝 Modifications dans n8n

### Étape 1 : Ouvrir le Workflow

1. Dans n8n, ouvrez le workflow **"Générateur Document avec Validation (Ollama)"**

### Étape 2 : Modifier le Nœud d'Envoi Final

**Option A - Remplacer le Nœud Outlook** :

1. **Trouvez le nœud "Envoyer via Outlook"** (après le nœud "Approuvé ?")
2. **Supprimez-le** (clic droit → Delete) ou **désactivez-le**
3. **Ajoutez un nouveau nœud "Email Send"** :
   - Cliquez sur "+" après le nœud "Approuvé ?" (branche True/green)
   - Cherchez "Email Send"
   - Ajoutez-le

**Option B - Modifier le Nœud Existant** :

1. **Cliquez sur le nœud "Envoyer via Outlook"**
2. **Cherchez dans les options** pour changer le type de credential
3. Si possible, changez pour utiliser SMTP au lieu d'OAuth2

---

### Étape 3 : Configurer le Nœud Email Send

1. **Cliquez sur le nouveau nœud "Email Send"**
2. **Configurez** :
   - **Credential** : Sélectionnez votre credential **SMTP Office 365**
   - **To** : `={{ $('Formater Données').item.json.emails_destinataires.split(',').map(e => e.trim()).join(',') }}`
     - Ou si un seul destinataire : `={{ $('Formater Données').item.json.emails_destinataires.split(',')[0].trim() }}`
   - **Subject** : `={{ 'Document : ' + $('Formater Données').item.json.contexte }}`
   - **Message** : 
     ```
     =Bonjour {{ $('Formater Données').item.json.nom_destinataire }},
     
     {{ $('Extraire Texte IA').item.json.texte_ia }}
     
     Points importants :
     {{ $('Formater Données').item.json.points_importants }}
     
     Cordialement,
     ```
   - **Attachments** :
     - Property : `data`
     - File Name : `={{ $('Nommer Document').item.json.fileName }}`

3. **Sauvegardez** le nœud

---

### Étape 4 : Connecter au Workflow

1. **Le nœud Email Send** doit être connecté à la **branche "True"** du nœud "Approuvé ?"
2. **Après Email Send**, connectez au nœud **"Confirmation Succès"** (qui existe déjà)

**Structure finale** :
```
Approuvé ? (IF)
  ├─ True (green) → Email Send → Confirmation Succès
  └─ False (red) → Confirmation Refus
```

---

### Étape 5 : Supprimer les Nœuds Inutiles

Si vous gardez le nœud "Envoyer via Outlook" (inutilisé), vous pouvez le supprimer pour garder le workflow propre.

---

## ✅ Résultat

Après modification :

- ✅ **Email de validation** : SMTP Office 365 (déjà configuré)
- ✅ **Envoi final** : SMTP Office 365 (même credential)
- ✅ **Pas besoin d'OAuth2/Azure**
- ✅ **Tout fonctionne avec SMTP**

---

## 🧪 Tester

1. **Activez le workflow** (toggle vert)
2. **Testez avec le formulaire**
3. **Vérifiez** que :
   - Email de validation arrive (SMTP)
   - Document final est envoyé (SMTP) après validation

---

## 📋 Checklist

- [ ] Nœud "Envoyer via Outlook" remplacé par "Email Send"
- [ ] "Email Send" configuré avec credential SMTP Office 365
- [ ] To, Subject, Message, Attachments configurés
- [ ] Connecté à la branche True de "Approuvé ?"
- [ ] Workflow testé et fonctionnel

---

## 💡 Avantages de SMTP

- ✅ Simple (pas besoin d'Azure)
- ✅ Déjà configuré (vous avez déjà le credential SMTP)
- ✅ Fonctionne immédiatement
- ✅ Parfait pour usage interne

---

**C'est une solution plus simple et qui fonctionne tout aussi bien pour votre cas d'usage !** 🚀

