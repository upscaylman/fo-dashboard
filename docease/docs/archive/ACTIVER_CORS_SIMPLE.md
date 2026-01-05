# ✅ Activer CORS dans n8n (Solution simple)

## Étape unique dans n8n

1. **Ouvrez n8n** : http://localhost:5678
2. **Ouvrez le workflow "gpt_generator"**
3. **Cliquez sur le nœud "Formulaire (Webhook)"** (premier nœud)
4. **Cliquez sur "Add Option"** (en bas du panneau)
5. **Sélectionnez "Allowed Origins (CORS)"**
6. **Dans le champ, entrez** : `*`
7. **Sauvegardez** le workflow
8. **Faites de même pour le nœud "Validation (Webhook)"**

## ✅ C'est tout !

Après ça, le formulaire peut appeler directement n8n sans proxy.

**Testez** : Ouvrez http://localhost:3000 et soumettez le formulaire.

