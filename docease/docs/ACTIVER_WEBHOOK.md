# 🔧 Activer le Webhook dans n8n

## Problème
Le webhook `/webhook/formulaire-doc` retourne une erreur 404 car le workflow n'est pas activé dans n8n.

## ✅ Solution Rapide

### Étape 1 : Ouvrir n8n
1. Ouvrez votre navigateur
2. Allez sur **http://localhost:5678**

### Étape 2 : Importer le workflow (si nécessaire)

1. Dans n8n, cliquez sur **"Workflows"** dans le menu de gauche
2. Si vous ne voyez pas "gpt_generator", importez-le :
   - Cliquez sur **"Import from File"** ou **"Import"**
   - Naviguez vers : `workflows/dev/gpt_generator.json`
   - Sélectionnez le fichier et cliquez sur **"Import"**

### Étape 3 : Activer le workflow

1. **Trouvez le workflow "gpt_generator"** dans la liste
2. **Ouvrez-le** en cliquant dessus
3. **En haut à droite**, vous verrez un toggle "Inactive" (rouge)
4. **Cliquez dessus** pour le mettre sur **"Active"** (vert)

### Étape 4 : Vérifier le webhook

1. Dans le workflow ouvert, **cliquez sur le nœud "Formulaire (Webhook)"** (premier nœud)
2. **Vérifiez** :
   - Path: `formulaire-doc`
   - Mode: `Public` ou `Production`
3. **Notez l'URL complète** affichée (ex: `http://localhost:5678/webhook/formulaire-doc`)

### Étape 5 : Tester

1. Exécutez le script de vérification :
   ```powershell
   .\scripts\check-webhook.ps1
   ```

2. Ou testez directement le formulaire sur **http://localhost:3000**

## 🐛 Si le problème persiste

### Vérifier que Docker fonctionne
```powershell
cd docker
docker-compose ps
```

Vous devriez voir `n8n-local` avec le statut "Up".

### Vérifier les logs n8n
```powershell
cd docker
docker-compose logs n8n | tail -20
```

### Vérifier que le port est correct
- n8n devrait être sur **http://localhost:5678**
- Le formulaire devrait être sur **http://localhost:3000**

## 📝 Note importante

Si l'URL du webhook dans n8n est différente de `/webhook/formulaire-doc`, vous devez :
1. Noter l'URL exacte dans n8n
2. Modifier `templates/form/form.html` ligne 79 pour utiliser la bonne URL

