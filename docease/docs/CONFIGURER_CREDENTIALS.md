# Guide : Configurer les Credentials dans n8n

Guide complet pour configurer tous les credentials nécessaires au workflow.

## 📋 Credentials Nécessaires

Pour le workflow complet, vous avez besoin de **2 credentials** :

1. ✅ **SMTP** : Pour envoyer l'email de validation
2. ✅ **Microsoft Outlook** : Pour envoyer le document final au destinataire

**Note importante** :
- ❌ **Docxtemplater** : Pas besoin de credential réel (vous pouvez ignorer le cadenas ou créer un credential vide)
- ❌ **Ollama** : Pas besoin de credential (HTTP Request direct)

---

## 🔐 Credential 1 : SMTP (Email de Validation)

### Pour Gmail

1. **Dans n8n** → **Settings** → **Credentials** → **Add Credential**
2. **Cherchez "SMTP"** → Sélectionnez-le
3. **Configurez** :
   - **Name** : `SMTP Gmail` (ou le nom que vous voulez)
   - **Host** : `smtp.gmail.com`
   - **Port** : `587`
   - **User** : Votre adresse Gmail complète (ex: `votre.email@gmail.com`)
   - **Password** : ⚠️ **Mot de passe d'application** (PAS votre mot de passe Gmail normal)
   - **Secure** : `false` (TLS)
4. **Cliquez sur "Save"**

#### Créer un Mot de Passe d'Application Gmail

1. Allez sur https://myaccount.google.com/
2. **Sécurité** → **Validation en deux étapes** (doit être activée)
3. **Mots de passe des applications** → **Créer un nouveau mot de passe**
4. **Nom** : `n8n` (ou ce que vous voulez)
5. **Copiez le mot de passe** généré (16 caractères)
6. **Utilisez ce mot de passe** dans n8n (pas votre mot de passe Gmail normal)

### Pour Outlook/Hotmail

1. **Dans n8n** → **Settings** → **Credentials** → **Add Credential**
2. **Cherchez "SMTP"** → Sélectionnez-le
3. **Configurez** :
   - **Name** : `SMTP Outlook` (ou le nom que vous voulez)
   - **Host** : `smtp-mail.outlook.com`
   - **Port** : `587`
   - **User** : Votre adresse Outlook complète
   - **Password** : Votre mot de passe Outlook
   - **Secure** : `false` (TLS)
4. **Cliquez sur "Save"**

### Pour Autre Fournisseur

| Fournisseur | Host | Port |
|-------------|------|------|
| Gmail | smtp.gmail.com | 587 |
| Outlook/Hotmail | smtp-mail.outlook.com | 587 |
| Yahoo | smtp.mail.yahoo.com | 587 |
| Orange | smtp.orange.fr | 587 |
| Free | smtp.free.fr | 465 |

**Ports** :
- `587` : TLS (Secure: false)
- `465` : SSL (Secure: true)

---

## 🔐 Credential 2 : Microsoft Outlook (Envoi Final)

1. **Dans n8n** → **Settings** → **Credentials** → **Add Credential**
2. **Cherchez "Microsoft Outlook OAuth2 API"** → Sélectionnez-le
3. **Cliquez sur "Connect my account"**
4. **Une fenêtre s'ouvre** pour vous connecter à Microsoft
5. **Connectez-vous** avec votre compte Microsoft/Outlook
6. **Autorisez n8n** à accéder à votre compte :
   - ✅ Autoriser l'accès aux emails
   - ✅ Autoriser l'envoi d'emails
7. **Donnez un nom** au credential (ex: `Microsoft Outlook`)
8. **Cliquez sur "Save"**

**Note** : La première fois, Microsoft vous demandera d'autoriser l'application. Acceptez.

---

## 🔓 Credential Docxtemplater (Optionnel)

Le node Docxtemplater peut afficher un cadenas 🔒, mais **il n'a pas vraiment besoin de credential**.

### Option 1 : Ignorer (Recommandé)

- Si le workflow fonctionne sans erreur, **ignorez le cadenas**
- Le node fonctionnera quand même

### Option 2 : Créer un Credential Vide (Si nécessaire)

Si n8n vous force à créer un credential :

