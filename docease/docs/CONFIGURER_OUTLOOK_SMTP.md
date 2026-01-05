# Configuration SMTP Outlook Détaillée

## 🔧 Configuration Exacte pour Outlook/Hotmail

### Paramètres à utiliser dans n8n :

```
Name: SMTP Outlook (ou le nom que vous voulez)
User: votre.email@outlook.com (OU @hotmail.com, @live.com)
Password: votre mot de passe Outlook normal
Host: smtp-mail.outlook.com
Port: 587
SSL/TLS: TLS (ou STARTTLS)
Client Host Name: [laissez vide ou : localhost]
```

---

## 🐛 Résolution ECONNREFUSED avec Outlook

### Si l'erreur ECONNREFUSED persiste :

#### Étape 1 : Vérifier la configuration exacte

**Host doit être EXACTEMENT** : `smtp-mail.outlook.com`
- ❌ PAS `smtp.outlook.com`
- ❌ PAS `outlook.office365.com`
- ✅ `smtp-mail.outlook.com`

#### Étape 2 : Essayer différentes configurations

**Configuration Alternative 1 - Office 365** :
```
Host: smtp.office365.com
Port: 587
SSL/TLS: TLS
```

**Configuration Alternative 2 - Port différent** :
```
Host: smtp-mail.outlook.com
Port: 25
SSL/TLS: None (ou laissez vide)
```

#### Étape 3 : Vérifier le User

Le **User** doit être votre **adresse email complète** :
- ✅ `votre.nom@outlook.com`
- ✅ `votre.nom@hotmail.com`
- ✅ `votre.nom@live.com`
- ❌ PAS juste `votre.nom`

---

## 🔍 Diagnostic depuis Docker

Testez si Docker peut accéder à Outlook :

```powershell
# Test 1 : Ping
docker exec -it n8n-local ping -c 2 smtp-mail.outlook.com

# Test 2 : Test de connexion (si curl disponible)
docker exec -it n8n-local sh -c "nc -zv smtp-mail.outlook.com 587"
```

Si les tests échouent, Docker n'a peut-être pas accès réseau correct.

---

## 🔄 Solutions si ça ne fonctionne toujours pas

### Solution 1 : Redémarrer Docker Desktop

Parfois un redémarrage résout les problèmes de réseau :

1. **Redémarrez Docker Desktop** complètement
2. **Redémarrez le conteneur n8n** :
   ```powershell
   cd docker
   docker-compose restart
   ```
3. **Réessayez** la connexion SMTP

### Solution 2 : Utiliser l'IP au lieu du nom

Parfois la résolution DNS pose problème. Testez avec l'IP :

```
Host: 52.97.201.38 (IP Microsoft)
Port: 587
SSL/TLS: TLS
```

**Note** : L'IP peut changer, donc ce n'est pas idéal, mais ça peut fonctionner pour tester.

### Solution 3 : Vérifier les paramètres réseau Docker

Vérifiez que Docker utilise le bon DNS :

1. Dans **Docker Desktop** → **Settings** → **Resources** → **Network**
2. Vérifiez les paramètres DNS
3. Essayez avec "Use DNS from host"

### Solution 4 : Utiliser Authentification Alternative

Parfois l'authentification OAuth est mieux que SMTP :

- Au lieu de SMTP, utilisez directement **Microsoft Outlook OAuth2 API**
- Mais pour l'envoi d'email de validation, SMTP est nécessaire

---

## ✅ Checklist de Configuration Outlook

- [ ] Host = `smtp-mail.outlook.com` (exactement)
- [ ] Port = `587`
- [ ] SSL/TLS = `TLS` (pas SSL)
- [ ] User = email complet (`@outlook.com` ou `@hotmail.com`)
- [ ] Password = mot de passe Outlook correct
- [ ] Client Host Name = vide ou `localhost`
- [ ] Test depuis PowerShell réussi
- [ ] Docker redémarré
- [ ] Conteneur n8n redémarré

---

## 🧪 Test Manuel de la Connexion

Testez si vous pouvez vous connecter manuellement :

```powershell
# Avec PowerShell (si telnet installé)
$tcpClient = New-Object System.Net.Sockets.TcpClient
$tcpClient.Connect("smtp-mail.outlook.com", 587)
if ($tcpClient.Connected) {
    Write-Host "✅ Connexion réussie"
    $tcpClient.Close()
} else {
    Write-Host "❌ Connexion échouée"
}
```

---

## 💡 Astuce : Vérifier les Logs n8n

Les logs n8n peuvent donner plus d'informations :

```powershell
docker logs n8n-local --tail 100 | Select-String -Pattern "smtp|outlook|mail|error" -Context 2
```

Cherchez les erreurs spécifiques liées à SMTP.

---

## 🆘 Si Rien ne Fonctionne

### Solution de contournement : Utiliser Outlook OAuth2 au lieu de SMTP

Si SMTP ne fonctionne vraiment pas, vous pouvez :

1. **Utiliser Microsoft Outlook OAuth2 API** pour TOUS les emails
2. **Modifier le workflow** pour utiliser Outlook OAuth2 au lieu de SMTP pour l'email de validation

**Dans le nœud "Envoyer Validation"** :
- Remplacez "Email Send" par "Microsoft Outlook"
- Configurez avec votre credential Outlook OAuth2
- Utilisez "Send Message" au lieu de SMTP

**Note** : Cela nécessite de modifier le workflow, mais si SMTP ne fonctionne pas, c'est une solution de contournement viable.

---

**Avec la bonne configuration, Outlook SMTP devrait fonctionner !** 

Vérifiez surtout que le Host est exactement `smtp-mail.outlook.com` et pas autre chose.

