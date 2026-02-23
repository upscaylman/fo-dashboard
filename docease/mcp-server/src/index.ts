import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Configuration de l'API n8n
const N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYyMzM0ODYwfQ.fpTt-_uIrHapegudvprjOcL6XqrdCdaDxnI0UBk2jrk";
const N8N_BASE_URL = process.env.N8N_BASE_URL || "http://localhost:5678/api/v1";

// Headers pour les requêtes API n8n
const getHeaders = () => ({
  "X-N8N-API-KEY": N8N_API_KEY,
  "Content-Type": "application/json",
  "Accept": "application/json"
});

// Fonction utilitaire pour faire des requêtes à l'API n8n
async function n8nRequest(endpoint: string, method: string = "GET", body?: any) {
  const url = `${N8N_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Erreur de connexion à n8n: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Créer une instance du serveur MCP
const server = new McpServer({
  name: "n8n-mcp-server",
  version: "2.0.0",
  capabilities: {
    tools: {},
    resources: {}
  }
});

// ============================================================================
// OUTILS POUR LES WORKFLOWS
// ============================================================================

// Lister tous les workflows
server.registerTool(
  "listWorkflows",
  {
    title: "Lister les Workflows",
    description: "Récupère la liste de tous les workflows n8n disponibles",
    inputSchema: {
      active: z.boolean().optional().describe("Filtrer par workflows actifs (true) ou inactifs (false)")
    }
  },
  async ({ active }) => {
    try {
      const params = active !== undefined ? `?active=${active}` : "";
      const data = await n8nRequest(`/workflows${params}`) as any;

      const workflows = data.data || [];
      const summary = workflows.map((w: any) => ({
        id: w.id,
        name: w.name,
        active: w.active,
        tags: w.tags,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      }));

      return {
        content: [
          {
            type: "text",
            text: `📋 ${workflows.length} workflow(s) trouvé(s)\n\n${JSON.stringify(summary, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des workflows: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Obtenir les détails d'un workflow
server.registerTool(
  "getWorkflow",
  {
    title: "Obtenir un Workflow",
    description: "Récupère les détails complets d'un workflow spécifique",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow à récupérer")
    }
  },
  async ({ workflowId }) => {
    try {
      const workflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      return {
        content: [
          {
            type: "text",
            text: `📄 Workflow: ${workflow.name}\n\n${JSON.stringify(workflow, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Activer/Désactiver un workflow
server.registerTool(
  "toggleWorkflow",
  {
    title: "Activer/Désactiver un Workflow",
    description: "Active ou désactive un workflow n8n",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow"),
      active: z.boolean().describe("true pour activer, false pour désactiver")
    }
  },
  async ({ workflowId, active }) => {
    try {
      const result = await n8nRequest(`/workflows/${workflowId}`, "PATCH", { active }) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Workflow "${result.name}" ${active ? 'activé' : 'désactivé'} avec succès`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la modification du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);


// ============================================================================
// OUTILS POUR LES EXÉCUTIONS
// ============================================================================

// Lister les exécutions
server.registerTool(
  "listExecutions",
  {
    title: "Lister les Exécutions",
    description: "Récupère la liste des exécutions de workflows",
    inputSchema: {
      workflowId: z.string().optional().describe("ID du workflow pour filtrer les exécutions"),
      limit: z.number().optional().default(20).describe("Nombre maximum d'exécutions à retourner (défaut: 20)"),
      status: z.enum(["success", "error", "waiting", "running"]).optional().describe("Filtrer par statut")
    }
  },
  async ({ workflowId, limit, status }) => {
    try {
      let params = `?limit=${limit || 20}`;
      if (workflowId) params += `&workflowId=${workflowId}`;
      if (status) params += `&status=${status}`;

      const data = await n8nRequest(`/executions${params}`) as any;
      const executions = data.data || [];

      const summary = executions.map((e: any) => ({
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflowData?.name,
        status: e.status,
        mode: e.mode,
        startedAt: e.startedAt,
        stoppedAt: e.stoppedAt,
        finished: e.finished
      }));

      return {
        content: [
          {
            type: "text",
            text: `🔄 ${executions.length} exécution(s) trouvée(s)\n\n${JSON.stringify(summary, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des exécutions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Obtenir les détails d'une exécution
server.registerTool(
  "getExecution",
  {
    title: "Obtenir une Exécution",
    description: "Récupère les détails complets d'une exécution spécifique",
    inputSchema: {
      executionId: z.string().describe("ID de l'exécution à récupérer")
    }
  },
  async ({ executionId }) => {
    try {
      const execution = await n8nRequest(`/executions/${executionId}`) as any;

      return {
        content: [
          {
            type: "text",
            text: `📊 Exécution ${executionId}\nWorkflow: ${execution.workflowData?.name}\nStatut: ${execution.status}\n\n${JSON.stringify(execution, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'exécution: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Déclencher un workflow
server.registerTool(
  "triggerWorkflow",
  {
    title: "Déclencher un Workflow",
    description: "Déclenche manuellement l'exécution d'un workflow avec des données optionnelles",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow à déclencher"),
      data: z.record(z.unknown()).optional().describe("Données à passer au workflow")
    }
  },
  async ({ workflowId, data }) => {
    try {
      const result = await n8nRequest(`/workflows/${workflowId}/execute`, "POST", data) as any;

      return {
        content: [
          {
            type: "text",
            text: `🚀 Workflow déclenché avec succès\nExecution ID: ${result.executionId}\nStatut: ${result.status || 'en cours'}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors du déclenchement du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// ============================================================================
// OUTILS POUR LES WEBHOOKS
// ============================================================================

// Tester un webhook
server.registerTool(
  "testWebhook",
  {
    title: "Tester un Webhook",
    description: "Envoie une requête de test à un webhook n8n",
    inputSchema: {
      webhookPath: z.string().describe("Chemin du webhook (ex: 'formulaire-doc')"),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("POST").describe("Méthode HTTP"),
      data: z.record(z.unknown()).optional().describe("Données à envoyer au webhook")
    }
  },
  async ({ webhookPath, method, data }) => {
    try {
      const webhookUrl = `${N8N_BASE_URL.replace('/api/v1', '')}/webhook/${webhookPath}`;

      const response = await fetch(webhookUrl, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: data ? JSON.stringify(data) : undefined
      });

      const responseText = await response.text();

      return {
        content: [
          {
            type: "text",
            text: `🌐 Webhook testé\nURL: ${webhookUrl}\nStatut: ${response.status}\nRéponse:\n${responseText}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors du test du webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// ============================================================================
// OUTILS SPÉCIFIQUES AU PROJET (Génération de documents)
// ============================================================================

// Générer un document via le workflow
server.registerTool(
  "generateDocument",
  {
    title: "Générer un Document",
    description: "Génère un document Word via le workflow n8n de génération de documents",
    inputSchema: {
      nom: z.string().describe("Nom du destinataire"),
      email: z.string().email().describe("Email du destinataire"),
      sujet: z.string().describe("Sujet du document"),
      description: z.string().describe("Description ou contenu du document"),
      useIA: z.boolean().optional().default(false).describe("Utiliser l'IA pour générer du contenu"),
      template: z.string().optional().default("template.docx").describe("Nom du template Word à utiliser")
    }
  },
  async ({ nom, email, sujet, description, useIA, template }) => {
    try {
      const webhookUrl = `${N8N_BASE_URL.replace('/api/v1', '')}/webhook/formulaire-doc`;

      const payload = {
        nom,
        email,
        sujet,
        description,
        useIA,
        template
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.text();

      return {
        content: [
          {
            type: "text",
            text: `📄 Document généré avec succès\n\nDétails:\n- Nom: ${nom}\n- Email: ${email}\n- Sujet: ${sujet}\n- IA utilisée: ${useIA ? 'Oui' : 'Non'}\n- Template: ${template}\n\nRéponse:\n${result}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la génération du document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);


// ============================================================================
// OUTILS DE MODIFICATION DES WORKFLOWS
// ============================================================================

// Créer un nouveau workflow
server.registerTool(
  "createWorkflow",
  {
    title: "Créer un Workflow",
    description: "Crée un nouveau workflow n8n à partir de zéro ou d'une structure existante",
    inputSchema: {
      name: z.string().describe("Nom du nouveau workflow"),
      nodes: z.array(z.any()).optional().describe("Liste des nœuds du workflow (format n8n)"),
      connections: z.record(z.any()).optional().describe("Connexions entre les nœuds"),
      settings: z.record(z.any()).optional().describe("Paramètres du workflow"),
      active: z.boolean().optional().default(false).describe("Activer le workflow après création")
    }
  },
  async ({ name, nodes, connections, settings, active }) => {
    try {
      const workflowData: any = {
        name,
        nodes: nodes || [],
        connections: connections || {},
        settings: settings || {},
        active
      };

      const result = await n8nRequest("/workflows", "POST", workflowData) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Workflow "${name}" créé avec succès\n\nID: ${result.id}\nNœuds: ${result.nodes?.length || 0}\nActif: ${result.active ? 'Oui' : 'Non'}\n\n${JSON.stringify(result, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Mettre à jour un workflow complet
server.registerTool(
  "updateWorkflow",
  {
    title: "Mettre à Jour un Workflow",
    description: "Met à jour un workflow existant avec de nouvelles données (nœuds, connexions, paramètres)",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow à modifier"),
      name: z.string().optional().describe("Nouveau nom du workflow"),
      nodes: z.array(z.any()).optional().describe("Nouvelle liste des nœuds"),
      connections: z.record(z.any()).optional().describe("Nouvelles connexions"),
      settings: z.record(z.any()).optional().describe("Nouveaux paramètres"),
      active: z.boolean().optional().describe("Activer/désactiver le workflow")
    }
  },
  async ({ workflowId, name, nodes, connections, settings, active }) => {
    try {
      // Récupérer le workflow actuel
      const currentWorkflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      // Préparer les données de mise à jour
      const updateData: any = {
        name: name || currentWorkflow.name,
        nodes: nodes || currentWorkflow.nodes,
        connections: connections || currentWorkflow.connections,
        settings: settings || currentWorkflow.settings
      };

      if (active !== undefined) {
        updateData.active = active;
      }

      const result = await n8nRequest(`/workflows/${workflowId}`, "PUT", updateData) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Workflow "${result.name}" mis à jour avec succès\n\nID: ${result.id}\nNœuds: ${result.nodes?.length || 0}\nActif: ${result.active ? 'Oui' : 'Non'}\n\nModifications appliquées:\n${name ? '- Nom modifié\n' : ''}${nodes ? '- Nœuds modifiés\n' : ''}${connections ? '- Connexions modifiées\n' : ''}${settings ? '- Paramètres modifiés\n' : ''}${active !== undefined ? '- Statut modifié\n' : ''}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Dupliquer un workflow
server.registerTool(
  "duplicateWorkflow",
  {
    title: "Dupliquer un Workflow",
    description: "Crée une copie d'un workflow existant avec un nouveau nom",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow à dupliquer"),
      newName: z.string().describe("Nom du nouveau workflow"),
      active: z.boolean().optional().default(false).describe("Activer le workflow dupliqué")
    }
  },
  async ({ workflowId, newName, active }) => {
    try {
      // Récupérer le workflow source
      const sourceWorkflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      // Créer une copie avec le nouveau nom
      const duplicateData = {
        name: newName,
        nodes: sourceWorkflow.nodes,
        connections: sourceWorkflow.connections,
        settings: sourceWorkflow.settings,
        active
      };

      const result = await n8nRequest("/workflows", "POST", duplicateData) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Workflow dupliqué avec succès\n\nWorkflow source: ${sourceWorkflow.name} (${workflowId})\nNouveau workflow: ${result.name} (${result.id})\nNœuds copiés: ${result.nodes?.length || 0}\nActif: ${result.active ? 'Oui' : 'Non'}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la duplication du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Modifier un nœud spécifique dans un workflow
server.registerTool(
  "updateNode",
  {
    title: "Modifier un Nœud",
    description: "Modifie les paramètres d'un nœud spécifique dans un workflow",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow"),
      nodeName: z.string().describe("Nom du nœud à modifier"),
      parameters: z.record(z.any()).optional().describe("Nouveaux paramètres du nœud"),
      position: z.array(z.number()).optional().describe("Nouvelle position [x, y]"),
      disabled: z.boolean().optional().describe("Désactiver/activer le nœud")
    }
  },
  async ({ workflowId, nodeName, parameters, position, disabled }) => {
    try {
      // Récupérer le workflow
      const workflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      // Trouver le nœud
      const nodeIndex = workflow.nodes.findIndex((n: any) => n.name === nodeName);

      if (nodeIndex === -1) {
        throw new Error(`Nœud "${nodeName}" non trouvé dans le workflow`);
      }

      // Modifier le nœud
      if (parameters) {
        workflow.nodes[nodeIndex].parameters = {
          ...workflow.nodes[nodeIndex].parameters,
          ...parameters
        };
      }

      if (position) {
        workflow.nodes[nodeIndex].position = position;
      }

      if (disabled !== undefined) {
        workflow.nodes[nodeIndex].disabled = disabled;
      }

      // Sauvegarder le workflow
      const result = await n8nRequest(`/workflows/${workflowId}`, "PUT", workflow) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Nœud "${nodeName}" modifié avec succès\n\nWorkflow: ${result.name}\nType de nœud: ${workflow.nodes[nodeIndex].type}\n\nModifications:\n${parameters ? '- Paramètres mis à jour\n' : ''}${position ? '- Position modifiée\n' : ''}${disabled !== undefined ? `- ${disabled ? 'Désactivé' : 'Activé'}\n` : ''}\n\nNouveau nœud:\n${JSON.stringify(workflow.nodes[nodeIndex], null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la modification du nœud: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);


// Ajouter un nœud à un workflow
server.registerTool(
  "addNode",
  {
    title: "Ajouter un Nœud",
    description: "Ajoute un nouveau nœud à un workflow existant",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow"),
      nodeType: z.string().describe("Type du nœud (ex: 'n8n-nodes-base.webhook', 'n8n-nodes-base.set')"),
      nodeName: z.string().describe("Nom du nœud"),
      parameters: z.record(z.any()).optional().describe("Paramètres du nœud"),
      position: z.array(z.number()).optional().describe("Position [x, y] du nœud"),
      connectTo: z.string().optional().describe("Nom du nœud auquel se connecter")
    }
  },
  async ({ workflowId, nodeType, nodeName, parameters, position, connectTo }) => {
    try {
      // Récupérer le workflow
      const workflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      // Vérifier que le nom n'existe pas déjà
      if (workflow.nodes.some((n: any) => n.name === nodeName)) {
        throw new Error(`Un nœud nommé "${nodeName}" existe déjà dans ce workflow`);
      }

      // Créer le nouveau nœud
      const newNode: any = {
        id: `node-${Date.now()}`,
        name: nodeName,
        type: nodeType,
        typeVersion: 1,
        position: position || [0, 0],
        parameters: parameters || {}
      };

      // Ajouter le nœud
      workflow.nodes.push(newNode);

      // Créer la connexion si spécifiée
      if (connectTo) {
        if (!workflow.connections[connectTo]) {
          workflow.connections[connectTo] = { main: [[]] };
        }
        if (!workflow.connections[connectTo].main) {
          workflow.connections[connectTo].main = [[]];
        }
        if (!workflow.connections[connectTo].main[0]) {
          workflow.connections[connectTo].main[0] = [];
        }

        workflow.connections[connectTo].main[0].push({
          node: nodeName,
          type: "main",
          index: 0
        });
      }

      // Sauvegarder le workflow
      const result = await n8nRequest(`/workflows/${workflowId}`, "PUT", workflow) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Nœud "${nodeName}" ajouté avec succès\n\nWorkflow: ${result.name}\nType: ${nodeType}\nPosition: [${position?.[0] || 0}, ${position?.[1] || 0}]\n${connectTo ? `Connecté à: ${connectTo}\n` : ''}\n\nNœud créé:\n${JSON.stringify(newNode, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'ajout du nœud: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Supprimer un nœud d'un workflow
server.registerTool(
  "deleteNode",
  {
    title: "Supprimer un Nœud",
    description: "Supprime un nœud d'un workflow et ses connexions",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow"),
      nodeName: z.string().describe("Nom du nœud à supprimer")
    }
  },
  async ({ workflowId, nodeName }) => {
    try {
      // Récupérer le workflow
      const workflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      // Trouver le nœud
      const nodeIndex = workflow.nodes.findIndex((n: any) => n.name === nodeName);

      if (nodeIndex === -1) {
        throw new Error(`Nœud "${nodeName}" non trouvé dans le workflow`);
      }

      // Supprimer le nœud
      const deletedNode = workflow.nodes.splice(nodeIndex, 1)[0];

      // Supprimer les connexions vers ce nœud
      Object.keys(workflow.connections).forEach(sourceNode => {
        if (workflow.connections[sourceNode].main) {
          workflow.connections[sourceNode].main = workflow.connections[sourceNode].main.map((connections: any[]) =>
            connections.filter((conn: any) => conn.node !== nodeName)
          );
        }
      });

      // Supprimer les connexions depuis ce nœud
      delete workflow.connections[nodeName];

      // Sauvegarder le workflow
      const result = await n8nRequest(`/workflows/${workflowId}`, "PUT", workflow) as any;

      return {
        content: [
          {
            type: "text",
            text: `✅ Nœud "${nodeName}" supprimé avec succès\n\nWorkflow: ${result.name}\nType de nœud supprimé: ${deletedNode.type}\nNœuds restants: ${result.nodes?.length || 0}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du nœud: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Lister les nœuds d'un workflow
server.registerTool(
  "listNodes",
  {
    title: "Lister les Nœuds",
    description: "Liste tous les nœuds d'un workflow avec leurs détails",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow")
    }
  },
  async ({ workflowId }) => {
    try {
      const workflow = await n8nRequest(`/workflows/${workflowId}`) as any;

      const nodesSummary = workflow.nodes.map((node: any) => ({
        name: node.name,
        type: node.type,
        position: node.position,
        disabled: node.disabled || false,
        parameters: Object.keys(node.parameters || {})
      }));

      return {
        content: [
          {
            type: "text",
            text: `📋 Nœuds du workflow "${workflow.name}"\n\nTotal: ${workflow.nodes.length} nœud(s)\n\n${JSON.stringify(nodesSummary, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des nœuds: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Supprimer un workflow
server.registerTool(
  "deleteWorkflow",
  {
    title: "Supprimer un Workflow",
    description: "Supprime définitivement un workflow",
    inputSchema: {
      workflowId: z.string().describe("ID du workflow à supprimer"),
      confirm: z.boolean().describe("Confirmation de suppression (doit être true)")
    }
  },
  async ({ workflowId, confirm }) => {
    try {
      if (!confirm) {
        throw new Error("Suppression annulée : la confirmation est requise (confirm: true)");
      }

      // Récupérer le nom avant suppression
      const workflow = await n8nRequest(`/workflows/${workflowId}`) as any;
      const workflowName = workflow.name;

      // Supprimer le workflow
      await n8nRequest(`/workflows/${workflowId}`, "DELETE");

      return {
        content: [
          {
            type: "text",
            text: `✅ Workflow "${workflowName}" (${workflowId}) supprimé avec succès`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);


// ============================================================================
// OUTILS SUPPLÉMENTAIRES
// ============================================================================

// Obtenir le statut de n8n
server.registerTool(
  "getStatus",
  {
    title: "Obtenir le Statut de n8n",
    description: "Récupère les informations sur le statut et la configuration de n8n",
    inputSchema: {}
  },
  async () => {
    try {
      // Tester la connexion en récupérant les workflows
      const workflows = await n8nRequest("/workflows?limit=1") as any;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "✅ Connecté",
              baseUrl: N8N_BASE_URL,
              timestamp: new Date().toISOString(),
              workflowsCount: workflows.count || 0
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "❌ Erreur",
              baseUrl: N8N_BASE_URL,
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }
        ]
      };
    }
  }
);

// Obtenir les statistiques
server.registerTool(
  "getStatistics",
  {
    title: "Obtenir les Statistiques",
    description: "Récupère les statistiques globales de n8n (workflows, exécutions, etc.)",
    inputSchema: {}
  },
  async () => {
    try {
      const [workflowsData, executionsData] = await Promise.all([
        n8nRequest("/workflows") as Promise<any>,
        n8nRequest("/executions?limit=100") as Promise<any>
      ]);

      const workflows = workflowsData.data || [];
      const executions = executionsData.data || [];

      const activeWorkflows = workflows.filter((w: any) => w.active).length;
      const successfulExecutions = executions.filter((e: any) => e.status === "success").length;
      const failedExecutions = executions.filter((e: any) => e.status === "error").length;

      const stats = {
        workflows: {
          total: workflows.length,
          active: activeWorkflows,
          inactive: workflows.length - activeWorkflows
        },
        executions: {
          total: executions.length,
          successful: successfulExecutions,
          failed: failedExecutions,
          successRate: executions.length > 0 ? ((successfulExecutions / executions.length) * 100).toFixed(2) + "%" : "N/A"
        },
        timestamp: new Date().toISOString()
      };

      return {
        content: [
          {
            type: "text",
            text: `📊 Statistiques n8n\n\n${JSON.stringify(stats, null, 2)}`
          }
        ]
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

// Configurer le transport STDIO
const transport = new StdioServerTransport();

// Démarrer le serveur
async function main() {
  try {
    await server.connect(transport);
    console.error("✅ Serveur MCP n8n démarré avec succès");
    console.error(`📡 Connecté à: ${N8N_BASE_URL}`);
    console.error("");
    console.error("🔧 Outils disponibles (18 outils):");
    console.error("");
    console.error("  📋 Gestion des Workflows:");
    console.error("    - listWorkflows: Lister tous les workflows");
    console.error("    - getWorkflow: Obtenir les détails d'un workflow");
    console.error("    - toggleWorkflow: Activer/désactiver un workflow");
    console.error("    - createWorkflow: Créer un nouveau workflow");
    console.error("    - updateWorkflow: Mettre à jour un workflow complet");
    console.error("    - duplicateWorkflow: Dupliquer un workflow");
    console.error("    - deleteWorkflow: Supprimer un workflow");
    console.error("");
    console.error("  🔧 Gestion des Nœuds:");
    console.error("    - listNodes: Lister les nœuds d'un workflow");
    console.error("    - updateNode: Modifier un nœud spécifique");
    console.error("    - addNode: Ajouter un nœud à un workflow");
    console.error("    - deleteNode: Supprimer un nœud");
    console.error("");
    console.error("  🔄 Exécutions:");
    console.error("    - listExecutions: Lister les exécutions");
    console.error("    - getExecution: Obtenir les détails d'une exécution");
    console.error("    - triggerWorkflow: Déclencher un workflow");
    console.error("");
    console.error("  🌐 Webhooks & Documents:");
    console.error("    - testWebhook: Tester un webhook");
    console.error("    - generateDocument: Générer un document Word");
    console.error("");
    console.error("  📊 Monitoring:");
    console.error("    - getStatus: Statut de n8n");
    console.error("    - getStatistics: Statistiques globales");
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();