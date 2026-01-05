# Finaliser la Configuration du Workflow

## ✅ Ce qui est déjà fait

- ✅ n8n installé et fonctionnel
- ✅ Ollama installé avec modèle llama2
- ✅ Workflow importé dans n8n
- ✅ Node Docxtemplater installé (si vous l'avez installé)
- ✅ Credential SMTP Office 365 configuré et fonctionnel

---

## 📋 Étapes Finales

### 1. Configurer le Credential Microsoft Outlook

Pour envoyer le document final au destinataire, vous avez besoin du credential Microsoft Outlook.

**Dans n8n** → **Settings** → **Credentials** → **Add Credential** :

1. **Cherchez "Microsoft Outlook OAuth2 API"** (ou "Microsoft Office 365 OAuth2 API")
2. **Cliquez sur "Connect my account"**
3. **Connectez-vous** avec votre compte `contact@fo-metaux.fr`
4. **Autorisez n8n** à accéder à vos emails
5. **Donnez un nom** : "Microsoft Outlook" ou "Office 365"
6. **Sauvegardez**

**Note** : Comme vous utilisez Office 365, cherchez peut-être "Microsoft Office 365 OAuth2 API" au lieu de "Microsoft Outlook OAuth2 API".

---

### 2. Créer le Template Word

Vous devez créer votre template Word avec les zones de texte :

1. **Créez un document Word** avec :
   - Votre entête (qui reste fixe)
   - Votre pied de page (qui reste fixe)
   - Des zones de texte où insérer les variables

2. **Placez les variables** dans les zones de texte :
   - `{nom_destinataire}`
   - `{texte_ia}`
   - `{contexte}`
   - `{points_importants}`
   - `{date}`
   - `{date_complete}`
   - `{heure}`
   - etc.

3. **Sauvegardez** comme : `template_principal.docx`

4. **Placez le fichier** dans :
   ```
   templates/word/template_principal.docx
   ```

**Voir** `docs/TEMPLATE_ZONES_TEXTE.md` pour plus de détails.

---

### 3. Connecter les Credentials au Workflow

Dans votre workflow dans n8n :

1. **Ouvrez le workflow** "Générateur Document avec Validation (Ollama)"
2. **Cherchez les nœuds avec cadenas 🔒** :
   - **"Envoyer Validation"** → Connectez le credential **SMTP Office 365**
   - **"Envoyer via Outlook"** → Connectez le credential **Microsoft Outlook OAuth2**

3. **Pour chaque nœud** :
   - Cliquez sur le nœud
   - Cliquez sur "Credential to connect" ou "Create New Credential"
   - Sélectionnez le credential que vous avez créé
   - Cliquez sur "Save"

---

### 4. Vérifier le Chemin du Template

Dans le workflow :

1. **Cliquez sur le nœud "Charger Template"**
2. **Vérifiez que le chemin est** : `/templates/word/template_principal.docx`
3. **Si différent, modifiez** pour mettre ce chemin exact

---

### 5. Activer le Workflow

1. **Dans le workflow**, regardez en haut à droite
2. **Cliquez sur le toggle "Inactive"** pour le mettre sur **"Active"** (vert)
3. Le workflow est maintenant actif et écoute les formulaires

---

### 6. Noter l'URL du Formulaire

1. **Cliquez sur le nœud "Formulaire Web"**
2. **Notez l'URL du webhook** affichée
   - Exemple : `http://localhost:5678/webhook/generate-document`
3. **Copiez cette URL** - vous en aurez besoin pour tester

---

### 7. Tester le Workflow

#### Test Complet :

1. **Ouvrez l'URL du formulaire** dans votre navigateur
2. **Remplissez le formulaire** avec des données de test :
   - Nom du destinataire : `Test Dupont`
   - Contexte : `Test de fonctionnement`
   - Points importants : `Point 1, Point 2`
   - Email(s) : `contact@fo-metaux.fr` (votre email pour recevoir la validation)

3. **Soumettez le formulaire**

4. **Vérifiez** :
   - ✅ Message "Document généré avec succès"
   - ✅ Email de validation reçu dans `contact@fo-metaux.fr`
   - ✅ Document Word en pièce jointe

5. **Ouvrez le document** et vérifiez que :
   - ✅ Les zones de texte sont remplies
   - ✅ Le texte généré par l'IA est présent
   - ✅ Toutes les variables sont correctement remplacées

6. **Validez le document** :
   - Cliquez sur "✅ Approuver et envoyer"
   - Vérifiez que le document est envoyé au destinataire

---

## ✅ Checklist Finale

Avant de considérer que tout est prêt :

- [ ] Credential SMTP Office 365 configuré ✅
- [ ] Credential Microsoft Outlook configuré
- [ ] Template Word créé et placé dans `templates/word/template_principal.docx`
- [ ] Credentials connectés aux nœuds du workflow :
  - [ ] "Envoyer Validation" → SMTP
  - [ ] "Envoyer via Outlook" → Microsoft Outlook
- [ ] Workflow activé (toggle vert)
- [ ] URL du formulaire notée
- [ ] Test complet réussi :
  - [ ] Formulaire fonctionne
  - [ ] Email de validation reçu
  - [ ] Document généré correctement
  - [ ] Validation et envoi fonctionnent

---

## 🎯 Prochaines Actions Immédiates

**Maintenant que SMTP fonctionne, faites** :

1. **Configurer Microsoft Outlook OAuth2** (5 minutes)
2. **Créer/placer le template Word** (selon votre template existant)
3. **Connecter les credentials au workflow**
4. **Activer le workflow**
5. **Tester !**

---

## 🆘 Si Problème lors du Test

- **Consultez les logs** : `docker logs n8n-local -f`
- **Vérifiez les exécutions** dans n8n → Workflow → Executions
- **Consultez** `docs/TROUBLESHOOTING.md`

---

**Vous êtes presque au bout ! Il ne reste que quelques étapes finales.** 🚀

