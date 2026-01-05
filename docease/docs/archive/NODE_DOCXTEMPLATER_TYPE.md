# Type Exact du Node DocxTemplater

## 📦 D'après la Documentation GitHub

Le node `n8n-nodes-docxtemplater` est un node communautaire disponible dans n8n.

**Repository** : https://github.com/jreyesr/n8n-nodes-docxtemplater

---

## 🔍 Type Exact à Utiliser

D'après la structure standard des nodes n8n communautaires, le type devrait être :

```
n8n-nodes-docxtemplater
```

**Sans** `.execute` ou autre suffixe.

---

## ✅ Vérification dans n8n

Si le node apparaît quand vous appuyez sur "+" dans n8n, vérifiez :

1. **Quel est le nom exact** affiché dans la liste ?
   - "DocxTemplater" ?
   - "docxtemplater" ?
   - Autre ?

2. **Si vous ajoutez le node manuellement** :
   - Ajoutez-le dans votre workflow
   - Ouvrez-le
   - Regardez quelle est la valeur du champ "Type" (si visible)
   - Ou exportez le workflow et regardez le JSON

---

## 🔄 Solution : Utiliser le Node depuis l'Interface

La façon la plus sûre :

1. **Dans n8n**, ouvrez votre workflow
2. **Supprimez** le nœud "Créer Document" problématique
3. **Ajoutez un nouveau nœud** en cliquant sur "+"
4. **Cherchez "DocxTemplater"** et ajoutez-le
5. **Configurez-le** avec les mêmes paramètres que l'ancien
6. **Connectez-le** dans le workflow

Comme ça, n8n utilisera automatiquement le bon type !

---

## 📋 Configuration du Node

Quand vous ajoutez le node DocxTemplater depuis l'interface, configurez :

### Parameters :

- **Binary Property** : `data` (venant du nœud "Charger Template")
- **File Extension** : `docx`

### Template Data :

Ajoutez chaque variable avec :
- **Key** : nom de la variable (ex: `nom_destinataire`)
- **Value** : expression (ex: `={{ $('Formater Données').item.json.nom_destinataire }}`)

**Variables à ajouter** :
- `nom_destinataire`
- `contexte`
- `points_importants`
- `texte_ia`
- `date`
- `date_complete`
- `heure`
- `email_destinataire`

---

## 💡 Avantage d'Ajouter depuis l'Interface

En ajoutant le node **manuellement depuis l'interface n8n** :
- ✅ n8n utilise automatiquement le bon type
- ✅ Pas d'erreur de type
- ✅ Le node est garanti d'être actif
- ✅ Configuration visuelle plus facile

---

**Recommandation : Supprimez et recréez le nœud depuis l'interface plutôt que d'importer le JSON !** 🎯

