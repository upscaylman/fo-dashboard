# Documentation des Templates Word

Cette documentation explique comment créer et utiliser les templates Word pour la génération automatique de documents.

## 📋 Vue d'ensemble

Les templates Word utilisent la syntaxe de **Docxtemplater** pour remplacer automatiquement des variables par les valeurs fournies par le formulaire et l'IA.

## 🔧 Syntaxe Docxtemplater

### Variables simples

Les variables sont entourées d'accolades simples `{variable}`:

```
Cher {nom_destinataire},

Je vous écris au sujet de {contexte}.
```

### Variables avec formatage conditionnel

```
{#condition}
  Texte affiché si la condition est vraie
{/condition}
```

Exemple:
```
{#texte_personnalise}
{texte_personnalise}
{/texte_personnalise}
```

## 📝 Variables Disponibles

### Variables du formulaire

| Variable | Description | Exemple |
|----------|-------------|---------|
| `nom_destinataire` | Nom du destinataire | Dupont |
| `contexte` | Contexte/sujet du document | Discussion sur le projet |
| `points_importants` | Points importants mentionnés | Budget, délais, ressources |
| `email_destinataire` | Email du destinataire | dupont@exemple.com |
| `emails_destinataires` | Liste des emails (multi-destinataires) | dupont@exemple.com, martin@exemple.com |

### Variables générées automatiquement

| Variable | Description | Format |
|----------|-------------|--------|
| `date` | Date de génération | 29/10/2025 |
| `date_complete` | Date complète avec jour | Mardi 29 octobre 2025 |
| `date_iso` | Date au format ISO | 2025-10-29 |
| `heure` | Heure de génération | 14:30 |
| `texte_ia` | Texte généré par l'IA | (2-3 paragraphes professionnels) |

### Variables système (optionnelles)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `numero_reference` | Numéro de référence unique | DOC-2025-001 |
| `nom_expediteur` | Nom de l'expéditeur (configuré) | Service Client |

## 📄 Exemple de Template

```
OBJET : {contexte}

Paris, le {date}

{nom_destinataire},

{texte_ia}

Points importants à retenir :
{points_importants}

Je reste à votre disposition pour toute information complémentaire.

Cordialement,
[nom de l'expéditeur]

---
Document généré le {date_complete} à {heure}
Référence : {numero_reference}
```

## 🎨 Formatage

### Mise en forme du texte

Le formatage dans Word est préservé. Vous pouvez :
- Utiliser des **gras**, *italiques*, <u>soulignés</u>
- Changer les polices et tailles
- Ajouter des tableaux, images statiques
- Utiliser des styles Word prédéfinis

### Sections conditionnelles

Pour afficher une section seulement si une variable existe :

```
{#texte_ia}
{texte_ia}
{/texte_ia}

{#points_importants}
Points importants :
{points_importants}
{/points_importants}
```

## 📍 Localisation dans n8n

Les templates doivent être placés dans :
- **Local** : `/templates/word/` (monté dans Docker)
- **Production** : `/templates/word/` (même chemin)

Le workflow n8n lit automatiquement depuis ce chemin.

## 🔍 Vérification d'un Template

Avant d'utiliser un template dans un workflow :

1. Vérifiez que toutes les variables utilisées sont disponibles
2. Testez avec des données d'exemple
3. Vérifiez le formatage (retours à la ligne, espacements)
4. Assurez-vous que les caractères spéciaux sont bien échappés

## 🚨 Erreurs Courantes

### Variable non remplacée

**Problème** : La variable `{variable}` reste telle quelle dans le document final

**Solution** : 
- Vérifiez l'orthographe exacte dans le workflow n8n
- Vérifiez que la variable est bien mappée dans le nœud Docxtemplater

### Formatage perdu

**Problème** : Le formatage Word disparaît après génération

**Solution** :
- Utilisez les styles Word plutôt que le formatage manuel
- Vérifiez que le template est bien au format .docx (pas .doc)

### Caractères spéciaux

**Problème** : Les caractères accentués ou spéciaux posent problème

**Solution** :
- Utilisez l'encodage UTF-8
- Testez avec des exemples contenant des accents

## 📚 Ressources

- [Documentation Docxtemplater](https://docxtemplater.readthedocs.io/)
- [Exemples de templates](https://github.com/open-xml-templating/docxtemplater/tree/master/examples)

## 📝 Création d'un Nouveau Template

1. Créez un nouveau document Word
2. Rédigez le texte avec les variables `{variable}`
3. Testez le formatage
4. Sauvegardez au format .docx dans `templates/word/`
5. Documentez les variables utilisées dans ce README (section variables)
6. Testez le workflow n8n avec ce nouveau template

## 🔄 Mise à Jour des Templates

Si vous modifiez un template :

1. Sauvegardez une copie de l'ancien template
2. Modifiez le nouveau template
3. Testez avec le workflow n8n
4. Vérifiez que tous les documents existants fonctionnent toujours

---

**Note** : Les templates sont en lecture seule dans Docker pour éviter toute modification accidentelle. Pour modifier un template, éditez-le localement puis redémarrez le conteneur.

