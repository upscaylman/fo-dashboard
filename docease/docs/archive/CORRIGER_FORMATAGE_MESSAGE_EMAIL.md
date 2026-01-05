# Corriger le formatage du message email dans n8n

## Problème

Dans les emails reçus, les caractères `\\n\\` apparaissent littéralement au lieu d'être convertis en sauts de ligne. Cela se produit parce que l'expression n8n utilise des doubles backslashes au lieu de simples backslashes.

## Solution

Dans votre workflow n8n, dans le nœud "Envoi Email" (ou équivalent), modifiez l'expression du champ **Text** (ou **Message**) :

### ❌ Expression incorrecte (actuelle)

```
{{ $json.customEmailMessage || ('Bonjour ' + ($json.nomDestinataire || 'Madame, Monsieur') + ',\\n\\nVeuillez trouver ci-joint le courrier de notre Fédération FO, \\n\\Fait pour valoir ce que de droit.\\n\\nCordialement,\\nFO METAUX') }}
```

### ✅ Expression correcte

```
{{ $json.customEmailMessage || ('Bonjour ' + ($json.nomDestinataire || 'Madame, Monsieur') + ',\n\nVeuillez trouver ci-joint le courrier de notre Fédération FO,\nFait pour valoir ce que de droit.\n\nCordialement,\nFO METAUX') }}
```

**Changements :**
- Remplacez `\\n\\` par `\n` (simple backslash + n)
- Remplacez `\\n` par `\n` (simple backslash + n)

## Alternative : Utiliser une fonction pour convertir les sauts de ligne

Si vous voulez être sûr que les sauts de ligne sont correctement traités, vous pouvez utiliser une fonction dans n8n :

### Option 1 : Utiliser `.replace()` pour convertir les `\n` échappés

Dans le champ **Text** du nœud Email :

```
{{ ($json.customEmailMessage || ('Bonjour ' + ($json.nomDestinataire || 'Madame, Monsieur') + ',\n\nVeuillez trouver ci-joint le courrier de notre Fédération FO,\nFait pour valoir ce que de droit.\n\nCordialement,\nFO METAUX')).replace(/\\n/g, '\n') }}
```

### Option 2 : Utiliser un nœud Code avant l'envoi Email

1. **Ajoutez un nœud "Code"** avant le nœud "Envoi Email"
2. **Nommez-le** : "Formatter Message Email"
3. **Code** :

```javascript
// Récupérer le message personnalisé ou utiliser le message par défaut
const customMessage = $input.item.json.customEmailMessage;
const nomDestinataire = $input.item.json.nomDestinataire || 'Madame, Monsieur';

const defaultMessage = `Bonjour ${nomDestinataire},

Veuillez trouver ci-joint le courrier de notre Fédération FO,
Fait pour valoir ce que de droit.

Cordialement,
FO METAUX`;

// Utiliser le message personnalisé s'il existe, sinon le message par défaut
const message = customMessage || defaultMessage;

// S'assurer que les sauts de ligne sont correctement formatés
// (convertir les \n échappés en vrais sauts de ligne si nécessaire)
const formattedMessage = message.replace(/\\n/g, '\n');

// Retourner avec le message formaté
return {
  json: {
    ...$input.item.json,
    formattedEmailMessage: formattedMessage
  }
};
```

4. **Dans le nœud "Envoi Email"**, utilisez :
   ```
   {{ $json.formattedEmailMessage }}
   ```

## Vérification

Après avoir modifié l'expression dans n8n :

1. **Testez le workflow** avec des données de test
2. **Vérifiez l'email reçu** : les sauts de ligne doivent apparaître correctement
3. **Si le problème persiste**, utilisez l'Option 2 avec le nœud Code

## Note importante

Le code JavaScript envoie déjà le message avec de vrais sauts de ligne (`\n`). Quand le message est sérialisé en JSON avec `JSON.stringify()`, les sauts de ligne sont échappés en `\\n` dans le JSON, mais n8n devrait automatiquement les convertir en vrais sauts de ligne lors de l'utilisation dans une expression.

Le problème vient uniquement de l'expression par défaut dans n8n qui utilise des doubles backslashes (`\\n\\`) au lieu de simples backslashes (`\n`).

