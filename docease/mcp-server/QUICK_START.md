# 🚀 Guide de Démarrage Rapide - Serveur MCP n8n

Ce guide vous aidera à configurer et utiliser le serveur MCP pour n8n en quelques minutes.

## ✅ Prérequis

Avant de commencer, assurez-vous que :

1. **n8n est en cours d'exécution**
   ```powershell
   # Depuis la racine du projet
   .\start.bat
   ```

2. **Node.js est installé** (version 18+)
   ```powershell
   node --version
   ```

## 📦 Installation

### Étape 1 : Installer les dépendances

```powershell
cd mcp-server
npm install
```

### Étape 2 : Compiler le serveur

```powershell
npm run build
```

### Étape 3 : Tester la configuration

```powershell
.\test-server.ps1
```

Si tous les tests passent, vous êtes prêt ! ✅

## 🔧 Configuration de la Clé API n8n

### Obtenir votre clé API

1. Ouvrez n8n : http://localhost:5678
2. Allez dans **Settings** → **API**
3. Cliquez sur **Create API Key**
4. Copiez la clé générée

### Configurer la clé dans le serveur

La clé API est déjà configurée dans le code. Si vous devez la changer :

1. Ouvrez `src/index.ts`
2. Modifiez la ligne :
   ```typescript
   const N8N_API_KEY = "votre-nouvelle-cle";
   ```
3. Recompilez :
   ```powershell
   npm run build
   ```

## 🎯 Utilisation avec Continue

### Configuration automatique

Le serveur MCP est déjà configuré dans `.continue/mcpServers/new-mcp-server.yaml`.

### Tester le serveur

Dans Continue, essayez ces commandes :

#### 1. Lister les workflows
```
Liste tous mes workflows n8n
```

#### 2. Obtenir le statut
```
Quel est le statut de n8n ?
```

#### 3. Voir les statistiques
```
Montre-moi les statistiques de n8n
```

#### 4. Générer un document
```
Génère un document pour Jean Dupont (jean@example.com) avec le sujet "Test"
```

## 🛠️ Outils Disponibles

### Workflows
- `listWorkflows` - Liste tous les workflows
- `getWorkflow` - Détails d'un workflow
- `toggleWorkflow` - Active/désactive un workflow

### Exécutions
- `listExecutions` - Liste les exécutions
- `getExecution` - Détails d'une exécution
- `triggerWorkflow` - Déclenche un workflow

### Webhooks
- `testWebhook` - Teste un webhook

### Documents
- `generateDocument` - Génère un document Word

### Système
- `getStatus` - Statut de n8n
- `getStatistics` - Statistiques globales

## 📝 Exemples d'Utilisation

### Exemple 1 : Lister les workflows actifs

**Commande Continue :**
```
Liste tous les workflows actifs
```

**Résultat :**
```json
{
  "workflows": [
    {
      "id": "1",
      "name": "gpt_generator",
      "active": true,
      "tags": []
    }
  ]
}
```

### Exemple 2 : Déclencher un workflow

**Commande Continue :**
```
Déclenche le workflow "gpt_generator" avec les données suivantes :
- nom: Jean Dupont
- email: jean@example.com
```

**Résultat :**
```
🚀 Workflow déclenché avec succès
Execution ID: abc123
Statut: en cours
```

### Exemple 3 : Voir les statistiques

**Commande Continue :**
```
Montre-moi les statistiques de n8n
```

**Résultat :**
```json
{
  "workflows": {
    "total": 5,
    "active": 3,
    "inactive": 2
  },
  "executions": {
    "total": 100,
    "successful": 95,
    "failed": 5,
    "successRate": "95.00%"
  }
}
```

## 🐛 Dépannage

### Problème : "n8n n'est pas accessible"

**Solution :**
```powershell
# Démarrez n8n
cd ..
.\start.bat
```

### Problème : "Erreur d'authentification"

**Solution :**
1. Vérifiez que votre clé API est correcte
2. Vérifiez que l'API publique est activée dans n8n
3. Testez manuellement :
   ```powershell
   curl http://localhost:5678/api/v1/workflows -H "X-N8N-API-KEY: votre-cle"
   ```

### Problème : "Serveur MCP non compilé"

**Solution :**
```powershell
npm run build
```

### Problème : Le serveur ne répond pas

**Solution :**
1. Vérifiez les logs :
   ```powershell
   npm start
   ```
2. Vérifiez que n8n est accessible
3. Redémarrez le serveur MCP

## 📚 Ressources

- [README complet](README.md)
- [Documentation n8n API](https://docs.n8n.io/api/)
- [Continue Documentation](https://continue.dev/docs)

## 🎉 Prochaines Étapes

Maintenant que votre serveur MCP est configuré, vous pouvez :

1. **Explorer les workflows** : Utilisez `listWorkflows` pour voir tous vos workflows
2. **Automatiser** : Créez des scripts qui utilisent les outils MCP
3. **Monitorer** : Utilisez `getStatistics` pour suivre vos workflows
4. **Développer** : Ajoutez de nouveaux outils dans `src/index.ts`

Bon développement ! 🚀

