# Serveur MCP pour n8n

Serveur MCP (Model Context Protocol) pour interagir avec n8n via son API REST.

## 🚀 Fonctionnalités

### 18 Outils Disponibles

#### 📋 Gestion des Workflows
- **listWorkflows** : Liste tous les workflows n8n
- **getWorkflow** : Obtient les détails d'un workflow spécifique
- **toggleWorkflow** : Active ou désactive un workflow
- **createWorkflow** : Crée un nouveau workflow
- **updateWorkflow** : Met à jour un workflow complet
- **duplicateWorkflow** : Duplique un workflow existant
- **deleteWorkflow** : Supprime un workflow

#### 🔧 Gestion des Nœuds
- **listNodes** : Liste les nœuds d'un workflow
- **updateNode** : Modifie un nœud spécifique
- **addNode** : Ajoute un nœud à un workflow
- **deleteNode** : Supprime un nœud

#### 🔄 Gestion des Exécutions
- **listExecutions** : Liste les exécutions de workflows
- **getExecution** : Obtient les détails d'une exécution
- **triggerWorkflow** : Déclenche manuellement un workflow

#### 🌐 Webhooks & Documents
- **testWebhook** : Teste un webhook n8n
- **generateDocument** : Génère un document Word via le workflow de génération

#### 📊 Monitoring
- **getStatus** : Obtient le statut de connexion à n8n
- **getStatistics** : Récupère les statistiques globales

## 📋 Prérequis

- Node.js 18+
- n8n en cours d'exécution (local ou distant)
- Clé API n8n configurée

## 🔧 Installation

```bash
cd mcp-server
npm install
```

## 🏗️ Compilation

```bash
npm run build
```

## 🚀 Démarrage

### En développement
```bash
npm run dev
```

### En production
```bash
npm start
```

## ⚙️ Configuration

### Variables d'environnement

- `N8N_BASE_URL` : URL de base de l'API n8n (défaut: `http://localhost:5678/api/v1`)

### Clé API

La clé API n8n est configurée dans `src/index.ts`. Pour la modifier :

1. Ouvrez `src/index.ts`
2. Modifiez la constante `N8N_API_KEY`
3. Recompilez avec `npm run build`

**⚠️ Important** : Ne commitez jamais votre clé API dans le code source !

## 📖 Utilisation avec Continue

### Configuration

Le serveur MCP est configuré dans `.continue/mcpServers/new-mcp-server.yaml` :

```yaml
schema: v1
version: 1.0.0
name: n8n MCP Server

mcpServers:
  n8n:
    command: "node"
    args:
      - "mcp-server/dist/index.js"
    env:
      N8N_BASE_URL: "http://localhost:5678/api/v1"
```

### Exemples d'utilisation

#### Lister les workflows
```
Utilise l'outil listWorkflows pour voir tous mes workflows
```

#### Activer un workflow
```
Active le workflow avec l'ID "abc123"
```

#### Générer un document
```
Génère un document pour Jean Dupont (jean@example.com) avec le sujet "Proposition commerciale"
```

#### Obtenir les statistiques
```
Montre-moi les statistiques de n8n
```

## 🔍 API n8n

### Endpoints utilisés

- `GET /workflows` : Liste des workflows
- `GET /workflows/:id` : Détails d'un workflow
- `PATCH /workflows/:id` : Modification d'un workflow
- `POST /workflows/:id/execute` : Exécution d'un workflow
- `GET /executions` : Liste des exécutions
- `GET /executions/:id` : Détails d'une exécution

### Authentification

Le serveur utilise l'authentification par clé API avec le header `X-N8N-API-KEY`.

## 🛠️ Développement

### Structure du projet

```
mcp-server/
├── src/
│   └── index.ts          # Code source principal
├── dist/                 # Code compilé
├── package.json          # Dépendances
├── tsconfig.json         # Configuration TypeScript
└── README.md            # Cette documentation
```

### Ajouter un nouvel outil

```typescript
server.registerTool(
  "nomOutil",
  {
    title: "Titre de l'Outil",
    description: "Description de ce que fait l'outil",
    inputSchema: {
      param1: z.string().describe("Description du paramètre"),
      param2: z.number().optional().describe("Paramètre optionnel")
    }
  },
  async ({ param1, param2 }) => {
    try {
      // Logique de l'outil
      const result = await n8nRequest("/endpoint", "GET");
      
      return {
        content: [
          {
            type: "text",
            text: `Résultat: ${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
```

## 🐛 Dépannage

### Le serveur ne démarre pas

1. Vérifiez que n8n est en cours d'exécution
2. Vérifiez l'URL de base dans la configuration
3. Vérifiez que la clé API est valide

### Erreur de connexion à n8n

```
Erreur de connexion à n8n: fetch failed
```

**Solution** : Vérifiez que n8n est accessible à l'URL configurée :
```bash
curl http://localhost:5678/api/v1/workflows -H "X-N8N-API-KEY: votre-cle"
```

### Erreur d'authentification

```
n8n API error (401): Unauthorized
```

**Solution** : Vérifiez que votre clé API est correcte et active dans n8n.

## 📚 Ressources

- [Documentation n8n API](https://docs.n8n.io/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Continue Documentation](https://continue.dev/docs)

## 📝 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

