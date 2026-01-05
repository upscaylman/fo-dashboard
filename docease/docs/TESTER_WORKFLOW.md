# Guide : Tester le Workflow dans n8n

Guide rapide pour tester votre workflow après l'import dans n8n.

## ✅ Checklist Avant de Tester

Avant d'exécuter le workflow, vérifiez que tout est configuré :

- [ ] **Workflow importé** dans n8n
- [ ] **Credentials configurés** :
  - [ ] SMTP (pour l'email de validation)
  - [ ] Microsoft Outlook (pour l'envoi final)
- [ ] **Template Word** créé et placé dans `templates/word/template_principal.docx`
- [ ] **Ollama fonctionne** (déjà vérifié ✅)
- [ ] **Workflow activé** (toggle vert en haut à droite)

---

## 🚀 Étapes pour Tester

### Étape 1 : Vérifier la Configuration

1. **Ouvrez le workflow** dans n8n
2. **Vérifiez les nœuds avec cadenas 🔒** :
   - **"Envoyer Validation"** : Doit avoir le credential SMTP
   - **"Envoyer via Outlook"** : Doit avoir le credential Outlook
3. **Si les credentials ne sont pas connectés** :
   - Cliquez sur le nœud avec le cadenas
   - Cliquez sur "Credential to connect"
   - Sélectionnez ou créez le credential

### Étape 2 : Vérifier le Template

1. **Vérifiez que le template existe** :
   ```powershell
   # Depuis le terminal
   Test-Path "templates/word/template_principal.docx"
   ```

2. **Si le template n'existe pas** :
   - Créez-le avec les variables `{variable}` dans les zones de texte
   - Sauvegardez-le comme `template_principal.docx`
   - Placez-le dans `templates/word/`

### Étape 3 : Activer le Workflow

1. **Dans le workflow**, regardez en haut à droite
2. **Cliquez sur le toggle** "Inactive" pour le mettre sur **"Active"** (vert)
3. Le workflow est maintenant actif et écoute les formulaires

### Étape 4 : Noter l'URL du Formulaire

1. **Cliquez sur le nœud "Formulaire Web"**
2. **Notez l'URL du webhook** affichée (ex: `http://localhost:5678/webhook/generate-document`)
3. **Copiez cette URL** - vous en aurez besoin pour tester

### Étape 5 : Test Manuel du Workflow (Optionnel)

Avant de tester avec le formulaire, vous pouvez tester manuellement :

1. **Cliquez sur "Execute Workflow"** (bouton play en haut)
2. **Testez chaque nœud individuellement** :
   - Cliquez sur un nœud → "Execute Node"
   - Vérifiez que les données passent correctement
3. **Commencer par "Formater Données"** :
   - Ajoutez des données de test manuellement
   - Vérifiez que les variables sont bien formatées

### Étape 6 : Test avec le Formulaire (Recommandé)

1. **Ouvrez l'URL du formulaire** dans votre navigateur :
   - Exemple : `http://localhost:5678/webhook/generate-document`

2. **Remplissez le formulaire** avec des données de test :
   - **Nom du destinataire** : `Test Dupont`
   - **Contexte du document** : `Test de fonctionnement`
   - **Points importants** : `Point 1, Point 2`
   - **Email(s)** : Votre propre email (pour recevoir la validation)

3. **Soumettez le formulaire**

4. **Vérifiez les résultats** :
   - Vous devriez voir un message "Document généré avec succès"
   - Vérifiez votre email (spams inclus)
   - Vous devriez recevoir un email avec le document en pièce jointe

### Étape 7 : Valider le Document

1. **Ouvrez l'email de validation**
2. **Ouvrez le document Word** en pièce jointe
3. **Vérifiez que** :
   - Le document contient les bonnes informations
   - Les zones de texte sont bien remplies
   - Le texte généré par l'IA est présent
4. **Cliquez sur "✅ Approuver et envoyer"** ou **"❌ Refuser"**

### Étape 8 : Vérifier les Logs

Si quelque chose ne fonctionne pas, vérifiez les logs :

```powershell
# Logs n8n
docker logs n8n-local -f
```

Ou dans n8n :
- Ouvrez le workflow
- Cliquez sur **"Executions"** en bas
- Consultez les exécutions récentes
- Cliquez sur une exécution pour voir les détails

---

## 🐛 Problèmes Courants lors du Test

### L'erreur "Template not found"

**Solution** :
1. Vérifiez que le fichier existe : `templates/word/template_principal.docx`
2. Redémarrez n8n : `docker-compose restart`
3. Vérifiez le chemin dans le nœud "Charger Template" : `/templates/word/template_principal.docx`

### L'erreur "Connection refused" pour Ollama

**Solution** :
1. Vérifiez qu'Ollama fonctionne : `ollama list`
2. Testez la connexion depuis Docker :
   ```powershell
   docker exec -it n8n-local curl http://host.docker.internal:11434/api/tags
   ```
3. Si ça ne fonctionne pas, essayez `http://172.17.0.1:11434` au lieu de `host.docker.internal`

### Le texte IA n'est pas généré

**Solutions** :
1. Vérifiez les logs du nœud "Génération IA Ollama"
2. Testez Ollama directement :
   ```powershell
   ollama run llama2 "Test"
   ```
3. Vérifiez que le modèle est bien `llama2` dans le workflow

### L'email de validation n'arrive pas

**Solutions** :
1. Vérifiez vos spams
2. Vérifiez la configuration SMTP dans le nœud "Envoyer Validation"
3. Testez l'envoi d'email directement depuis n8n (créer un workflow de test)

---

## ✅ Checklist de Test Réussi

Après le test, vous devriez avoir :

- [ ] Formulaire accessible et fonctionnel
- [ ] Données soumises avec succès
- [ ] Email de validation reçu
- [ ] Document Word généré avec le bon contenu
- [ ] Texte généré par l'IA visible dans le document
- [ ] Validation fonctionnelle (approuver/refuser)
- [ ] Email envoyé au destinataire (si approuvé)

---

## 💡 Astuces pour les Tests

1. **Testez d'abord avec des données simples** :
   - Nom court
   - Contexte simple
   - Un seul point important

2. **Vérifiez chaque étape individuellement** :
   - Formater Données → Vérifiez les variables
   - Génération IA → Vérifiez que le texte est généré
   - Créer Document → Vérifiez que le template est utilisé
   - etc.

3. **Utilisez votre propre email** pour les tests :
   - Vous recevrez tout
   - Vous pourrez valider facilement

4. **Gardez les logs ouverts** pendant les tests :
   ```powershell
   docker logs n8n-local -f
   ```
   Cela vous permettra de voir les erreurs en temps réel

---

**Vous êtes prêt à tester !** 🚀

Si vous rencontrez des problèmes, consultez les logs et `docs/TROUBLESHOOTING.md`.

