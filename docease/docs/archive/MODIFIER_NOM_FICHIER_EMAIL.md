# Modifier le nom du fichier dans l'email

## Problème
Actuellement, le fichier Word envoyé par email s'appelle `Document_undefined_123456.docx` au lieu d'utiliser le nom du template (ex: `Lettre_Désignation_123456.docx`).

## Solution

Le formulaire envoie maintenant un champ `templateName` dans le payload qui contient le nom lisible du template (ex: "Lettre de Désignation").

### Étape 1 : Ajouter un node pour renommer le fichier

1. **Ouvrez votre workflow** dans n8n (http://localhost:5678)
2. **Trouvez le node "Envoi Email"**
3. **Ajoutez un node "Code"** AVANT le node "Envoi Email"
4. **Nommez-le** : "Renommer Fichier"
5. **Configurez le code** :

```javascript
// Récupérer le nom du template depuis les données
const templateName = $input.item.json.templateName || 'Document';

// Nettoyer le nom (remplacer espaces par underscores, retirer caractères spéciaux)
const cleanName = templateName
  .replace(/\s+/g, '_')
  .replace(/[àâäéèêëïîôùûüÿç]/g, (match) => {
    const accents = { 'à': 'a', 'â': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'ï': 'i', 'î': 'i', 'ô': 'o', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ÿ': 'y', 'ç': 'c' };
    return accents[match] || match;
  })
  .replace(/[^a-zA-Z0-9_-]/g, '');

// Générer un timestamp
const timestamp = Date.now();

// Nouveau nom de fichier
const newFileName = `${cleanName}_${timestamp}.docx`;

// Récupérer le binaire existant
const binaryData = $input.item.binary.data;

// Retourner avec le nouveau nom de fichier
return {
  json: $input.item.json,
  binary: {
    data: {
      data: binaryData.data,
      mimeType: binaryData.mimeType,
      fileName: newFileName
    }
  }
};
```

6. **Connectez** : `Webhook validate-doc` → `Renommer Fichier` → `Envoi Email`
7. **Sauvegardez** le workflow

### Étape 2 : Tester

1. Remplissez le formulaire
2. Sélectionnez un template (ex: "Lettre de Désignation")
3. Cliquez sur "Partager"
4. Ajoutez un email
5. Cliquez sur "Générer et envoyer"
6. Vérifiez l'email reçu : le fichier devrait s'appeler `Lettre_de_Désignation_123456.docx`

## Résultat

✅ Le fichier Word envoyé par email porte maintenant le nom du template au lieu de "Document_undefined"

**Exemples de noms de fichiers :**
- `Lettre_de_Désignation_1699876543210.docx`
- `Mandat_de_Négociation_1699876543211.docx`

