import json
import requests

# Charger le workflow
with open('workflow_clean.json', 'r', encoding='utf-8') as f:
    workflow = json.load(f)

# Créer le nouveau nœud "Fusionner Données"
fusionner_node = {
    "parameters": {
        "jsCode": "// Récupérer les données de base\nconst baseData = {...$('Preparer Donnees').item.json};\n\n// Vérifier si on vient du chemin IA\ntry {\n  const iaNode = $('Extraire Texte IA');\n  if (iaNode && iaNode.item && iaNode.item.json && iaNode.item.json.texteIa) {\n    baseData.texteIa = iaNode.item.json.texteIa;\n    console.log('✅ Texte IA utilisé:', baseData.texteIa.substring(0, 50));\n  } else {\n    console.log('ℹ️ Pas d\\'IA, texte original utilisé');\n  }\n} catch (e) {\n  console.log('ℹ️ Chemin sans IA');\n}\n\nreturn {\n  json: baseData,\n  binary: items[0].binary\n};"
    },
    "type": "n8n-nodes-base.code",
    "typeVersion": 2,
    "position": [-192, 336],
    "id": "fusionner-donnees-node-123",
    "name": "Fusionner Donnees"
}

# Ajouter le nœud
workflow['nodes'].append(fusionner_node)

# Modifier le nœud "Remplir Template Docx"
for node in workflow['nodes']:
    if node['name'] == 'Remplir Template Docx':
        node['parameters']['context'] = "={{ $json }}"
        print(f"✅ Modifié 'Remplir Template Docx' context")
    
    # Corriger "Extraire Texte IA" pour utiliser texteIa
    if node['name'] == 'Extraire Texte IA':
        for assignment in node['parameters']['assignments']['assignments']:
            if assignment['id'] == 'texte_ia_genere':
                assignment['name'] = 'texteIa'
                assignment['value'] = "={{ $json.response || $('Preparer Donnees').item.json.texteIa }}"
                print(f"✅ Modifié 'Extraire Texte IA' pour utiliser texteIa")

# Modifier les connexions
# Déconnecter "Lire Template Word" -> "Remplir Template Docx"
# Connecter "Lire Template Word" -> "Fusionner Donnees" -> "Remplir Template Docx"
workflow['connections']['Lire Template Word'] = {
    "main": [[{"node": "Fusionner Donnees", "type": "main", "index": 0}]]
}
workflow['connections']['Fusionner Donnees'] = {
    "main": [[{"node": "Remplir Template Docx", "type": "main", "index": 0}]]
}

print(f"✅ Connexions modifiées")

# Sauvegarder
with open('workflow_modified.json', 'w', encoding='utf-8') as f:
    json.dump(workflow, f, ensure_ascii=False, indent=2)

print(f"✅ Workflow modifié sauvegardé dans workflow_modified.json")

# Envoyer à n8n via API
api_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmZWQwN2QzMi0wYzI0LTQ1N2UtYmU0Yi0xNWZjYzMxY2ZkNDgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzMDM4NDI3LCJleHAiOjE3NjU1ODA0MDB9.whMoo_gRuI9QbB2pdsnaIobePIgMzvWj1sf4odzbTqU'
headers = {
    'X-N8N-API-KEY': api_key,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Préparer les données pour l'API (enlever les champs read-only)
workflow_data = {
    'name': workflow['name'],
    'nodes': workflow['nodes'],
    'connections': workflow['connections'],
    'settings': workflow.get('settings', {}),
    'staticData': workflow.get('staticData')
}

response = requests.put(
    f"http://localhost:5678/api/v1/workflows/{workflow['id']}",
    headers=headers,
    json=workflow_data
)

if response.status_code == 200:
    print(f"✅ Workflow mis à jour avec succès dans n8n!")
else:
    print(f"❌ Erreur: {response.status_code}")
    print(response.text)

