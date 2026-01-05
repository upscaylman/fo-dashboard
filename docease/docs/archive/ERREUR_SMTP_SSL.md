# Résolution : Erreur SSL SMTP

## 🐛 Erreur "wrong version number"

Cette erreur se produit quand le **port et le type SSL/TLS ne correspondent pas**.

---

## ✅ Solution selon votre fournisseur

### Pour Gmail :

**Option 1 - Port 587 (Recommandé)** :
```
User: votre.email@gmail.com
Password: [mot de passe d'application]
Host: smtp.gmail.com
Port: 587
SSL/TLS: TLS (ou STARTTLS)
Client Host Name: [laissez vide]
```

**Option 2 - Port 465** :
```
User: votre.email@gmail.com
Password: [mot de passe d'application]
Host: smtp.gmail.com
Port: 465
SSL/TLS: SSL
Client Host Name: [laissez vide]
```

⚠️ **Important** : 
- Port **587** = **TLS** (pas SSL)
- Port **465** = **SSL** (pas TLS)

---

### Pour Outlook/Hotmail :

```
User: votre.email@outlook.com
Password: [votre mot de passe]
Host: smtp-mail.outlook.com
Port: 587
SSL/TLS: TLS
Client Host Name: [laissez vide]
```

---

## 🔧 Étapes pour corriger

1. **Dans n8n**, ouvrez le credential SMTP que vous venez de créer
2. **Vérifiez et corrigez** :
   - Si Port = **587** → SSL/TLS doit être **TLS**
   - Si Port = **465** → SSL/TLS doit être **SSL**
3. **Sauvegardez** le credential
4. **Testez à nouveau**

---

## 📝 Résumé des Ports

| Port | SSL/TLS | Usage |
|------|---------|-------|
| 587 | TLS (STARTTLS) | Recommandé - Meilleure compatibilité |
| 465 | SSL | Ancien standard, toujours fonctionnel |
| 25 | (non sécurisé) | Non recommandé, souvent bloqué |

**Pour la plupart des cas** : Utilisez **Port 587 avec TLS**.

---

## 🧪 Tester la Configuration

Après avoir corrigé :

1. **Cliquez sur "Save & Test"** si disponible
2. **Ou créez un workflow de test** :
   - Ajoutez un nœud "Email Send"
   - Configurez avec votre credential SMTP
   - Envoyez-vous un email de test
   - Vérifiez que ça fonctionne

---

## 🆘 Si ça ne fonctionne toujours pas

### Vérifier le mot de passe d'application (Gmail)

Si vous utilisez Gmail :
1. Allez sur https://myaccount.google.com/
2. Sécurité → Mots de passe des applications
3. Vérifiez que vous utilisez bien le **mot de passe d'application** (16 caractères)
4. **PAS votre mot de passe Gmail normal**

### Vérifier le Firewall

Parfois le firewall bloque la connexion :
- Ajoutez une exception pour n8n
- Ou testez en désactivant temporairement le firewall

### Vérifier la validation en deux étapes (Gmail)

Pour Gmail, la validation en deux étapes **doit être activée** pour utiliser les mots de passe d'application.

---

**La solution la plus simple : Utilisez Port 587 avec TLS** ✅

