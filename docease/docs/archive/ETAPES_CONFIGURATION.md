# Guide de Configuration - Étapes Détaillées

Guide complet pour configurer n8n après l'installation initiale.

## 📋 Étapes de Configuration

### 1️⃣ Créer le Compte Administrateur

Si vous ne l'avez pas encore fait :

1. Ouvrez http://localhost:5678 dans votre navigateur
2. Remplissez le formulaire d'inscription :
   - **Email** : Votre adresse email
   - **Prénom** : Votre prénom
   - **Nom** : Votre nom
   - **Mot de passe** : Un mot de passe sécurisé (minimum 8 caractères)
3. Cliquez sur "Créer un compte"
4. Vous êtes maintenant connecté à n8n !

---

### 2️⃣ Installer les Nodes Communautaires

Le workflow utilise des nodes communautaires qui doivent être installés :

#### Node Docxtemplater

1. Dans n8n, allez dans **Settings** (⚙️ en bas à gauche) → **Community Nodes**
2. Cliquez sur **"Install a community node"**
3. Entrez : `n8n-nodes-docxtemplater`
4. Cliquez sur **"Install"**
5. Redémarrez n8n (voir ci-dessous)

#### Node LangChain (pour l'IA)

1. Même procédure que ci-dessus
2. Entrez : `@n8n/n8n-nodes-langchain`
3. Cliquez sur **"Install"**
4. Redémarrez n8n

**Redémarrer n8n après installation des nodes :**

```powershell
cd docker
docker-compose restart
```

Attendez 30 secondes, puis rafraîchissez la page n8n.

---

### 3️⃣ Configurer les Credentials

#### A. Microsoft Outlook (pour l'envoi final)

1. Dans n8n, allez dans **Settings** → **Credentials**
2. Cliquez sur **"Add Credential"** → Cherchez **"Microsoft Outlook OAuth2 API"**
3. Cliquez sur **"Connect my account"**
4. Une fenêtre s'ouvre pour vous connecter à Microsoft
5. Connectez-vous avec votre compte Microsoft/Outlook
6. Autorisez n8n à accéder à votre compte
7. Donnez un nom au credential (ex: "Microsoft Outlook") et sauvegardez

#### B. SMTP (pour les emails de validation)

1. Dans **Credentials** → **Add Credential** → Cherchez **"SMTP"**
2. Configurez selon votre fournisseur :

   **Pour Gmail :**
   - **Host** : `smtp.gmail.com`
   - **Port** : `587`
   - **User** : votre adresse Gmail complète
   - **Password** : **Mot de passe d'application** (voir note ci-dessous)
   - **Secure** : `false` (TLS)
   
   **Pour Outlook/Hotmail :**
   - **Host** : `smtp-mail.outlook.com`
   - **Port** : `587`
   - **User** : votre adresse Outlook complète
   - **Password** : votre mot de passe Outlook
   - **Secure** : `false` (TLS)

   **Note pour Gmail :** Vous devez créer un "Mot de passe d'application" :
   - Allez sur https://myaccount.google.com/
   - **Sécurité** → **Validation en deux étapes** (doit être activée)
   - **Mots de passe des applications** → Créez un nouveau mot de passe
   - Utilisez ce mot de passe dans n8n (pas votre mot de passe Gmail normal)

3. Cliquez sur **"Save"** et donnez un nom (ex: "SMTP Local")

#### C. LM Studio / Ollama (pour l'IA - Optionnel)

**Si vous utilisez LM Studio :**
1. Démarrez LM Studio sur votre ordinateur
2. Chargez un modèle
3. Démarrez le serveur API (port 1234 par défaut)
4. Dans n8n, **Credentials** → **Add** → Cherchez **"OpenAI API"**
5. Configurez :
   - **Base URL** : `http://host.docker.internal:1234/v1` (pour Windows/Mac)
   - **API Key** : `lm-studio` (ou laissez vide si non requis)
   - Sélectionnez le modèle dans la liste

**Si vous utilisez Ollama :**
1. Installez et démarrez Ollama
2. Téléchargez un modèle : `ollama pull llama2`
3. Dans n8n, utilisez le node **HTTP Request** au lieu du node LangChain

**Alternative : Utiliser une API externe**
- OpenAI (payant)
- Anthropic Claude (payant)
- Hugging Face (gratuit avec limites)

---

### 4️⃣ Importer le Workflow

1. Dans n8n, allez dans **Workflows**
2. Cliquez sur **"Import from File"** (en haut à droite)
3. Naviguez vers : `workflows/dev/generateur_document.json`
4. Sélectionnez le fichier et cliquez sur **"Open"**
5. Le workflow apparaît dans votre liste

**Vérifiez que le workflow est importé :**
- Vous devriez voir "Générateur Document avec Validation" dans la liste
- Cliquez dessus pour l'ouvrir

---

### 5️⃣ Configurer le Workflow Importé

Après l'import, vous devez reconnecter les credentials :

1. **Ouvrez le workflow** "Générateur Document avec Validation"
2. Cherchez les nœuds avec un **🔒 cadenas** :
   - **"Génération IA"** : Connectez le credential LM Studio/OpenAI
   - **"Envoyer Validation"** : Connectez le credential SMTP
   - **"Envoyer via Outlook"** : Connectez le credential Microsoft Outlook

