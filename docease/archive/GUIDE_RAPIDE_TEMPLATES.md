# 🚀 Guide Rapide - Système de Templates Dynamiques

## 🎯 Ce qui a changé

### ✅ Avant (Problèmes)
- ❌ 1 fichier Word avec toutes les pages → Document final avec toutes les pages
- ❌ Ajouter un template = modifier le code du workflow
- ❌ Réimporter le workflow = perte des templates HTML

### ✅ Après (Solutions)
- ✅ 1 fichier Word par template → Document final avec 1 seule page
- ✅ Ajouter un template = juste ajouter un fichier + JSON
- ✅ Scripts de backup/restore automatiques pour les templates HTML

---

## 📋 Actions Immédiates Requises

### **1. Séparer ton fichier Word actuel**

Tu as actuellement `template_principal.docx` avec 2 pages :
- Page 1 : Lettre de Désignation
- Page 2 : Mandat de Négociation

**À faire :**
```
1. Ouvre template_principal.docx
2. Copie la page 1 → Sauvegarde comme template_designation.docx
3. Copie la page 2 → Sauvegarde comme template_negociation.docx
4. Supprime les pages inutiles de chaque fichier
```

**Résultat :**
```
templates/word/
├── template_designation.docx   (1 page)
├── template_negociation.docx   (1 page)
└── template_principal.docx     (backup)
```

### **2. Sauvegarder tes templates HTML**

Avant de réimporter le workflow :

```powershell
.\scripts\backup-workflow-html.ps1
```

Cela sauvegarde automatiquement tous les templates HTML dans `templates/backup/`.

### **3. Réimporter le workflow**

1. Ouvre n8n : http://localhost:5678
2. Ouvre le workflow `gpt_generator`
3. Menu → **Import from File**
4. Sélectionne `workflows/dev/gpt_generator.json`
5. Confirme l'import

### **4. Restaurer tes templates HTML**

```powershell
.\scripts\restore-workflow-html.ps1
```

Le script te demandera quel backup restaurer et le fera automatiquement.

### **5. Tester**

```powershell
# Démarre les services
.\start.ps1

# Ouvre le formulaire
# http://localhost:3000

# Teste chaque template
# Vérifie que le document final a 1 seule page
```

---

## 🎨 Ajouter un Nouveau Template

### **Méthode Simple (Recommandée)**

```powershell
.\scripts\add-new-template.ps1
```

Le script te guide pas à pas :
1. Nom du template
2. Fichier Word associé
3. Variables spécifiques

**Exemple :**
```
Clé: convocation
Nom: Lettre de Convocation
Fichier: template_convocation.docx

Variable #1
  Nom: dateReunion
  Label: Date de la réunion
  Type: text
  Requis: o

Variable #2
  Nom: lieuReunion
  Label: Lieu
  Type: text
  Requis: o
```

Ensuite :
1. Crée le fichier Word `templates/word/template_convocation.docx`
2. Ajoute les variables : `{dateReunion}`, `{lieuReunion}`, etc.
3. **C'est tout !** Le système fonctionne automatiquement.

---

## 🔧 Variables Disponibles

### **Variables Communes (Toujours disponibles)**

Utilisables dans **tous** les templates :

```
{civiliteDestinataire}    → Monsieur / Madame
{nomDestinataire}         → Nom du destinataire
{statutDestinataire}      → Président, Directeur...
{batiment}                → Bâtiment A
{adresse}                 → 123 rue de Paris
{cpVille}                 → 75001 Paris
{emailDestinataire}       → test@example.com
{signatureExp}            → FO METAUX
{codeDocument}            → FO/CP/2025-001
{entreprise}              → ACME Corp
{date}                    → 15/01/2025
{dateComplete}            → Lundi 15 janvier 2025
{heure}                   → 14:30
{genre}                   → le / la (automatique)
```

### **Variables Spécifiques**

Définies dans `variables.json` pour chaque template.

**Exemple pour "designation" :**
```
{numeroCourrier}
{civiliteDelegue}
{nomDelegue}
{emailDelegue}
{civiliteRemplace}
{nomRemplace}
```

---

## 🛠️ Scripts Utiles

| Script | Usage |
|--------|-------|
| `add-new-template.ps1` | Ajouter un nouveau template |
| `backup-workflow-html.ps1` | Sauvegarder les templates HTML |
| `restore-workflow-html.ps1` | Restaurer les templates HTML |
| `start.ps1` | Démarrer le système |
| `stop.ps1` | Arrêter le système |

---

## 🐛 Problèmes Courants

### **Le document contient toujours 2 pages**

**Cause :** Tu utilises encore `template_principal.docx`.

**Solution :**
1. Vérifie que tu as créé les fichiers séparés
2. Vérifie `variables.json` → `fichier` doit pointer vers le bon fichier
3. Réimporte le workflow

### **"Template non trouvé"**

**Cause :** Le fichier `.docx` n'existe pas.

**Solution :**
```powershell
ls templates/word/
```
Vérifie que le fichier existe et que le nom correspond à `variables.json`.

### **Variables non remplacées**

**Cause :** Syntaxe incorrecte dans le Word.

**Solution :**
- Utilise `{nomVariable}` (avec accolades)
- Pas d'espaces : `{nom}` ✅ `{ nom }` ❌
- Respecte la casse

---

## 📊 Architecture du Système

```
┌─────────────────┐
│  Formulaire     │  → Champs dynamiques depuis variables.json
│  (Port 3000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Webhook n8n    │  → Reçoit les données
│  (Port 5678)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Préparer       │  → Formate les variables
│  Données        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lire Template  │  → Charge dynamiquement le bon .docx
│  Word (NEW!)    │     depuis variables.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Docxtemplater  │  → Remplit le template
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Preview HTML   │  → Validation humaine
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Envoi Email    │  → Document final (1 seule page!)
└─────────────────┘
```

---

## 💡 Bonnes Pratiques

### **Nommage des Fichiers**
```
template_[type].docx
```
Exemples :
- `template_designation.docx`
- `template_negociation.docx`
- `template_convocation.docx`

### **Nommage des Variables**
```
camelCase
```
Exemples :
- `nomDestinataire` ✅
- `nom_destinataire` ❌
- `NomDestinataire` ❌

### **Backup Régulier**
```powershell
# Avant chaque modification importante
.\scripts\backup-workflow-html.ps1
```

### **Versionning**
```powershell
# Commit après chaque nouveau template
git add templates/
git commit -m "Ajout template convocation"
```

---

## 🎯 Checklist de Migration

- [ ] Séparer `template_principal.docx` en 2 fichiers
- [ ] Sauvegarder les templates HTML
- [ ] Réimporter le workflow n8n
- [ ] Restaurer les templates HTML
- [ ] Tester "Lettre de Désignation" → 1 page ✅
- [ ] Tester "Mandat de Négociation" → 1 page ✅
- [ ] (Optionnel) Ajouter un template de test

---

## 📞 Support

**Logs n8n :**
```powershell
docker logs n8n-local -f
```

**Logs formulaire :**
Visible dans la console PowerShell du serveur.

**Fichiers importants :**
- `templates/config/variables.json` → Configuration des templates
- `workflows/dev/gpt_generator.json` → Workflow n8n
- `templates/backup/` → Backups des templates HTML

---

**🎉 Une fois la migration terminée, tu pourras ajouter autant de templates que tu veux sans toucher au code !**

