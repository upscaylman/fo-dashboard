# Dernières Étapes - Finaliser le Workflow

## 🎉 Félicitations !

Toute la configuration technique est terminée :
- ✅ n8n fonctionnel
- ✅ Ollama configuré
- ✅ Node Docxtemplater installé
- ✅ SMTP Office 365 configuré
- ✅ Microsoft Outlook OAuth2 configuré

Il ne reste que **3 petites choses** à faire avant de pouvoir utiliser le workflow !

---

## 📋 Étapes Finales

### 1️⃣ Créer/Placer le Template Word

Vous avez déjà un template Word avec entête, pied de page et zones de texte.

**Action** :
1. **Ouvrez votre template Word**
2. **Dans chaque zone de texte** où vous voulez insérer du contenu, placez les variables :
   - `{nom_destinataire}`
   - `{texte_ia}`
   - `{contexte}`
   - `{points_importants}`
   - `{date}`
   - `{date_complete}`
   - `{heure}`
   - `{email_destinataire}`
   - etc.

3. **Sauvegardez** comme : `template_principal.docx`

4. **Copiez le fichier** dans :
   ```
   templates/word/template_principal.docx
   ```

**Voir** : `docs/TEMPLATE_ZONES_TEXTE.md` pour les détails

---

### 2️⃣ Connecter les Credentials au Workflow

Dans votre workflow n8n :

1. **Ouvrez le workflow** "Générateur Document avec Validation (Ollama)"

2. **Cherchez les nœuds avec cadenas 🔒** :
   - **"Envoyer Validation"** → Cliquez dessus
   - **"Envoyer via Outlook"** → Cliquez dessus

3. **Pour chaque nœud** :
   - Cliquez sur **"Credential to connect"** ou le cadenas
   - Sélectionnez le credential correspondant :
     - "Envoyer Validation" → **SMTP Office 365**
     - "Envoyer via Outlook" → **Microsoft Outlook OAuth2**
   - Cliquez sur **"Save"**

---

### 3️⃣ Activer le Workflow

1. **Dans le workflow**, regardez en haut à droite
2. **Cliquez sur le toggle "Inactive"**
3. **Il passe sur "Active"** (vert) ✅
4. Le workflow écoute maintenant les formulaires

---

### 4️⃣ Noter l'URL du Formulaire

1. **Cliquez sur le nœud "Formulaire Web"**
2. **Notez l'URL du webhook** affichée :
   - Exemple : `http://localhost:5678/webhook/generate-document`
3. **Cette URL est votre formulaire** - gardez-la !

---

## 🧪 Tester le Workflow Complet

### Test Rapide :

1. **Ouvrez l'URL du formulaire** dans votre navigateur
   - Exemple : `http://localhost:5678/webhook/generate-document`

2. **Remplissez le formulaire** avec des données de test :
   - Nom du destinataire : `Test Dupont`
   - Contexte : `Test de fonctionnement`
   - Points importants : `Point 1, Point 2`
   - Email(s) : `contact@fo-metaux.fr` (votre email pour recevoir la validation)

3. **Soumettez le formulaire**

4. **Vérifiez** :
   - ✅ Message "Document généré avec succès"
   - ✅ Email de validation reçu dans `contact@fo-metaux.fr`
   - ✅ Document Word en pièce jointe dans l'email

5. **Ouvrez le document Word** et vérifiez :
   - ✅ Les zones de texte sont remplies avec les bonnes données
   - ✅ Le texte généré par l'IA est présent
   - ✅ Toutes les variables sont correctement remplacées

6. **Validez le document** :
   - Dans l'email, cliquez sur **"✅ Approuver et envoyer"**
   - Vérifiez que le document est envoyé au destinataire

---

## ✅ Checklist Finale

Avant de considérer que tout est prêt :

- [ ] Template Word créé avec variables `{variable}`
- [ ] Template placé dans `templates/word/template_principal.docx`
- [ ] Credentials connectés au workflow :
  - [ ] "Envoyer Validation" → SMTP
  - [ ] "Envoyer via Outlook" → Microsoft Outlook OAuth2
- [ ] Workflow activé (toggle vert)
- [ ] URL du formulaire notée
- [ ] Test complet réussi :
  - [ ] Formulaire accessible
  - [ ] Document généré
  - [ ] Email de validation reçu
  - [ ] Document Word correct
  - [ ] Validation et envoi fonctionnent

---

## 🎯 Prochaines Actions Immédiates

1. **Créer/placer le template Word** (5-10 minutes)
2. **Connecter les credentials** (2 minutes)
3. **Activer le workflow** (1 clic)
4. **Tester** ! 🚀

---

## 🆘 Si Problème lors du Test

### Le template n'est pas trouvé :
```powershell
# Vérifier que le fichier existe
Test-Path "templates\word\template_principal.docx"

# Si absent, placez-le là
```

### L'email de validation n'arrive pas :
- Vérifiez vos spams
- Vérifiez que le credential SMTP est bien connecté
- Consultez les logs : `docker logs n8n-local -f`

### Le document n'est pas bien rempli :
- Vérifiez que les variables dans le template correspondent exactement (orthographe, casse)
- Vérifiez que les variables sont dans le nœud "Créer Document" du workflow

---

## 🎉 Vous Êtes Presque au Bout !

Une fois ces 3 dernières étapes faites, votre système d'automatisation sera **100% fonctionnel** !

---

**Dites-moi quand vous avez créé/placé le template Word et connecté les credentials, et on fera un test complet ensemble !** 🚀

