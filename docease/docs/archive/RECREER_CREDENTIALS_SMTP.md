# 🔄 Recréer les Credentials SMTP

## 🚨 Situation

Après la migration vers PostgreSQL, les credentials SMTP ont été perdus. Voici comment les recréer rapidement.

## ✅ Recréer le Credential SMTP Office 365

### Étape 1 : Accéder aux Credentials

1. **Ouvrez n8n** : http://localhost:5678
2. **Allez dans** : **Settings** (⚙️) → **Credentials**
3. **Cliquez sur** : **Add Credential**

### Étape 2 : Sélectionner SMTP

1. **Cherchez** : `SMTP` dans la barre de recherche
2. **Sélectionnez** : **SMTP**

### Étape 3 : Configurer Office 365

Remplissez les champs suivants :

```
Name: SMTP account (ou le nom que vous voulez)
User: contact@fo-metaux.fr
Password: [Votre mot de passe Office 365]
Host: smtp.office365.com
Port: 587
Secure: STARTTLS (ou TLS)
```

**Important** :
- **User** : Doit être votre email complet `contact@fo-metaux.fr`
- **Host** : `smtp.office365.com` (pas `smtp-mail.outlook.com`)
- **Port** : `587`
- **Secure** : `STARTTLS` ou `TLS` (PAS SSL, PAS vide)

### Étape 4 : Sauvegarder

1. **Cliquez sur** : **Save**
2. **Testez** si possible (optionnel)

## 🔗 Connecter au Workflow

Après avoir créé le credential :

1. **Ouvrez votre workflow** dans n8n
2. **Trouvez le nœud "Envoi Email"** (ou le nœud qui envoie les emails)
3. **Cliquez sur le nœud**
4. **Dans "Credential to connect"**, sélectionnez votre credential SMTP
5. **Sauvegardez** le workflow

## 🐛 Si ça ne fonctionne pas

### Erreur "Authentication failed"

**Solution** : Utilisez un **mot de passe d'application** au lieu de votre mot de passe normal :

1. Allez sur https://account.microsoft.com/security
2. **Sécurité** → **Mots de passe des applications**
3. Créez un nouveau mot de passe d'application
4. Utilisez ce mot de passe dans n8n

### Erreur "wrong version number"

**Solution** : Vérifiez que **Secure** est bien sur **STARTTLS** ou **TLS**, PAS SSL.

### Erreur "ECONNREFUSED"

**Solution** : Vérifiez que :
- Le **Host** est exactement `smtp.office365.com`
- Le **Port** est `587`
- Votre réseau/firewall autorise les connexions SMTP

## 📝 Configuration Alternative (si Port 587 ne fonctionne pas)

```
Host: smtp.office365.com
Port: 465
Secure: SSL
```

## ✅ Vérification

Une fois configuré, testez en exécutant votre workflow. L'email devrait être envoyé avec succès.

