# 🔧 Solution au problème du formulaire

## 🔴 Problèmes identifiés

### 1. Template Word introuvable
**Erreur** : `The file "/templates/word/securite.docx" could not be accessed`

**Cause** : Le workflow cherche `securite.docx` mais vos templates s'appellent :
- `Sécurité.docx` (avec accent)
- `SECURITE DESIGNATIONS.docx`
- `template_principal.docx`

### 2. Workflow incomplet
Le workflow `gpt_generator.json` est basique et ne fonctionne pas correctement avec Ollama.

## ✅ Solution

### Étape 1 : Importer le nouveau workflow

1. **Ouvrir n8n** : http://localhost:5678
2. **Supprimer l'ancien workflow** `gpt_generator` (si actif)
3. **Importer** : `workflows/dev/generateur_formulaire_html.json`
4. **ACTIVER** le workflow (toggle vert)

### Étape 2 : Vérifier Ollama

Le modèle `gemma2:2b` doit être installé :

```powershell
# Vérifier les modèles installés
docker exec -it ollama ollama list

# Si gemma2:2b n'est pas installé :
docker exec -it ollama ollama pull gemma2:2b
```

### Étape 3 : Tester le formulaire

1. Assurez-vous que le proxy tourne sur port 3000
2. Ouvrez : http://localhost:3000/
3. Remplissez le formulaire
4. Vérifiez la prévisualisation HTML qui s'affiche

## 📋 Flux du nouveau workflow

```
Formulaire HTML
    ↓ POST /webhook/formulaire-doc
Serveur Proxy (port 3000)
    ↓ Redirige vers n8n
Webhook n8n (port 5678)
    ↓
Formater Données
    ↓
Génération IA Ollama (gemma2:2b)
    ↓
Extraire Texte IA
    ↓
Charger template_principal.docx
    ↓
Remplir Template (Docxtemplater)
    ↓
Réponse avec HTML de prévisualisation
```

## 🐛 Débogage

### Vérifier les logs n8n :
```powershell
docker logs n8n-local --tail 100
```

### Tester le webhook directement :
```powershell
$data = '{"civilite":"Monsieur","nom":"Test","adresse":"123 Rue Test","template":"securite","texte_ai":"Points importants","destinataires":"test@example.com"}'
Invoke-WebRequest -Uri "http://localhost:5678/webhook/formulaire-doc" -Method POST -Body $data -ContentType "application/json" -UseBasicParsing
```

### Vérifier le proxy :
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

## 📝 Pour envoyer les emails

Le workflow actuel génère juste la prévisualisation. Pour envoyer par email, il faut :

1. Ajouter un node **"Send email"** ou **"Microsoft Outlook"**
2. Connecter après "Remplir Template"
3. Configurer les credentials Outlook/SMTP

## ⚙️ Configuration des variables

Le workflow utilise ces variables du formulaire :
- `civilite` : Monsieur/Madame
- `nom` : Nom du destinataire
- `adresse` : Adresse
- `template` : Type de template (non utilisé pour le moment, toujours template_principal.docx)
- `texte_ai` : Points importants à mentionner
- `destinataires` : Emails séparés par virgule

## 🎯 Prochaines étapes

1. ✅ Workflow fonctionnel avec Ollama
2. ⏳ Ajouter l'envoi email
3. ⏳ Ajouter validation humaine avant envoi
4. ⏳ Support de plusieurs templates
