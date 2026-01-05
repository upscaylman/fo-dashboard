# Guide : Installer les Nodes Communautaires

Guide pour installer les nodes communautaires nécessaires au workflow.

## 🔧 Nodes Requis

Pour que le workflow fonctionne, vous devez installer ces nodes communautaires :

1. **n8n-nodes-docxtemplater** : Pour générer les documents Word (OBLIGATOIRE)
2. **@n8n/n8n-nodes-langchain** : Pour l'IA (non nécessaire si vous utilisez le workflow Ollama avec HTTP Request)

---

## 📥 Installation

### Étape 1 : Installer Docxtemplater

1. **Dans n8n**, allez dans **Settings** (⚙️ en bas à gauche)
2. Cliquez sur **"Community Nodes"**
3. Cliquez sur **"Install a community node"**
4. **Entrez le nom** : `n8n-nodes-docxtemplater`
5. Cliquez sur **"Install"**
6. **Attendez** que l'installation se termine (peut prendre 1-2 minutes)

### Étape 2 : Redémarrer n8n

**IMPORTANT** : Après l'installation, vous devez redémarrer n8n pour que le node soit disponible.

**Option A - Via le terminal** (recommandé) :
```powershell
cd docker
docker-compose restart
```

**Option B - Via l'interface Docker Desktop** :
- Ouvrez Docker Desktop
- Trouvez le conteneur `n8n-local`
- Cliquez sur l'icône "Restart"

### Étape 3 : Vérifier l'Installation

1. **Attendez 30 secondes** après le redémarrage
2. **Rafraîchissez la page n8n** (F5)
3. **Ouvrez votre workflow**
4. **Ajoutez un nouveau nœud** (clic sur "+")
5. **Cherchez "docxtemplater"** dans la recherche
6. **Vous devriez voir** "Docxtemplater" dans les résultats

Si vous le voyez, l'installation est réussie ! ✅

---

## 🐛 Problèmes Courants

### Le node n'apparaît pas après installation

**Solutions** :
1. **Vérifiez que n8n a bien redémarré** :
   ```powershell
   docker ps | grep n8n
   ```
   Le conteneur doit être "Up" récemment

2. **Rafraîchissez la page** n8n (F5 ou Ctrl+R)

3. **Videz le cache du navigateur** :
   - Chrome/Edge : Ctrl+Shift+Delete → Effacer les données de navigation
   - Firefox : Ctrl+Shift+Delete

4. **Vérifiez les logs** :
   ```powershell
   docker logs n8n-local --tail 50
   ```
   Cherchez des erreurs liées à l'installation

### Erreur lors de l'installation

**Solutions** :
1. **Vérifiez votre connexion internet** (les nodes sont téléchargés depuis npm)

2. **Vérifiez les logs** :
   ```powershell
   docker logs n8n-local -f
   ```
   Lancez l'installation et regardez les erreurs

3. **Réessayez l'installation** après quelques minutes

4. **Si ça ne fonctionne toujours pas**, installez manuellement :
   ```powershell
   docker exec -it n8n-local npm install -g n8n-nodes-docxtemplater
   docker-compose restart
   ```

### Le workflow fonctionne toujours pas après installation

**Vérifiez** :
1. Le node est bien installé (voir étape 3 ci-dessus)
2. n8n a bien redémarré
3. Le workflow utilise le bon nom de node :
   - ✅ `n8n-nodes-docxtemplater.execute`
   - ❌ Pas d'ancien nom ou typo

---

## 📋 Checklist Complète

- [ ] Node Docxtemplater installé dans n8n
- [ ] n8n redémarré après installation
- [ ] Page n8n rafraîchie
- [ ] Node "Docxtemplater" visible dans la recherche de nœuds
- [ ] Workflow mis à jour (si nécessaire)
- [ ] Test du workflow réussi

---

## 💡 Note

**Pour le workflow Ollama** (`generateur_document_ollama.json`) :
- ✅ **Seul Docxtemplater est nécessaire** (pas LangChain car on utilise HTTP Request)
- Le node HTTP Request est intégré dans n8n (pas besoin d'installer)

**Pour le workflow standard** (`generateur_document.json`) :
- ✅ Docxtemplater : OBLIGATOIRE
- ✅ LangChain : OBLIGATOIRE (pour l'IA)

---

**Une fois Docxtemplater installé et n8n redémarré, votre workflow devrait fonctionner !** 🚀

