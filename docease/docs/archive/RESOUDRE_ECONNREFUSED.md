# Résolution : Erreur ECONNREFUSED SMTP

## 🐛 Erreur "connect ECONNREFUSED"

Cette erreur signifie que la connexion au serveur SMTP est **refusée**. L'IP `52.97.201.38` correspond à Microsoft Outlook/Hotmail.

---

## ✅ Solutions par ordre de priorité

### Solution 1 : Vérifier la Configuration Outlook Exacte

**Configuration correcte pour Outlook/Hotmail** :

```
User: votre.email@outlook.com (ou @hotmail.com, @live.com)
Password: votre mot de passe Outlook
Host: smtp-mail.outlook.com
Port: 587
SSL/TLS: TLS (ou STARTTLS)
Client Host Name: [laissez vide]
```

⚠️ **Important** :
- Le **Host** doit être exactement : `smtp-mail.outlook.com`
- **PAS** `smtp.outlook.com` ou autre
- Port **587** avec **TLS** (pas 465)

---

### Solution 2 : Tester la Connexion SMTP

Testez si la connexion fonctionne depuis votre machine :

#### Windows PowerShell :

```powershell
# Tester la connexion au port 587
Test-NetConnection -ComputerName smtp-mail.outlook.com -Port 587

# Si bloqué, essayez 25
Test-NetConnection -ComputerName smtp-mail.outlook.com -Port 25
```

#### Si la connexion est bloquée :

Cela signifie que votre **firewall ou FAI bloque le port**.

---

### Solution 3 : Utiliser Gmail à la place (Plus Facile)

Gmail est souvent plus simple à configurer :

1. **Créez un nouveau credential SMTP** dans n8n
2. **Configurez avec Gmail** :
   ```
   User: votre.email@gmail.com
   Password: [mot de passe d'application - voir ci-dessous]
   Host: smtp.gmail.com
   Port: 587
   SSL/TLS: TLS
   ```

3. **Créez un mot de passe d'application Gmail** :
   - https://myaccount.google.com/
   - Sécurité → Validation en deux étapes (activée)
   - Mots de passe des applications → Créer
   - Utilisez ce mot de passe dans n8n

---

### Solution 4 : Désactiver temporairement le Firewall

**Pour tester uniquement** :

1. Ouvrez **Paramètres Windows** → **Sécurité** → **Firewall**
2. **Désactivez temporairement** le firewall Windows
3. **Testez la connexion SMTP** dans n8n
4. **Réactivez** le firewall après le test

Si ça fonctionne sans firewall, c'est que le firewall bloque. Il faudra créer une exception.

---

### Solution 5 : Utiliser un Autre Port ou Serveur

**Pour Outlook, essayez** :

**Option A** :
```
Host: smtp.office365.com
Port: 587
SSL/TLS: TLS
```

**Option B** :
```
Host: smtp-mail.outlook.com
Port: 25
SSL/TLS: [aucun ou laissez vide]
```

---

### Solution 6 : Vérifier Docker Network

Si n8n tourne dans Docker, vérifiez que le conteneur peut accéder à internet :

```powershell
# Tester depuis le conteneur
docker exec -it n8n-local ping smtp-mail.outlook.com
```

Si ça ne fonctionne pas, le conteneur n'a peut-être pas accès à internet.

---

## 🔍 Diagnostic Détaillé

### Étape 1 : Identifier le Problème

Testez depuis PowerShell :

```powershell
# Test 1 : Ping du serveur
ping smtp-mail.outlook.com

# Test 2 : Test de connexion au port
Test-NetConnection -ComputerName smtp-mail.outlook.com -Port 587
```

**Résultats possibles** :
- ✅ **TcpTestSucceeded : True** → La connexion fonctionne, problème dans n8n
- ❌ **TcpTestSucceeded : False** → Firewall/FAI bloque, ou serveur inaccessible

### Étape 2 : Vérifier les Logs Docker

```powershell
docker logs n8n-local --tail 50 | Select-String -Pattern "smtp|mail|error"
```

---

## 💡 Solution Recommandée

**Utiliser Gmail** est souvent plus simple :

1. ✅ Gmail fonctionne généralement mieux
2. ✅ Configuration plus standardisée
3. ✅ Moins de problèmes de firewall
4. ✅ Documentation abondante

**Si vous devez absolument utiliser Outlook** :
- Vérifiez que vous utilisez bien `smtp-mail.outlook.com:587` avec `TLS`
- Testez depuis un autre réseau (ex: mobile en hotspot) pour vérifier si c'est le FAI qui bloque
- Contactez votre FAI si le port 587 est bloqué

---

## ✅ Checklist de Dépannage

- [ ] Configuration exacte : `smtp-mail.outlook.com:587` avec `TLS`
- [ ] Mot de passe correct (pas expiré)
- [ ] Test de connexion depuis PowerShell réussi
- [ ] Firewall désactivé temporairement (pour test)
- [ ] Gmail testé comme alternative
- [ ] Docker a accès à internet (ping réussi)

---

**Si rien ne fonctionne, je recommande d'utiliser Gmail qui est généralement plus simple à configurer.**

