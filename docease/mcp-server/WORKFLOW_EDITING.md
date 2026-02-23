# 🔧 Guide d'Édition des Workflows n8n via MCP

Ce guide explique comment utiliser le serveur MCP pour modifier vos workflows n8n directement depuis Continue.

## 🎯 Nouveaux Outils Disponibles

### 📋 Gestion des Workflows

#### 1. **createWorkflow** - Créer un nouveau workflow

Crée un workflow à partir de zéro ou d'une structure existante.

**Exemples d'utilisation :**

```
Crée un nouveau workflow appelé "Test Workflow"
```

```
Crée un workflow "Email Automation" avec un nœud webhook et un nœud email
```

**Paramètres :**
- `name` : Nom du workflow (requis)
- `nodes` : Liste des nœuds (optionnel)
- `connections` : Connexions entre nœuds (optionnel)
- `settings` : Paramètres du workflow (optionnel)
- `active` : Activer après création (optionnel, défaut: false)

---

#### 2. **updateWorkflow** - Mettre à jour un workflow

Modifie un workflow existant (nom, nœuds, connexions, paramètres).

**Exemples d'utilisation :**

```
Renomme le workflow "gpt_generator" en "Document Generator v2"
```

```
Désactive le workflow avec l'ID "abc123"
```

**Paramètres :**
- `workflowId` : ID du workflow (requis)
- `name` : Nouveau nom (optionnel)
- `nodes` : Nouveaux nœuds (optionnel)
- `connections` : Nouvelles connexions (optionnel)
- `settings` : Nouveaux paramètres (optionnel)
- `active` : Activer/désactiver (optionnel)

---

#### 3. **duplicateWorkflow** - Dupliquer un workflow

Crée une copie complète d'un workflow existant.

**Exemples d'utilisation :**

```
Duplique le workflow "gpt_generator" et appelle-le "gpt_generator_backup"
```

```
Crée une copie du workflow ID "abc123" nommée "Test Copy" et active-la
```

**Paramètres :**
- `workflowId` : ID du workflow source (requis)
- `newName` : Nom de la copie (requis)
- `active` : Activer la copie (optionnel, défaut: false)

---

#### 4. **deleteWorkflow** - Supprimer un workflow

Supprime définitivement un workflow.

**Exemples d'utilisation :**

```
Supprime le workflow avec l'ID "abc123" (avec confirmation)
```

**Paramètres :**
- `workflowId` : ID du workflow (requis)
- `confirm` : Confirmation (requis, doit être true)

⚠️ **Attention** : Cette action est irréversible !

---

### 🔧 Gestion des Nœuds

#### 5. **listNodes** - Lister les nœuds

Liste tous les nœuds d'un workflow avec leurs détails.

**Exemples d'utilisation :**

```
Liste tous les nœuds du workflow "gpt_generator"
```

```
Montre-moi les nœuds du workflow ID "abc123"
```

**Paramètres :**
- `workflowId` : ID du workflow (requis)

---

#### 6. **updateNode** - Modifier un nœud

Modifie les paramètres d'un nœud spécifique.

**Exemples d'utilisation :**

```
Dans le workflow "gpt_generator", modifie le nœud "Appel IA Gemma" pour changer le prompt
```

```
Désactive le nœud "Email Send" dans le workflow ID "abc123"
```

```
Change la position du nœud "Webhook" à [100, 200]
```

**Paramètres :**
- `workflowId` : ID du workflow (requis)
- `nodeName` : Nom du nœud (requis)
- `parameters` : Nouveaux paramètres (optionnel)
- `position` : Nouvelle position [x, y] (optionnel)
- `disabled` : Désactiver/activer (optionnel)

---

#### 7. **addNode** - Ajouter un nœud

Ajoute un nouveau nœud à un workflow.

**Exemples d'utilisation :**

```
Ajoute un nœud "Set" appelé "Prepare Data" au workflow "gpt_generator"
```

```
Ajoute un nœud webhook au workflow ID "abc123" et connecte-le au nœud "Process"
```

**Paramètres :**
- `workflowId` : ID du workflow (requis)
- `nodeType` : Type du nœud (requis, ex: "n8n-nodes-base.set")
- `nodeName` : Nom du nœud (requis)
- `parameters` : Paramètres du nœud (optionnel)
- `position` : Position [x, y] (optionnel)
- `connectTo` : Nom du nœud auquel se connecter (optionnel)

