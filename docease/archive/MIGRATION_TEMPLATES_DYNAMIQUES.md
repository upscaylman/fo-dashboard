# 🚀 Migration vers Templates Dynamiques

## 🎯 Objectif

Passer d'un système avec templates hardcodés à un système **100% dynamique** où :
- ✅ Chaque template = 1 fichier `.docx` séparé
- ✅ Ajout de templates = juste ajouter un fichier + config JSON
- ✅ **Aucune modification du workflow n8n nécessaire**
- ✅ Pas de perte de données lors des réimports

---

## 📋 Étapes de Migration

### **Étape 1 : Séparer les Templates Word**

Actuellement, tu as `template_principal.docx` avec 2 pages (désignation + négociation).

**Action requise :**

1. Ouvre `templates/word/template_principal.docx`
2. Crée 2 nouveaux fichiers :
   - `template_designation.docx` → Copie uniquement la page 1 (désignation)
   - `template_negociation.docx` → Copie uniquement la page 2 (négociation)
3. Supprime les pages inutiles de chaque fichier

**Résultat attendu :**
```
templates/word/
├── template_designation.docx   (1 page uniquement)
├── template_negociation.docx   (1 page uniquement)
└── template_principal.docx     (ancien, à garder en backup)
```

---

### **Étape 2 : Vérifier la Configuration**

Le fichier `templates/config/variables.json` a déjà été mis à jour automatiquement :

```json
{
  "templates": {
    "designation": {
      "fichier": "template_designation.docx",  // ✅ Modifié
      ...
    },
    "negociation": {
      "fichier": "template_negociation.docx",  // ✅ Modifié
      ...
    }
  }
}
```

**Aucune action requise** pour cette étape.

---

### **Étape 3 : Mettre à Jour le Workflow n8n**

Le node "Lire Template Word" a été modifié pour charger dynamiquement le bon template.

**Action requise :**

1. Ouvre n8n : http://localhost:5678
2. Ouvre le workflow `gpt_generator`
3. **Sauvegarde d'abord** ton template HTML actuel :
   - Ouvre le node "Convertir en HTML (Preview)"
   - Copie tout le code JavaScript dans un fichier texte
   - Sauvegarde-le dans `templates/backup/preview-html-backup.js`

4. **Réimporte le workflow** :
   - Va dans le menu du workflow → **Import from File**
   - Sélectionne `workflows/dev/gpt_generator.json`
   - Confirme l'import

5. **Restaure ton template HTML** :
   - Ouvre le node "Convertir en HTML (Preview)"
   - Colle ton code JavaScript sauvegardé
   - Sauvegarde le workflow

---

### **Étape 4 : Tester le Système**

1. **Démarre les services** :
   ```powershell
   .\start.ps1
   ```

2. **Teste chaque template** :
   - Ouvre http://localhost:3000
   - Sélectionne "Lettre de Désignation"
   - Remplis le formulaire
   - Vérifie que le document généré contient **1 seule page**
   - Répète pour "Mandat de Négociation"

3. **Vérifie les logs** :
   ```powershell
   docker logs n8n-local -f
   ```
   Tu devrais voir :
   ```
   📄 Chargement du template: /templates/word/template_designation.docx
   ```

---

## 🎨 Ajouter un Nouveau Template (Exemple)

### **Méthode 1 : Script Automatique (Recommandé)**

```powershell
.\scripts\add-new-template.ps1
```

Le script te guidera interactivement :
```
Clé du template: convocation
Nom affiché: Lettre de Convocation
Nom du fichier: template_convocation.docx

Variable #1
  Nom: dateReunion
  Label: Date de la réunion
  Type: text
  Requis: o
  Placeholder: Ex: 15/01/2025

Variable #2
  Nom: lieuReunion
  Label: Lieu
  Type: text
  Requis: o
```

### **Méthode 2 : Manuelle**

1. **Crée le fichier Word** :
   - Crée `templates/word/template_convocation.docx`
   - Ajoute les variables : `{civiliteDestinataire}`, `{dateReunion}`, etc.

