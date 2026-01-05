# Corriger les Variables dans Docxtemplater

## 🐛 Erreur "Cannot read properties of undefined (reading 'execute')"

Cette erreur signifie que **les variables ne sont pas correctement configurées** dans le nœud Docxtemplater, ou que les **références aux nœuds précédents sont incorrectes**.

---

## ✅ Solution : Vérifier et Corriger les Variables

### Étape 1 : Vérifier les Nœuds Précédents

Assurez-vous que tous les nœuds avant "Créer Document" fonctionnent :

1. **"Formater Données"** → Doit créer toutes les variables
2. **"Génération IA Ollama"** → Doit générer le texte
3. **"Extraire Texte IA"** → Doit extraire `texte_ia`
4. **"Charger Template"** → Doit charger le fichier Word

### Étape 2 : Tester Chaque Nœud Individuellement

Dans n8n :

1. **Cliquez sur "Execute Workflow"** (bouton play)
2. **Testez chaque nœud** un par un :
   - **"Formater Données"** → Execute Node
   - Vérifiez que toutes les variables sont présentes
   - **"Génération IA Ollama"** → Execute Node
   - Vérifiez que la réponse arrive
   - **"Extraire Texte IA"** → Execute Node
   - Vérifiez que `texte_ia` est présent
   - **"Charger Template"** → Execute Node
   - Vérifiez que le fichier est chargé

### Étape 3 : Corriger les Variables dans Docxtemplater

Dans le nœud **"Créer Document"** (Docxtemplater) :

#### Vérifiez le Format des Expressions

Les variables doivent utiliser la syntaxe **exacte** pour référencer les nœuds précédents.

**Format correct** : `={{ $('Nom du Nœud').item.json.nom_variable }}`

**Exemples** :

1. **nom_destinataire** :
   ```
   ={{ $('Formater Données').item.json.nom_destinataire }}
   ```

2. **contexte** :
   ```
   ={{ $('Formater Données').item.json.contexte }}
   ```

3. **texte_ia** :
   ```
   ={{ $('Extraire Texte IA').item.json.texte_ia }}
   ```

4. **date** :
   ```
   ={{ $('Formater Données').item.json.date }}
   ```

5. **date_complete** :
   ```
   ={{ $('Formater Données').item.json.date_complete }}
   ```

6. **heure** :
   ```
   ={{ $('Formater Données').item.json.heure }}
   ```

7. **points_importants** :
   ```
   ={{ $('Formater Données').item.json.points_importants }}
   ```

8. **email_destinataire** :
   ```
   ={{ $('Formater Données').item.json.emails_destinataires.split(',')[0].trim() }}
   ```

---

## 🔍 Vérifications Importantes

### 1. Noms des Nœuds

Les noms des nœuds dans les expressions doivent **correspondre exactement** aux noms dans le workflow :

- ✅ `$('Formater Données')` → Nom exact du nœud
- ✅ `$('Extraire Texte IA')` → Nom exact du nœud
- ❌ Pas de fautes de frappe
- ❌ Pas d'espaces en trop

### 2. Structure des Données

Dans le nœud Docxtemplater, vérifiez :

**Template Data** doit être une structure comme :
```json
{
  "nom_destinataire": "={{ $('Formater Données').item.json.nom_destinataire }}",
  "contexte": "={{ $('Formater Données').item.json.contexte }}",
  ...
}
```

### 3. Binary Property Name

Dans le nœud Docxtemplater :
- **Binary Property Name** : `data` (doit correspondre à la sortie de "Charger Template")

---

## 🛠️ Configuration Complète du Nœud Docxtemplater

### Paramètres à Vérifier :

1. **Binary Property Name** :
   - Doit être : `data`
   - Correspond à la sortie du nœud "Charger Template"

2. **File Extension** :
   - Doit être : `docx`

3. **Template Data** :
   - Cliquez sur "Add Entry" pour chaque variable
   - **Key** : Le nom de la variable (ex: `nom_destinataire`)
   - **Value** : L'expression (ex: `={{ $('Formater Données').item.json.nom_destinataire }}`)

---

## 🔄 Recréer le Nœud Complètement

Si les corrections ne fonctionnent pas, recréez le nœud :

1. **Supprimez** le nœud "Créer Document"

2. **Ajoutez un nouveau nœud Docxtemplater**

3. **Configurez** :

   **Parameters** :
   - **Binary Property Name** : `data`
   - **File Extension** : `docx`

   **Template Data** → **Add Entry** (pour chaque variable) :

   | Key | Value |
   |-----|-------|
   | `nom_destinataire` | `={{ $('Formater Données').item.json.nom_destinataire }}` |
   | `contexte` | `={{ $('Formater Données').item.json.contexte }}` |
   | `points_importants` | `={{ $('Formater Données').item.json.points_importants }}` |
   | `texte_ia` | `={{ $('Extraire Texte IA').item.json.texte_ia }}` |
   | `date` | `={{ $('Formater Données').item.json.date }}` |
   | `date_complete` | `={{ $('Formater Données').item.json.date_complete }}` |
   | `heure` | `={{ $('Formater Données').item.json.heure }}` |
   | `email_destinataire` | `={{ $('Formater Données').item.json.emails_destinataires.split(',')[0].trim() }}` |

4. **Connectez** :
   - **Input** : Depuis "Charger Template"
   - **Output** : Vers "Nommer Document" et "Envoyer Validation"

5. **Sauvegardez**

---

## 🧪 Tester Individuellement

Pour déboguer, testez chaque variable :

1. **Exécutez le workflow** jusqu'au nœud "Formater Données"
2. **Vérifiez les données de sortie** : Toutes les variables doivent être présentes
3. **Exécutez "Extraire Texte IA"** : Vérifiez que `texte_ia` est présent
4. **Exécutez "Charger Template"** : Vérifiez que le fichier binary est chargé
5. **Exécutez "Créer Document"** : Si erreur, vérifiez quelle variable pose problème

---

## 📋 Checklist de Correction

- [ ] Tous les noms de nœuds sont corrects (exactement comme dans le workflow)
- [ ] Syntaxe des expressions correcte : `={{ $('Nom Nœud').item.json.variable }}`
- [ ] Binary Property Name = `data`
- [ ] File Extension = `docx`
- [ ] Toutes les variables sont ajoutées dans Template Data
- [ ] Les nœuds précédents fonctionnent (test individuel)
- [ ] Nœud connecté correctement dans le workflow

---

## 💡 Astuce : Utiliser l'Éditeur d'Expressions

Dans n8n, quand vous configurez les valeurs :

1. **Cliquez sur l'icône** `{...}` ou `fx` à côté du champ
2. **L'éditeur d'expressions s'ouvre**
3. **Vous pouvez** :
   - Voir les données disponibles
   - Sélectionner les variables depuis les nœuds précédents
   - Tester les expressions

**Utilisez cet éditeur** pour être sûr que les références sont correctes !

---

**Vérifiez surtout que les noms des nœuds dans les expressions correspondent exactement aux noms réels dans le workflow !** 🔍

