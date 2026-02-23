# Diagnostic du Workflow n8n

## Problème Identifié

Le workflow n8n a **2 webhooks** mais une logique incorrecte :

### Webhook 1: `/webhook/formulaire-doc`
- **Objectif**: Générer le document Word et le retourner en base64
- **Flow actuel**: 
  1. Formulaire (Webhook) → Préparer Données → Charger Template → Générer Document → Convertir en Base64 → Réponse avec Word
- **Statut**: ✅ Devrait fonctionner correctement

### Webhook 2: `/webhook/validate-doc`
- **Objectif**: Envoyer le document Word par email
- **Flow actuel**:
  1. Validation (Webhook) → **Générer Word Final** → Envoi Email → Réponse Finale
- **Problème**: ❌ Le nœud "Générer Word Final" attend un fichier Word en base64 dans `wordfile` et lance une erreur si absent

## Problème dans le Nœud "Générer Word Final"

```javascript
const wordBase64 = $json.body?.wordfile || $json.wordfile;

if (!wordBase64) {
  throw new Error('Fichier Word manquant !');
}
```

**Ce nœud ne génère PAS le Word, il attend juste qu'on lui fournisse !**

## Solutions Possibles

### Solution 1: Modifier le nœud "Générer Word Final" (RECOMMANDÉ)
Transformer ce nœud pour qu'il génère le Word s'il n'est pas fourni :
- Si `wordfile` est vide → appeler le flow de génération
- Si `wordfile` est fourni → l'utiliser directement

### Solution 2: Créer deux flows séparés
- `/webhook/formulaire-doc` : génère et retourne le Word
- `/webhook/validate-doc` : reçoit le Word en base64 et l'envoie par email

### Solution 3: Utiliser un seul webhook avec paramètre
- Ajouter un paramètre `action` : "generate" ou "send"
- Le workflow décide quoi faire selon l'action

## Recommandation

**Solution 1** est la meilleure car :
1. Le bouton "Télécharger" peut appeler `/webhook/formulaire-doc` pour générer le Word
2. Le bouton "Générer et envoyer" peut appeler `/webhook/validate-doc` qui :
   - Utilise le Word déjà généré si fourni
   - OU génère le Word si non fourni
   - Puis envoie l'email

## Actions à Faire

1. ✅ Corriger le formulaire HTML (FAIT)
   - Bouton "Télécharger" → `/webhook/formulaire-doc`
   - Bouton "Générer et envoyer" → `/webhook/validate-doc`

2. ❌ Modifier le nœud "Générer Word Final" dans n8n
   - Supprimer l'erreur si `wordfile` est vide
   - Ajouter la logique pour générer le Word si nécessaire
   - OU créer un IF node pour router vers la génération si besoin

3. ❌ Tester les deux boutons

## Structure Idéale du Workflow

```
/webhook/formulaire-doc
  → Préparer Données
  → Charger Template
  → Générer Document (GPT)
  → Convertir en Base64
  → Réponse avec Word (JSON)

/webhook/validate-doc
  → Check if wordfile exists
     ├─ OUI → Utiliser directement
     └─ NON → Générer (même flow que formulaire-doc)
  → Envoi Email
  → Réponse Finale (JSON)
```

## Erreurs Actuelles dans n8n

Selon le code, voici les erreurs possibles :

1. **"Fichier Word manquant !"** - Le nœud "Générer Word Final" ne reçoit pas de `wordfile`
2. **"Aucun destinataire fourni !"** - Le champ `emailDestinataire` est vide
3. Erreurs de génération GPT si les variables sont manquantes
4. Erreurs SMTP si la configuration email est incorrecte

## Prochaines Étapes

1. Ouvrir n8n : http://localhost:5678/workflow/AJtlydAXDxYu7HTq
2. Modifier le nœud "Générer Word Final" pour gérer le cas où `wordfile` est vide
3. Tester le workflow avec les deux boutons

