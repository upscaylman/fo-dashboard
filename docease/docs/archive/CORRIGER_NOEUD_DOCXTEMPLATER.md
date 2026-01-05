# Corriger le Nœud Docxtemplater dans le Workflow

## 🐛 Problème : Node installé mais erreur persiste

Le node `n8n-nodes-docxtemplater` est installé (v1.0.0) mais n8n ne le reconnaît pas dans le workflow.

---

## ✅ Solution : Reconstruire le Nœud dans le Workflow

### Méthode 1 : Supprimer et Recréer (Recommandée)

1. **Dans n8n**, ouvrez votre workflow "Générateur Document avec Validation (Ollama)"

2. **Trouvez le nœud "Créer Document"** (celui avec l'erreur)

3. **Notez la configuration** :
   - Cliquez sur le nœud pour voir ses paramètres
   - Notez (ou prenez une capture) de :
     - Binary Property Name : `data`
     - File Extension : `docx`
     - Toutes les variables dans "Template Data"

4. **Supprimez le nœud "Créer Document"** :
   - Clic droit → Delete
   - OU sélectionnez-le et appuyez sur Suppr

5. **Ajoutez un nouveau nœud Docxtemplater** :
   - Cliquez sur "+" après le nœud "Charger Template"
   - Cherchez **"DocxTemplater"** ou **"docxtemplater"**
   - Sélectionnez-le et ajoutez-le

6. **Configurez le nouveau nœud** avec les mêmes paramètres :
   - **Binary Property Name** : `data`
   - **File Extension** : `docx`
   - **Template Data** : Cliquez sur "Add Entry" et ajoutez chaque variable :
     - `nom_destinataire` = `={{ $('Formater Données').item.json.nom_destinataire }}`
     - `contexte` = `={{ $('Formater Données').item.json.contexte }}`
     - `points_importants` = `={{ $('Formater Données').item.json.points_importants }}`
     - `texte_ia` = `={{ $('Extraire Texte IA').item.json.texte_ia }}`
     - `date` = `={{ $('Formater Données').item.json.date }}`
     - `date_complete` = `={{ $('Formater Données').item.json.date_complete }}`
     - `heure` = `={{ $('Formater Données').item.json.heure }}`
     - `email_destinataire` = `={{ $('Formater Données').item.json.emails_destinataires.split(',')[0].trim() }}`

7. **Connectez** :
   - **Entrée** : Depuis "Charger Template"
   - **Sortie** : Vers "Nommer Document" et "Envoyer Validation"

8. **Sauvegardez** le workflow

9. **L'erreur devrait disparaître !**

---

### Méthode 2 : Corriger le Type dans le JSON (Avancée)

Si vous êtes à l'aise avec le JSON, vous pouvez modifier directement :

1. **Exportez le workflow** depuis n8n :
   - Workflows → Votre workflow → ⋮ → Export

2. **Ouvrez le JSON** avec un éditeur de texte

3. **Trouvez le nœud "create-document"** :
   ```json
   {
     "type": "n8n-nodes-docxtemplater.execute",
     ...
   }
   ```

4. **Essayez de changer le type** (selon la version du node) :
   - `n8n-nodes-docxtemplater.execute` → Peut-être juste `docxtemplater.execute`
   - Ou cherchez dans la documentation du node le bon nom

5. **Réimportez le workflow** dans n8n

⚠️ **Attention** : Cette méthode peut casser d'autres choses. Préférez la Méthode 1.

---

## 🔍 Vérifier que le Node Fonctionne

### Test 1 : Le node est visible ?

1. **Dans n8n**, ajoutez un nouveau nœud (+)
2. **Cherchez** "DocxTemplater" ou "docxtemplater"
3. **Si vous le voyez** → Le node fonctionne, recréez juste le nœud dans le workflow
4. **Si vous ne le voyez pas** → Il faut réinstaller ou redémarrer

### Test 2 : Recharger les Nodes

Parfois les nodes ne se chargent pas au démarrage :

1. **Arrêtez n8n** :
   ```powershell
   cd docker
   docker-compose down
   ```

2. **Attendez 10 secondes**

3. **Redémarrez** :
   ```powershell
   docker-compose up -d
   ```

4. **Attendez 30 secondes**

5. **Rafraîchissez n8n** (F5)

---

## 📋 Checklist de Correction

- [ ] Node installé dans Community Nodes
- [ ] n8n redémarré après installation
- [ ] Node visible dans la recherche de nœuds (+ → chercher "DocxTemplater")
- [ ] Si visible → Nœud "Créer Document" supprimé et recréé
- [ ] Nœud reconfiguré avec les mêmes paramètres
- [ ] Nœud reconnecté dans le workflow
- [ ] Erreur disparue

---

## 💡 Alternative : Node Différent ?

Si le node `n8n-nodes-docxtemplater` ne fonctionne vraiment pas, il existe d'autres nodes similaires :

- `@n8n/n8n-nodes-docxtemplater` (version officielle n8n ?)
- Cherchez dans Community Nodes d'autres alternatives

Mais normalement `n8n-nodes-docxtemplater` devrait fonctionner.

---

**La solution la plus simple : Supprimez le nœud "Créer Document" et recréez-le manuellement dans n8n !** 🚀