3. **Pour chaque nœud avec cadenas :**
   - Cliquez sur le nœud
   - Cliquez sur **"Credential to connect"** ou **"Create New Credential"**
   - Sélectionnez le credential que vous avez créé
   - Cliquez sur **"Save"**

4. **Vérifiez les chemins :**
   - Nœud **"Charger Template"** : Le chemin doit être `/templates/word/template_principal.docx`
   - Si différent, cliquez sur le nœud et modifiez le chemin

5. **Activez le workflow :**
   - Cliquez sur le toggle **"Inactive"** en haut à droite pour le mettre sur **"Active"**
   - Un webhook sera créé automatiquement

6. **Notez l'URL du webhook :**
   - Cliquez sur le nœud **"Formulaire Web"**
   - Copiez l'URL du webhook (ex: `http://localhost:5678/webhook/generate-document`)
   - Vous en aurez besoin pour accéder au formulaire

---

### 6️⃣ Créer le Template Word

Vous devez créer un fichier template Word :

1. **Créez un nouveau document Word** (.docx)
2. **Utilisez cette syntaxe Docxtemplater** :

```
OBJET : {contexte}

Paris, le {date}

{nom_destinataire},

{texte_ia}

Points importants à retenir :
{points_importants}

Je reste à votre disposition pour toute information complémentaire.

Cordialement,
[Votre nom]

---
Document généré le {date_complete} à {heure}
Email destinataire : {email_destinataire}
```

3. **Remplacez [Votre nom]** par votre nom réel

4. **Formatez le document** (police, espacement, etc.) comme vous le souhaitez

5. **Sauvegardez le fichier** sous le nom : `template_principal.docx`

6. **Copiez le fichier** dans le dossier :
   ```
   templates/word/template_principal.docx
   ```

**Variables disponibles :**
- `{nom_destinataire}` : Nom du destinataire
- `{contexte}` : Contexte du document
- `{texte_ia}` : Texte généré par l'IA
- `{points_importants}` : Points importants
- `{date}` : Date au format dd/MM/yyyy
- `{date_complete}` : Date complète avec jour
- `{heure}` : Heure de génération
- `{email_destinataire}` : Email du destinataire

**Voir** `templates/word/README.md` pour plus de détails.

---

### 7️⃣ Tester le Système

1. **Accédez au formulaire :**
   - Ouvrez l'URL du webhook notée précédemment dans votre navigateur
   - Exemple : `http://localhost:5678/webhook/generate-document`

2. **Remplissez le formulaire avec des données de test :**
   - Nom du destinataire : `Test Dupont`
   - Contexte : `Test de fonctionnement`
   - Points importants : `Point 1, Point 2`
   - Email : Votre propre email (pour le test)

3. **Soumettez le formulaire**

4. **Vérifiez les logs n8n** pour voir si tout fonctionne :
   ```powershell
   docker logs n8n-local -f
   ```
   (Appuyez sur Ctrl+C pour quitter)

5. **Vérifiez votre email** :
   - Vous devriez recevoir un email de validation avec le document en pièce jointe
   - Ouvrez le document pour voir le résultat

6. **Approuvez le document** :
   - Cliquez sur "✅ Approuver et envoyer" dans l'email
   - Ou "❌ Refuser" si le document n'est pas bon

7. **Vérifiez l'envoi final** :
   - Si approuvé, le destinataire devrait recevoir l'email

---

## ✅ Checklist Complète

Avant de considérer la configuration comme terminée :

- [ ] Compte administrateur créé dans n8n
- [ ] Nodes communautaires installés (Docxtemplater + LangChain)
- [ ] Credential Microsoft Outlook configuré
- [ ] Credential SMTP configuré
- [ ] Credential IA configuré (LM Studio/Ollama ou API externe)
- [ ] Workflow importé depuis `workflows/dev/generateur_document.json`
- [ ] Tous les credentials reconnectés dans le workflow
- [ ] Template Word créé et placé dans `templates/word/template_principal.docx`
- [ ] Workflow activé (toggle vert)
- [ ] URL du webhook notée
- [ ] Test complet réalisé avec succès

---

## 🆘 Problèmes Courants

### Le workflow ne se charge pas
- Vérifiez que le fichier JSON est valide
- Réessayez l'import

### Les credentials ne se connectent pas
- Vérifiez que vous avez bien créé les credentials avant de les connecter
- Pour Outlook, assurez-vous d'avoir autorisé n8n

### Le template n'est pas trouvé
- Vérifiez que le fichier s'appelle exactement `template_principal.docx`
- Vérifiez qu'il est dans `templates/word/`
- Redémarrez le conteneur : `docker-compose restart`

### L'IA ne génère pas de texte
- Vérifiez que LM Studio ou Ollama est démarré
- Vérifiez la configuration du credential IA
- Testez avec `curl http://localhost:1234/v1/models` (LM Studio)

---

**Une fois tout configuré, votre système est prêt à être utilisé !** 🎉

Pour plus d'aide, consultez `docs/TROUBLESHOOTING.md`.

