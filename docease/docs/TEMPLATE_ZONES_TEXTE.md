# Guide : Utiliser un Template Word avec Zones de Texte

Ce guide explique comment utiliser votre template Word existant (avec entête, pied de page et zones de texte positionnées) avec n8n et Docxtemplater.

## 📋 Structure de votre Template

Votre template Word contient :
- ✅ **Entête** : Fixe, ne change pas
- ✅ **Pied de page** : Fixe, ne change pas  
- ✅ **Zones de texte** : Blocs déjà positionnés où le texte doit être inséré

C'est parfait ! Docxtemplater fonctionne exactement comme ça.

---

## 🔧 Comment Configurer votre Template Word

### Étape 1 : Identifier les Zones à Remplir

Dans votre template Word, identifiez les **zones de texte** où vous voulez insérer du contenu dynamique.

### Étape 2 : Placer les Variables Docxtemplater

Dans chaque zone de texte, placez une **variable** entre accolades :

```
{nom_variable}
```

**Exemple concret :**
Si vous avez une zone de texte pour le nom du destinataire, mettez :
```
{nom_destinataire}
```

Si vous avez une zone pour le texte généré par l'IA :
```
{texte_ia}
```

---

## 📝 Variables Disponibles dans le Workflow

Le workflow actuel fournit ces variables :

| Variable | Description | Exemple de valeur |
|----------|-------------|-------------------|
| `nom_destinataire` | Nom du destinataire | Dupont |
| `contexte` | Contexte/sujet du document | Discussion projet X |
| `points_importants` | Points importants | Budget, délais |
| `texte_ia` | Texte généré par l'IA | (2-3 paragraphes) |
| `date` | Date formatée | 29/10/2025 |
| `date_complete` | Date complète avec jour | Mardi 29 octobre 2025 |
| `heure` | Heure de génération | 14:30 |
| `email_destinataire` | Email du destinataire | dupont@exemple.com |

---

## 🎨 Exemple de Configuration

### Scénario : Template avec 3 zones de texte

**Zone 1 (En-tête du corps)** : Nom du destinataire
```
Cher {nom_destinataire},
```

**Zone 2 (Corps principal)** : Texte généré par l'IA
```
{texte_ia}
```

**Zone 3 (Liste des points)** : Points importants
```
Points à retenir :
{points_importants}
```

**Pied de page** : Date et contexte
```
Document généré le {date_complete} - Objet : {contexte}
```

---

## ⚙️ Configuration dans le Workflow n8n

### Le workflow est déjà configuré !

Le nœud **"Créer Document"** (Docxtemplater) mappe déjà toutes ces variables :

```json
{
  "nom_destinataire": "...",
  "contexte": "...",
  "points_importants": "...",
  "texte_ia": "...",
  "date": "...",
  "date_complete": "...",
  "heure": "...",
  "email_destinataire": "..."
}
```

**Vous n'avez rien à modifier dans le workflow !**

### Si vous voulez ajouter des variables personnalisées

1. **Dans votre template Word** : Ajoutez `{ma_variable}` dans une zone de texte

2. **Dans le workflow n8n** :
   - Ouvrez le workflow
   - Cliquez sur le nœud **"Formater Données"**
   - Ajoutez une nouvelle assignment :
     - **Name** : `ma_variable`
     - **Value** : `{{ $json['mon-champ-formulaire'] }}` (ou votre expression)

3. **Dans le nœud "Créer Document"** (Docxtemplater) :
   - Ajoutez une nouvelle entrée dans **Template Data** :
     - **Key** : `ma_variable`
     - **Value** : `={{ $('Formater Données').item.json.ma_variable }}`

---

## 🔍 Comment Ça Fonctionne Techniquement

1. **n8n charge votre template Word** via le nœud "Charger Template"
2. **Docxtemplater recherche** toutes les variables `{variable}` dans le document
3. **Docxtemplater remplace** chaque `{variable}` par la valeur correspondante
4. **Le document généré** conserve :
   - ✅ L'entête (si elle ne contient pas de variables)
   - ✅ Le pied de page (si il ne contient pas de variables)
   - ✅ Toute la mise en forme (polices, couleurs, espacements)
   - ✅ Les zones de texte avec le nouveau contenu

