# Activer un Node Communautaire dans n8n

## 🐛 Problème : Node Inactif

Si un node communautaire est installé mais **inactif**, il ne sera pas disponible dans les workflows.

---

## ✅ Solution : Activer le Node

### Méthode 1 : Via l'Interface n8n

1. **Dans n8n** → **Settings** (⚙️ en bas à gauche)
2. **Cliquez sur "Community Nodes"**
3. **Trouvez** `n8n-nodes-docxtemplater` dans la liste
4. **Vous devriez voir** un toggle ou bouton pour l'activer :
   - **Toggle** : Cliquez dessus pour l'activer (passer de gris à vert)
   - **Bouton "Enable"** : Cliquez dessus
   - **Menu (⋯)** : Cliquez et sélectionnez "Enable" ou "Activate"

5. **Si le node n'apparaît pas** :
   - Vérifiez qu'il est bien installé
   - Si absent, installez-le : "Install a community node" → `n8n-nodes-docxtemplater`

6. **Après activation** :
   - **Redémarrez n8n** (important !) :
     ```powershell
     cd docker
     docker-compose restart
     ```
   - **Attendez 30 secondes**
   - **Rafraîchissez** la page n8n (F5)

---

### Méthode 2 : Vérifier les Paramètres du Node

Parfois le node est installé mais désactivé dans les paramètres :

1. **Settings** → **Community Nodes**
2. **Cliquez sur le node** `n8n-nodes-docxtemplater`
3. **Vérifiez les options** :
   - Status : Doit être "Active" ou "Enabled"
   - S'il y a un bouton "Enable" ou "Activate", cliquez dessus

---

### Méthode 3 : Réinstaller le Node

Si l'activation ne fonctionne pas :

1. **Settings** → **Community Nodes**
2. **Désinstallez** `n8n-nodes-docxtemplater` (s'il y a un bouton Uninstall)
3. **Réinstallez-le** :
   - "Install a community node"
   - Nom : `n8n-nodes-docxtemplater`
   - Install
4. **Redémarrez n8n** :
   ```powershell
   cd docker
   docker-compose restart
   ```
5. **Attendez 30 secondes**
6. **Rafraîchissez** n8n (F5)

---

## 🔍 Vérifier que le Node est Actif

Après activation et redémarrage :

1. **Dans n8n**, ajoutez un nouveau nœud (+)
2. **Cherchez** "DocxTemplater" ou "docxtemplater"
3. **Vous devriez voir** le node dans les résultats

Si vous le voyez ✅ → Le node est actif et prêt à être utilisé !

---

## 📋 Checklist d'Activation

- [ ] Node vérifié dans Settings → Community Nodes
- [ ] Node activé (toggle vert ou bouton Enable cliqué)
- [ ] n8n redémarré après activation
- [ ] Attendu 30 secondes après redémarrage
- [ ] Page n8n rafraîchie (F5)
- [ ] Node visible dans la recherche de nœuds
- [ ] Node utilisable dans le workflow

---

## 🐛 Si le Node Reste Inactif

### Vérifier les Logs

```powershell
docker logs n8n-local --tail 100 | Select-String -Pattern "docxtemplater|community|error" -Context 2
```

### Solution Alternative : Installer dans le Conteneur

Si l'activation via l'interface ne fonctionne pas :

```powershell
# Entrer dans le conteneur
docker exec -it n8n-local sh

# Installer manuellement
npm install n8n-nodes-docxtemplater

# Sortir
exit

# Redémarrer
cd docker
docker-compose restart
```

---

**Une fois activé et n8n redémarré, le node devrait fonctionner dans votre workflow !** 🚀

