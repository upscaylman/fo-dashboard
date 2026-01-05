# 🔧 Configurer CORS directement dans n8n

## Pourquoi CORS bloque-t-il ?

Quand votre formulaire (sur `http://localhost:3000`) essaie d'appeler n8n (sur `http://localhost:5678`), le navigateur bloque la requête car :
- Ce sont des **origines différentes** (ports différents = origines différentes)
- Par défaut, les navigateurs bloquent les requêtes cross-origin pour la sécurité
- n8n ne renvoie pas les headers CORS nécessaires

## ✅ Solution : Configurer CORS dans le nœud Webhook n8n

Au lieu d'utiliser un proxy, vous pouvez configurer CORS directement dans n8n :

### Étape 1 : Ouvrir le workflow dans n8n

1. Allez sur **http://localhost:5678**
2. Ouvrez le workflow **"gpt_generator"**
3. Cliquez sur le nœud **"Formulaire (Webhook)"**

### Étape 2 : Configurer CORS

1. Dans le panneau de droite du nœud Webhook, cliquez sur **"Add Option"**
2. Recherchez et sélectionnez **"Allowed Origins (CORS)"**
3. Dans le champ **"Allowed Origins (CORS)"**, entrez :
   ```
   http://localhost:3000
   ```
   
   Ou pour autoriser toutes les origines (développement uniquement) :
   ```
   *
   ```

4. **Sauvegardez** le workflow
5. **Réactivez** le workflow (désactivez puis réactivez si nécessaire)

### Étape 3 : Mettre à jour le formulaire

Une fois CORS configuré dans n8n, vous pouvez appeler directement n8n dans `form.html` :

```javascript
// Appel direct vers n8n (fonctionne maintenant grâce à CORS configuré)
const res = await fetch("http://localhost:5678/webhook/formulaire-doc", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
})
```

## 📝 Note

- **Pour la production** : Utilisez des origines spécifiques au lieu de `*` pour la sécurité
- **Exemple production** : `https://votre-domaine.com,https://app.votre-domaine.com`
- Cette configuration est **par nœud webhook**, donc configurez-la pour chaque webhook utilisé

## 🔍 Vérification

Après configuration, testez :

```powershell
# Le navigateur devrait maintenant accepter la requête
# Ouvrez http://localhost:3000 et testez le formulaire
```

Référence : [Documentation n8n - Webhook CORS](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