---

## ✅ Checklist pour Votre Template

Avant d'utiliser votre template :

- [ ] Template Word sauvegardé au format `.docx` (pas `.doc`)
- [ ] Variables placées dans les zones de texte souhaitées : `{nom_variable}`
- [ ] Noms des variables correspondent exactement à ceux du workflow
- [ ] Template placé dans `templates/word/template_principal.docx`
- [ ] Testé avec des données d'exemple

---

## 🧪 Tester votre Template

### Test rapide

1. **Créez un document Word de test** avec juste une zone contenant :
   ```
   {nom_destinataire}
   ```

2. **Importez le workflow** dans n8n
3. **Testez avec le formulaire** : remplissez "Nom du destinataire" avec "Test"
4. **Vérifiez le document généré** : il devrait contenir "Test"

### Vérifier les variables

Si une variable n'est pas remplacée :

1. **Vérifiez l'orthographe** : doit être exactement identique
   - ✅ `{nom_destinataire}` (avec underscore)
   - ❌ `{nom destinataire}` (avec espace)
   - ❌ `{nomDestinataire}` (camelCase)
   - ❌ `{NOM_DESTINATAIRE}` (majuscules)

2. **Vérifiez dans le workflow** que la variable est bien mappée dans le nœud Docxtemplater

3. **Vérifiez dans "Formater Données"** que la valeur est bien créée

---

## 📍 Placement du Template

Votre template doit être placé ici :

```
templates/word/template_principal.docx
```

**Important :**
- Le nom doit être exactement `template_principal.docx`
- Le dossier doit être `templates/word/` (pas `template`)
- Le chemin dans n8n est : `/templates/word/template_principal.docx`

---

## 🎯 Exemples Avancés

### Zone de texte conditionnelle

Si vous voulez afficher une zone seulement si une variable existe :

```
{#points_importants}
Points importants :
{points_importants}
{/points_importants}
```

### Plusieurs lignes dans une zone

Le texte peut contenir plusieurs paragraphes. Docxtemplater préserve les retours à la ligne :

```
{texte_ia}
```

Si `texte_ia` contient plusieurs paragraphes, ils seront tous insérés.

### Formatage dans les zones

Vous pouvez formater les zones de texte (gras, italique, couleur) et le formatage sera préservé sur le texte inséré.

---

## 🆘 Problèmes Courants

### La variable reste `{nom_variable}` dans le document final

**Cause** : La variable n'est pas mappée dans le workflow

**Solution** :
1. Vérifiez que la variable est dans le nœud "Formater Données"
2. Vérifiez qu'elle est mappée dans le nœud "Créer Document" (Docxtemplater)
3. Vérifiez l'orthographe exacte

### Le formatage disparaît

**Cause** : Problème avec la mise en forme Word

**Solution** :
- Utilisez les styles Word plutôt que le formatage manuel
- Assurez-vous que le template est en `.docx` (pas `.doc`)

### Les zones de texte ne sont pas remplies

**Cause** : Les variables ne sont pas dans les zones de texte

**Solution** :
- Vérifiez que vous avez bien mis `{variable}` dans les zones de texte Word
- Pas besoin de zones de texte Word spéciales, juste du texte normal avec `{variable}`

---

## 💡 Astuces

1. **Testez avec une seule variable d'abord** : Ajoutez `{nom_destinataire}` dans une zone, testez, puis ajoutez les autres

2. **Utilisez un nom clair pour chaque zone** : Placez un commentaire dans Word (Insert → Comment) pour noter quelle variable va où

3. **Sauvegardez une copie** : Gardez une copie de votre template original avant de modifier

4. **Testez régulièrement** : Après chaque modification du template, testez avec le workflow

---

**Votre template existant devrait fonctionner parfaitement !** 🎉

Il suffit de placer les variables `{variable}` dans les zones de texte où vous voulez insérer du contenu dynamique.