**Types de nœuds courants :**
- `n8n-nodes-base.webhook` : Webhook
- `n8n-nodes-base.set` : Set (manipulation de données)
- `n8n-nodes-base.if` : If (condition)
- `n8n-nodes-base.emailSend` : Email Send
- `n8n-nodes-base.httpRequest` : HTTP Request
- `n8n-nodes-base.code` : Code (JavaScript)

---

#### 8. **deleteNode** - Supprimer un nœud

Supprime un nœud et ses connexions.

**Exemples d'utilisation :**

```
Supprime le nœud "Old Process" du workflow "gpt_generator"
```

**Paramètres :**
- `workflowId` : ID du workflow (requis)
- `nodeName` : Nom du nœud (requis)

---

## 💡 Exemples Pratiques

### Exemple 1 : Modifier le prompt d'un nœud IA

```
Dans le workflow "gpt_generator", modifie le nœud "Appel IA Gemma" pour utiliser ce prompt :
"Tu es un assistant qui génère des documents professionnels. Crée un document basé sur : {{$json.description}}"
```

### Exemple 2 : Ajouter un nœud de notification

```
Ajoute un nœud "Email Send" appelé "Notification Admin" au workflow "gpt_generator" 
et connecte-le au nœud "Envoi Email"
```

### Exemple 3 : Créer un workflow de test

```
Crée un nouveau workflow "Test Email" avec :
1. Un nœud webhook appelé "Trigger"
2. Un nœud Set appelé "Prepare Data"
3. Un nœud Email Send appelé "Send Email"
Connecte-les dans cet ordre
```

### Exemple 4 : Dupliquer et modifier

```
1. Duplique le workflow "gpt_generator" et appelle-le "gpt_generator_v2"
2. Dans "gpt_generator_v2", désactive le nœud "Appel IA Gemma"
3. Active le workflow "gpt_generator_v2"
```

### Exemple 5 : Nettoyer un workflow

```
Dans le workflow "gpt_generator" :
1. Liste tous les nœuds
2. Supprime les nœuds désactivés
3. Réorganise les positions des nœuds restants
```

---

## 🔍 Obtenir les IDs

### Trouver l'ID d'un workflow

```
Liste tous les workflows et montre leurs IDs
```

### Trouver les noms des nœuds

```
Liste les nœuds du workflow "gpt_generator"
```

---

## ⚠️ Bonnes Pratiques

### 1. Toujours sauvegarder avant modification

```
Duplique le workflow "gpt_generator" en "gpt_generator_backup" avant de le modifier
```

### 2. Tester après modification

```
Après avoir modifié le workflow, déclenche-le avec des données de test
```

### 3. Vérifier les connexions

```
Après avoir ajouté un nœud, liste les nœuds pour vérifier les connexions
```

### 4. Désactiver avant modification importante

```
Désactive le workflow avant de faire des modifications importantes
```

---

## 🐛 Dépannage

### Erreur : "Nœud non trouvé"

**Cause** : Le nom du nœud est incorrect ou n'existe pas.

**Solution** : Listez d'abord les nœuds pour voir les noms exacts :
```
Liste les nœuds du workflow "gpt_generator"
```

### Erreur : "Workflow non trouvé"

**Cause** : L'ID du workflow est incorrect.

**Solution** : Listez les workflows pour trouver le bon ID :
```
Liste tous les workflows avec leurs IDs
```

### Erreur : "Type de nœud invalide"

**Cause** : Le type de nœud spécifié n'existe pas.

**Solution** : Utilisez les types de nœuds standards (voir liste ci-dessus) ou consultez la documentation n8n.

---

## 📚 Ressources

- **Types de nœuds n8n** : https://docs.n8n.io/integrations/builtin/
- **Structure des workflows** : https://docs.n8n.io/workflows/
- **API n8n** : https://docs.n8n.io/api/

---

## 🎉 Cas d'Usage Avancés

### Automatiser la création de workflows

```
Crée 5 workflows de test nommés "Test 1" à "Test 5", chacun avec un webhook et un nœud Set
```

### Migration de workflows

```
1. Récupère le workflow "old_workflow"
2. Crée un nouveau workflow "new_workflow" avec la même structure
3. Modifie les paramètres pour la nouvelle configuration
4. Active "new_workflow"
5. Désactive "old_workflow"
```

### Monitoring et maintenance

```
1. Liste tous les workflows actifs
2. Pour chaque workflow, liste les nœuds
3. Identifie les nœuds désactivés
4. Génère un rapport
```

---

Bon développement ! 🚀

