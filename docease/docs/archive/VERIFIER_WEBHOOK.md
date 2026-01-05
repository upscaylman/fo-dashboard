# Vérifier et corriger le webhook dans n8n

## 🔍 Diagnostic

L'erreur 404 signifie que le webhook `/webhook/formulaire-doc` n'existe pas ou n'est pas activé dans n8n.

## ✅ Étapes pour corriger

### 1. Ouvrir n8n
Accédez à http://localhost:5678 dans votre navigateur

### 2. Vérifier les workflows actifs

1. Dans n8n, allez dans **Workflows**
2. Recherchez un workflow contenant un nœud "Webhook" ou "Formulaire"
3. Vérifiez que le workflow est **activé** (toggle vert en haut à droite)

### 3. Trouver l'URL correcte du webhook

1. **Ouvrez le workflow** qui contient le webhook
2. **Cliquez sur le nœud Webhook** (généralement le premier nœud)
3. **Notez l'URL du webhook** affichée :
   - Exemple : `http://localhost:5678/webhook/xxx-xxx-xxx-xxx`
   - Ou : `http://localhost:5678/webhook/formulaire-doc`

### 4. Mettre à jour le formulaire HTML

Une fois que vous avez l'URL correcte du webhook :

1. Ouvrez `templates/form/form.html`
2. Remplacez l'URL dans le code :
   ```javascript
   // Ligne ~79
   const res = await fetch("http://localhost:3000/webhook/VOTRE-URL-ICI", {
   ```
   Remplacez `VOTRE-URL-ICI` par la partie après `/webhook/` de l'URL notée dans n8n

3. Faites de même pour le webhook de validation (ligne ~105)

### 5. Activer le workflow (si nécessaire)

Si le workflow n'est pas activé :

1. **Ouvrez le workflow** dans n8n
2. **Cliquez sur le toggle "Inactive"** en haut à droite
3. Il devrait passer à **"Active"** (vert)
4. Le webhook sera alors disponible

### 6. Vérifier que le webhook est public

1. **Cliquez sur le nœud Webhook**
2. Vérifiez que l'option **"Public"** ou **"Production"** est activée
3. Si ce n'est pas le cas, activez-la et sauvegardez

## 🔄 Alternative : Créer un nouveau webhook

Si le webhook n'existe pas, vous pouvez en créer un :

1. **Créez un nouveau workflow** dans n8n
2. **Ajoutez un nœud "Webhook"**
3. **Configurez-le** :
   - Path : `formulaire-doc` (ou un nom de votre choix)
   - Méthode : `POST`
   - Mode : `Public` ou `Production`
4. **Activez le workflow**
5. **Notez l'URL** et mettez à jour `form.html` comme indiqué ci-dessus

## 🧪 Tester

Une fois corrigé, testez le formulaire :
1. Ouvrez http://localhost:3000
2. Remplissez le formulaire
3. Soumettez

Si vous avez toujours une erreur 404, vérifiez que l'URL dans le formulaire correspond exactement à celle affichée dans n8n.

