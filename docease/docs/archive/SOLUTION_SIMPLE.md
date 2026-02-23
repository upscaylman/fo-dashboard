# ✅ Solution simple - En 1 minute

## Le problème
Le webhook `/webhook-test/formulaire-doc` retourne 404 car le mode TEST nécessite "Listen for Test Event".

## Solution (30 secondes)

**Dans n8n :**
1. Ouvrez le workflow "gpt_generator"
2. **Activez le workflow** (toggle vert en haut à droite)
3. **C'est tout !**

Le formulaire utilise maintenant `/webhook/` (mode Production) qui fonctionne dès que le workflow est actif.

## ✅ Test

1. Vérifiez que le workflow est **vert** (actif) dans n8n
2. Ouvrez http://localhost:3000
3. Testez le formulaire

Si ça ne fonctionne pas, vérifiez que CORS est configuré dans le nœud Webhook :
- Cliquez sur le nœud Webhook
- Option "Allowed Origins (CORS)" = `*`