1. **Dans n8n** → **Settings** → **Credentials** → **Add Credential**
2. **Cherchez "Docxtemplater"** (peut ne pas exister)
3. Si pas disponible, créez un credential générique :
   - Créez un credential vide ou avec des valeurs par défaut
   - Le node Docxtemplater fonctionne localement, pas besoin de vraies valeurs

**En réalité**, Docxtemplater fonctionne dans le conteneur Docker et n'a pas besoin d'accès externe.

---

## 🔗 Connecter les Credentials au Workflow

Après avoir créé les credentials, vous devez les connecter au workflow :

1. **Ouvrez votre workflow** dans n8n
2. **Cherchez les nœuds avec un cadenas 🔒** :
   - **"Envoyer Validation"** → Doit avoir le credential SMTP
   - **"Envoyer via Outlook"** → Doit avoir le credential Microsoft Outlook
3. **Pour chaque nœud** :
   - Cliquez sur le nœud
   - Cliquez sur **"Credential to connect"** ou **"Create New Credential"**
   - Sélectionnez le credential que vous avez créé
   - Cliquez sur **"Save"**

---

## ✅ Checklist Complète

- [ ] Credential SMTP créé (Gmail, Outlook, ou autre)
- [ ] Credential Microsoft Outlook créé et connecté
- [ ] Credentials connectés aux nœuds du workflow :
  - [ ] "Envoyer Validation" → SMTP
  - [ ] "Envoyer via Outlook" → Microsoft Outlook
- [ ] Test d'envoi d'email réussi (optionnel mais recommandé)

---

## 🧪 Tester les Credentials

### Tester SMTP

1. **Créez un workflow de test** dans n8n
2. Ajoutez un nœud **"Email Send"**
3. Configurez avec votre credential SMTP
4. **To** : Votre propre email
5. **Subject** : `Test SMTP`
6. **Message** : `Test`
7. **Exécutez le workflow**
8. Vérifiez que vous recevez l'email

### Tester Microsoft Outlook

1. **Créez un workflow de test** dans n8n
2. Ajoutez un nœud **"Microsoft Outlook"**
3. Configurez avec votre credential Outlook
4. **Operation** : Send Message
5. **To** : Votre propre email
6. **Subject** : `Test Outlook`
7. **Body** : `Test`
8. **Exécutez le workflow**
9. Vérifiez que vous recevez l'email

---

## 🐛 Problèmes Courants

### SMTP : "Authentication failed"

**Pour Gmail** :
- ⚠️ Utilisez un **mot de passe d'application**, pas votre mot de passe normal
- Vérifiez que la validation en deux étapes est activée

**Pour Outlook** :
- Vérifiez votre mot de passe
- Essayez de vous connecter sur outlook.com avec les mêmes identifiants

### Microsoft Outlook : "Permission denied"

**Solutions** :
1. **Révoquez les permissions** :
   - Allez sur https://account.microsoft.com/consent
   - Trouvez n8n et révoquez l'accès
2. **Recréez le credential** dans n8n
3. **Autorisez toutes les permissions** demandées

### Credentials ne s'affichent pas dans la liste

**Solutions** :
1. **Vérifiez que les credentials sont bien créés** :
   - Settings → Credentials → Vérifiez la liste
2. **Rafraîchissez la page** n8n (F5)
3. **Vérifiez le type de credential** :
   - Le nœud SMTP doit utiliser un credential "SMTP"
   - Le nœud Outlook doit utiliser un credential "Microsoft Outlook OAuth2 API"

---

## 💡 Conseils

1. **Utilisez des noms clairs** pour vos credentials :
   - `SMTP Gmail`
   - `Microsoft Outlook Pro`
   - etc.

2. **Testez chaque credential individuellement** avant de les utiliser dans le workflow complet

3. **Gardez une sauvegarde** de vos credentials (dans un gestionnaire de mots de passe)

4. **Pour la production**, utilisez des comptes email dédiés plutôt que vos comptes personnels

---

## 📝 Résumé Rapide

**Credential 1 - SMTP** :
- Gmail : `smtp.gmail.com:587` + mot de passe d'application
- Outlook : `smtp-mail.outlook.com:587` + mot de passe normal

**Credential 2 - Microsoft Outlook** :
- OAuth2 via l'interface n8n
- Autorisez l'accès aux emails

**Credential Docxtemplater** :
- ❌ Pas nécessaire, peut être ignoré

---

**Une fois les credentials configurés et connectés, votre workflow devrait fonctionner !** 🚀