2. **Modifie `variables.json`** :
   ```json
   "convocation": {
     "nom": "Lettre de Convocation",
     "fichier": "template_convocation.docx",
     "description": "Convocation à une réunion",
     "variables_specifiques": {
       "dateReunion": {
         "label": "Date de la réunion",
         "type": "text",
         "required": true
       },
       "lieuReunion": {
         "label": "Lieu",
         "type": "text",
         "required": true
       }
     }
   }
   ```

3. **C'est tout !** Le formulaire et le workflow s'adaptent automatiquement.

---

## 🔧 Variables Disponibles

### **Variables Communes (Toujours disponibles)**

Ces variables sont automatiquement ajoutées à tous les templates :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{civiliteDestinataire}` | Civilité | Monsieur |
| `{nomDestinataire}` | Nom | Dupont |
| `{statutDestinataire}` | Statut | Président |
| `{batiment}` | Bâtiment | Bâtiment A |
| `{adresse}` | Adresse | 123 rue de Paris |
| `{cpVille}` | Code postal + Ville | 75001 Paris |
| `{emailDestinataire}` | Email(s) | test@example.com |
| `{signatureExp}` | Signature | FO METAUX |
| `{codeDocument}` | Code document | FO/CP/2025-001 |
| `{entreprise}` | Entreprise | ACME Corp |
| `{date}` | Date courte | 15/01/2025 |
| `{dateComplete}` | Date longue | Lundi 15 janvier 2025 |
| `{heure}` | Heure | 14:30 |
| `{genre}` | Genre (le/la) | le |

### **Variables Spécifiques**

Définies dans `variables_specifiques` de chaque template dans `variables.json`.

---

## 🐛 Résolution de Problèmes

### **Problème : Le document contient toujours 2 pages**

**Cause** : Tu utilises encore `template_principal.docx` avec les 2 pages.

**Solution** :
1. Vérifie que tu as bien créé les fichiers séparés
2. Vérifie `variables.json` → `fichier` doit pointer vers le bon fichier
3. Réimporte le workflow n8n

### **Problème : "Template non trouvé"**

**Cause** : Le fichier `.docx` n'existe pas ou le nom ne correspond pas.

**Solution** :
```powershell
# Vérifier les fichiers
ls templates/word/

# Vérifier la config
cat templates/config/variables.json
```

### **Problème : Variables non remplacées dans le Word**

**Cause** : Syntaxe incorrecte dans le template Word.

**Solution** :
- Utilise `{nomVariable}` (avec accolades)
- Pas d'espaces : `{nom}` ✅ `{ nom }` ❌
- Respecte la casse : `{nomDestinataire}` ✅ `{nomdestinataire}` ❌

---

## 📊 Avantages du Nouveau Système

| Avant | Après |
|-------|-------|
| ❌ 1 fichier avec toutes les pages | ✅ 1 fichier par template |
| ❌ Modifier le workflow pour ajouter un template | ✅ Juste ajouter un fichier + JSON |
| ❌ Perte de données lors des réimports | ✅ Données préservées (backup manuel) |
| ❌ Code hardcodé | ✅ 100% dynamique |
| ❌ Difficile à maintenir | ✅ Facile à étendre |

---

## 🎯 Checklist de Migration

- [ ] Séparer `template_principal.docx` en 2 fichiers
- [ ] Vérifier `variables.json` (déjà fait automatiquement)
- [ ] Sauvegarder le template HTML du workflow
- [ ] Réimporter le workflow n8n
- [ ] Restaurer le template HTML
- [ ] Tester "Lettre de Désignation"
- [ ] Tester "Mandat de Négociation"
- [ ] Vérifier que chaque document a 1 seule page
- [ ] (Optionnel) Ajouter un nouveau template de test

---

## 💡 Prochaines Étapes

Une fois la migration terminée, tu pourras :

1. **Ajouter des templates facilement** :
   ```powershell
   .\scripts\add-new-template.ps1
   ```

2. **Versionner tes templates** :
   - Utilise Git pour suivre les modifications
   - Sauvegarde régulière avec `.\scripts\backup.sh`

3. **Partager des templates** :
   - Exporte juste le fichier `.docx` + la section JSON
   - Aucune modification du code nécessaire

---

**Besoin d'aide ?** Consulte les logs :
```powershell
# Logs n8n
docker logs n8n-local -f

# Logs du formulaire
# Visible dans la console PowerShell du serveur
```

