# Résoudre : Node Docxtemplater Non Reconnu

## 🐛 Erreur "Unrecognized node type: n8n-nodes-docxtemplater.execute"

Cette erreur signifie que le node communautaire Docxtemplater n'est pas installé ou n'a pas été chargé correctement par n8n.

---

## ✅ Solution Complète

### Étape 1 : Vérifier l'Installation dans n8n

1. **Dans n8n** → **Settings** (⚙️) → **Community Nodes**
2. **Vérifiez** si `n8n-nodes-docxtemplater` est dans la liste
3. **Si absent** → Passez à l'Étape 2
4. **Si présent** → Passez directement à l'Étape 3 (redémarrer)

---

### Étape 2 : Installer le Node (si absent)

1. **Dans n8n** → **Settings** → **Community Nodes**
2. **Cliquez sur "Install a community node"**
3. **Entrez** : `n8n-nodes-docxtemplater`
4. **Cliquez sur "Install"**
5. **Attendez** que l'installation se termine (1-2 minutes)

⚠️ **IMPORTANT** : Après l'installation, vous **DEVEZ redémarrer n8n**.

---

### Étape 3 : Redémarrer n8n (OBLIGATOIRE)

Après avoir installé un node communautaire, **n8n doit être redémarré** pour le charger.

#### Option A - Via Terminal (Recommandé) :

```powershell
cd docker
docker-compose restart
```

**Attendez 30 secondes** après le redémarrage.

#### Option B - Via Docker Desktop :

1. **Ouvrez Docker Desktop**
2. **Trouvez le conteneur** `n8n-local`
3. **Clic droit** → **Restart**

---

### Étape 4 : Vérifier que le Node est Disponible

1. **Rafraîchissez la page n8n** (F5 ou Ctrl+R)
2. **Ouvrez votre workflow**
3. **Cliquez sur "+"** pour ajouter un nouveau nœud
4. **Cherchez** "docxtemplater" dans la recherche
5. **Vous devriez voir** "Docxtemplater" dans les résultats

Si vous le voyez ✅ → Le node est bien installé et chargé !

---

### Étape 5 : Vérifier le Workflow

1. **Ouvrez votre workflow** dans n8n
2. **Vérifiez que l'erreur a disparu**
3. **Le nœud "Créer Document"** devrait maintenant fonctionner

---

## 🔍 Diagnostic Avancé

### Si le node ne s'installe pas :

**Vérifiez les logs** :
```powershell
docker logs n8n-local --tail 100 | Select-String -Pattern "docxtemplater|error|failed"
```

**Solutions** :
1. **Vérifiez votre connexion internet** (les nodes sont téléchargés depuis npm)
2. **Réessayez l'installation** après quelques minutes
3. **Installez manuellement** :
   ```powershell
   docker exec -it n8n-local npm install n8n-nodes-docxtemplater
   docker-compose restart
   ```

### Si le node est installé mais toujours pas reconnu :

**Vérifiez** :
1. **n8n a bien redémarré** :
   ```powershell
   docker ps | grep n8n
   # Vérifiez la date de création du conteneur
   ```

2. **Pas de cache du navigateur** :
   - Videz le cache (Ctrl+Shift+Delete)
   - Ou utilisez un autre navigateur pour tester

3. **Vérifiez les logs** pour des erreurs :
   ```powershell
   docker logs n8n-local --tail 50
   ```

---

## ✅ Checklist de Résolution

- [ ] Node vérifié dans Settings → Community Nodes
- [ ] Node installé (si absent)
- [ ] n8n redémarré après installation
- [ ] Attendu 30 secondes après redémarrage
- [ ] Page n8n rafraîchie (F5)
- [ ] Node "Docxtemplater" visible dans la recherche de nœuds
- [ ] Erreur disparue dans le workflow

---

## 💡 Note Importante

**Toujours redémarrer n8n après avoir installé un node communautaire !**

C'est une étape **obligatoire** que beaucoup oublient. Les nodes sont chargés au démarrage de n8n.

---

## 🆘 Si Rien ne Fonctionne

**Solution de dernier recours** :

1. **Arrêter n8n** :
   ```powershell
   cd docker
   docker-compose down
   ```

2. **Supprimer et recréer le conteneur** :
   ```powershell
   docker rm n8n-local
   docker-compose up -d
   ```

3. **Réinstaller tous les nodes** dans l'interface n8n

4. **Redémarrer** et réessayer

---

**Après avoir redémarré n8n, l'erreur devrait disparaître !** 🚀

