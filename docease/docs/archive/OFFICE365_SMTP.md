# Configuration SMTP Office 365 Professionnel

## 🔧 Configuration Exacte pour Office 365

### Paramètres dans n8n :

```
User: contact@fo-metaux.fr (votre email complet)
Password: votre mot de passe Office 365
Host: smtp.office365.com
Port: 587
SSL/TLS: STARTTLS (ou TLS)
Client Host Name: [laissez vide]
```

---

## ⚠️ Erreur "wrong version number" - Solution

Cette erreur se produit quand **SSL/TLS n'est pas correctement configuré**.

### Solution :

1. **Dans le champ "SSL/TLS"**, vous devez sélectionner **"STARTTLS"** ou **"TLS"**
   - ❌ **PAS** laissez vide
   - ❌ **PAS** SSL
   - ✅ **STARTTLS** ou **TLS**

2. Si le menu déroulant ne propose pas ces options, essayez :
   - Taper "TLS" dans le champ
   - Ou utiliser "STARTTLS"

---

## 📝 Configuration Complète Office 365

### Option 1 - Port 587 (Recommandé) :

```
User: contact@fo-metaux.fr
Password: votre mot de passe Office 365
Host: smtp.office365.com
Port: 587
SSL/TLS: STARTTLS (ou TLS si STARTTLS non disponible)
Client Host Name: [laissez vide]
```

### Option 2 - Port 465 :

```
User: contact@fo-metaux.fr
Password: votre mot de passe Office 365
Host: smtp.office365.com
Port: 465
SSL/TLS: SSL
Client Host Name: [laissez vide]
```

**Recommandation** : Utilisez l'Option 1 (Port 587 avec STARTTLS/TLS)

---

## 🔍 Vérifications Importantes

### 1. Authentification SMTP Activée

Pour Office 365, l'authentification SMTP doit être activée par votre administrateur.

Vérifiez avec votre administrateur IT si :
- ✅ SMTP AUTH est activé pour votre compte
- ✅ Votre compte peut envoyer des emails via SMTP

### 2. Mot de Passe App (Optionnel mais Recommandé)

Office 365 peut nécessiter un **mot de passe d'application** :

1. Allez sur https://account.microsoft.com/security
2. **Sécurité** → **Mots de passe des applications**
3. Créez un nouveau mot de passe d'application
4. Utilisez ce mot de passe dans n8n (au lieu de votre mot de passe normal)

**Note** : Certaines organisations n'autorisent pas les mots de passe d'application. Vérifiez avec votre administrateur.

### 3. Authentification Multi-Facteurs (MFA)

Si votre compte a la MFA activée, vous **devez** utiliser un mot de passe d'application, pas votre mot de passe normal.

---

## 🐛 Résolution des Problèmes

### Problème : "Authentication failed"

**Solutions** :
1. Vérifiez que SMTP AUTH est activé (demandez à votre admin IT)
2. Utilisez un mot de passe d'application si MFA est activée
3. Vérifiez que le User est l'email complet : `contact@fo-metaux.fr`

### Problème : "wrong version number" (votre erreur actuelle)

**Solution** :
- ⚠️ **Le champ SSL/TLS doit être rempli** avec `STARTTLS` ou `TLS`
- Ne laissez **PAS** ce champ vide

### Problème : Connection timeout

**Solutions** :
1. Vérifiez votre firewall d'entreprise (peut bloquer SMTP)
2. Vérifiez que le port 587 n'est pas bloqué
3. Contactez votre admin IT si vous êtes sur un réseau d'entreprise

---

## ✅ Checklist Configuration Office 365

- [ ] User = email complet (`contact@fo-metaux.fr`)
- [ ] Host = `smtp.office365.com`
- [ ] Port = `587`
- [ ] **SSL/TLS = STARTTLS ou TLS** (⚠️ NE PAS LAISSER VIDE)
- [ ] Password = mot de passe Office 365 ou mot de passe d'application (si MFA)
- [ ] Client Host Name = vide
- [ ] SMTP AUTH activé (vérifier avec admin IT)

---

## 🧪 Test de la Configuration

Après avoir configuré dans n8n :

1. **Cliquez sur "Save & Test"** si disponible
2. **Ou créez un workflow de test** :
   - Nœud "Email Send"
   - Configurez avec votre credential
   - Envoyez-vous un email de test à `contact@fo-metaux.fr`
   - Vérifiez que vous recevez l'email

---

## 💡 Alternative : Utiliser OAuth2 Office 365

Si SMTP ne fonctionne pas, vous pouvez utiliser **OAuth2** :

1. Dans n8n → **Settings** → **Credentials**
2. **Add Credential** → Cherchez **"Microsoft Office 365 OAuth2 API"**
3. Configurez avec votre compte Office 365
4. Utilisez ce credential dans le workflow au lieu de SMTP

**Avantage** : OAuth2 fonctionne généralement mieux avec Office 365 que SMTP.

---

## 📞 Contact Admin IT

Si rien ne fonctionne, contactez votre administrateur IT et demandez :

1. ✅ SMTP AUTH est-il activé pour `contact@fo-metaux.fr` ?
2. ✅ Les ports 587/465 sont-ils ouverts ?
3. ✅ Y a-t-il des restrictions d'authentification ?
4. ✅ Le compte peut-il envoyer des emails via SMTP externe ?

---

**Le problème principal est probablement le champ SSL/TLS vide. Remplissez-le avec STARTTLS ou TLS !**

