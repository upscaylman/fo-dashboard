# 🚀 Guide Rapide - Édition de Workflows n8n

## ⚡ Démarrage en 3 Minutes

### 1. Démarrer le Serveur MCP (30 secondes)

```powershell
cd mcp-server
npm start
```

Vous devriez voir :
```
✅ Serveur MCP n8n démarré avec succès
📡 Connecté à: http://localhost:5678/api/v1

🔧 Outils disponibles (18 outils):
...
```

### 2. Tester dans Continue (1 minute)

Ouvrez Continue et essayez :

```
Liste tous mes workflows n8n
```

Vous devriez voir la liste de vos workflows avec leurs IDs.

### 3. Première Modification (1 minute)

```
Liste les nœuds du workflow "gpt_generator"
```

Vous verrez tous les nœuds avec leurs noms et types.

---

## 🎯 5 Commandes Essentielles

### 1. Lister les Nœuds
```
Liste les nœuds du workflow "gpt_generator"
```

**Résultat** : Liste de tous les nœuds avec noms, types, positions

---

### 2. Modifier un Nœud
```
Dans le workflow "gpt_generator", modifie le nœud "Appel IA Gemma" 
pour changer le paramètre "prompt" en "Tu es un assistant professionnel"
```

**Résultat** : Nœud modifié avec confirmation

---

### 3. Ajouter un Nœud
```
Ajoute un nœud "Set" appelé "Format Data" au workflow "gpt_generator"
```

**Résultat** : Nouveau nœud ajouté au workflow

---

### 4. Dupliquer un Workflow
```
Duplique le workflow "gpt_generator" en "gpt_generator_backup"
```

**Résultat** : Copie complète du workflow créée

---

### 5. Créer un Workflow Simple
```
Crée un workflow "Test" avec un webhook appelé "Trigger"
```

**Résultat** : Nouveau workflow créé avec un nœud webhook

---

## 📋 Workflow Typique de Modification

### Scénario : Modifier le prompt d'un nœud IA

#### Étape 1 : Sauvegarder
```
Duplique le workflow "gpt_generator" en "gpt_generator_backup"
```

#### Étape 2 : Désactiver
```
Désactive le workflow "gpt_generator"
```

#### Étape 3 : Lister les Nœuds
```
Liste les nœuds du workflow "gpt_generator"
```

#### Étape 4 : Modifier
```
Dans le workflow "gpt_generator", modifie le nœud "Appel IA Gemma" 
pour utiliser ce prompt : "Tu es un assistant qui génère des documents professionnels"
```

#### Étape 5 : Réactiver
```
Active le workflow "gpt_generator"
```

#### Étape 6 : Tester
```
Déclenche le workflow "gpt_generator" avec des données de test
```

---

## 🔧 Types de Nœuds Courants

Utilisez ces types lors de l'ajout de nœuds :

| Type | Description |
|------|-------------|
| `n8n-nodes-base.webhook` | Webhook trigger |
| `n8n-nodes-base.set` | Manipulation de données |
| `n8n-nodes-base.if` | Condition |
| `n8n-nodes-base.emailSend` | Envoi d'email |
| `n8n-nodes-base.httpRequest` | Requête HTTP |
| `n8n-nodes-base.code` | Code JavaScript |

**Exemple d'ajout :**
```
Ajoute un nœud de type "n8n-nodes-base.set" appelé "Prepare Data" 
au workflow "gpt_generator"
```

---

## 💡 Exemples Pratiques

### Exemple 1 : Ajouter une Notification

**Objectif** : Ajouter un email de notification après génération

```
Ajoute un nœud "Email Send" appelé "Notification Admin" 
au workflow "gpt_generator" et connecte-le au nœud "Envoi Email"
```

---

### Exemple 2 : Créer un Workflow de Test

**Objectif** : Créer un workflow simple pour tester

```
Crée un nouveau workflow "Test Email" avec :
1. Un webhook sur le path "test-email"
2. Un nœud Set qui définit les variables
3. Un nœud Email Send qui envoie un email
Connecte-les dans cet ordre
```

---

### Exemple 3 : Modifier en Masse

**Objectif** : Changer un paramètre dans plusieurs nœuds

```
1. Liste les workflows actifs
2. Pour chaque workflow, liste les nœuds de type "HTTP Request"
3. Modifie chaque nœud pour ajouter un header d'authentification
```

---

### Exemple 4 : Nettoyer un Workflow

**Objectif** : Supprimer les nœuds inutilisés

```
1. Liste les nœuds du workflow "gpt_generator"
2. Identifie les nœuds désactivés
3. Supprime les nœuds désactivés qui ne sont plus utilisés
```

---

## 🐛 Dépannage Rapide

### Problème : "Nœud non trouvé"

**Solution :**
```
Liste les nœuds du workflow "gpt_generator"
```
Vérifiez le nom exact du nœud (sensible à la casse).

---

### Problème : "Workflow non trouvé"

**Solution :**
```
Liste tous les workflows avec leurs IDs
```
Utilisez l'ID exact du workflow.

---

### Problème : Le serveur ne répond pas

**Solution :**
```powershell
# Redémarrer le serveur
cd mcp-server
npm start
```

---

### Problème : Erreur après modification

**Solution :**
```
1. Restaure le workflow depuis la sauvegarde
2. Vérifie la structure avec "getWorkflow"
3. Réessaye la modification
```

---

## 📚 Commandes Utiles

### Obtenir l'ID d'un Workflow
```
Liste tous les workflows et montre leurs IDs
```

### Voir les Détails d'un Workflow
```
Montre-moi les détails complets du workflow "gpt_generator"
```

### Voir les Statistiques
```
Montre-moi les statistiques de n8n
```

### Tester un Webhook
```
Teste le webhook "formulaire-doc" avec les données : nom=Test, email=test@example.com
```

---

## 🎓 Prochaines Étapes

### Niveau Débutant
1. ✅ Lister les workflows et nœuds
2. ✅ Dupliquer un workflow
3. ✅ Modifier un paramètre simple

### Niveau Intermédiaire
1. ✅ Ajouter un nœud avec connexions
2. ✅ Créer un workflow simple
3. ✅ Modifier plusieurs nœuds

### Niveau Avancé
1. ✅ Créer des workflows complexes
2. ✅ Automatiser la maintenance
3. ✅ Migrer des configurations

---

## 📖 Documentation Complète

- **Guide détaillé** : `mcp-server/WORKFLOW_EDITING.md`
- **README MCP** : `mcp-server/README.md`
- **Règles Continue** : `.continue/rules/new-rule.md`
- **Résumé des mises à jour** : `MCP_UPDATE_SUMMARY.md`

---

## 🎉 Vous êtes Prêt !

Vous savez maintenant :
- ✅ Démarrer le serveur MCP
- ✅ Lister les workflows et nœuds
- ✅ Modifier des nœuds
- ✅ Ajouter des nœuds
- ✅ Créer et dupliquer des workflows
- ✅ Dépanner les problèmes courants

**Commencez par :**
```
Liste tous mes workflows n8n
```

Bon développement ! 🚀

