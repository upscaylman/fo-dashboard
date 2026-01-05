# Guide : Créer votre Automatisation dans n8n

Guide pour créer votre propre workflow d'automatisation de documents ou utiliser le workflow exemple.

## 🎯 Deux Options

### Option A : Utiliser le Workflow Exemple (Recommandé pour débuter)

Le workflow `generateur_document.json` est déjà prêt et contient tout ce dont vous avez besoin :

1. **Formulaire web** pour saisir les données
2. **Génération IA** du texte
3. **Génération du document Word** depuis un template
4. **Validation humaine** par email
5. **Envoi automatique** au destinataire

**Avantages :**
- ✅ Tout est déjà configuré
- ✅ Workflow complet et testé
- ✅ Vous pouvez le modifier selon vos besoins

**Pour l'utiliser :**
1. Dans n8n → **Workflows** → **Import from File**
2. Sélectionnez `workflows/dev/generateur_document.json`
3. Configurez les credentials (voir ci-dessous)
4. Adaptez selon vos besoins

---

### Option B : Créer votre Propre Workflow (Pour personnalisation avancée)

Si vous voulez créer quelque chose de complètement différent :

1. **Dans n8n** → Cliquez sur **"+ Add workflow"**
2. **Créez vos nœuds un par un**
3. **Connectez-les** pour créer le flux

---

## 📋 Prerequisites Avant de Créer une Automatisation

Avant de créer votre automatisation, assurez-vous d'avoir :

### 1. Nodes Installés

**Nodes standards** (déjà inclus) :
- ✅ Form Trigger (pour le formulaire web)
- ✅ Set (pour formater les données)
- ✅ If (pour les conditions)
- ✅ Email Send (pour les emails)
- ✅ Microsoft Outlook (pour l'envoi)
- ✅ Read Binary File (pour lire les templates)
- ✅ Respond to Webhook (pour répondre au formulaire)

**Nodes communautaires** (à installer) :
- 🔧 **n8n-nodes-docxtemplater** : Pour générer les documents Word
- 🔧 **@n8n/n8n-nodes-langchain** : Pour la génération IA

**Pour installer :**
- Settings → Community Nodes → Install
- Entrez le nom du node → Install
- **Redémarrer n8n** après installation :
  ```powershell
  cd docker
  docker-compose restart
  ```

### 2. Credentials Configurés

Selon ce que vous voulez faire :

- **Email SMTP** : Pour envoyer des emails
- **Microsoft Outlook** : Pour envoyer via Outlook (recommandé)
- **IA** : LM Studio, Ollama, OpenAI, etc.

**Pour configurer :**
- Settings → Credentials → Add Credential
- Suivez les instructions selon le type

---

## 🚀 Créer une Automatisation Complète (Workflow Exemple)

Voici comment créer un workflow complet similaire au workflow exemple :

### Étape 1 : Créer le Trigger (Formulaire Web)

1. Dans n8n, créez un nouveau workflow
2. Cliquez sur **"+"** → Cherchez **"Form Trigger"**
3. Configurez le formulaire :
   - **Path** : `mon-formulaire` (ou ce que vous voulez)
   - Cliquez sur **"Form Fields"** → **"Add Field"**
   - Ajoutez vos champs :
     - Nom du destinataire (Text, Required)
     - Contexte (Text, Required)
     - Points importants (Textarea, Optional)
     - Email destinataire (Text, Required)
4. **Sauvegardez** le nœud

### Étape 2 : Formater les Données

1. Ajoutez un nœud **"Set"** après le Form Trigger
2. Configurez les champs :
   - `nom_destinataire` = `{{ $json['nom-du-destinataire'] }}`
   - `contexte` = `{{ $json['contexte'] }}`
   - `date` = `{{ $now.toFormat('dd/MM/yyyy') }}`
   - `date_complete` = `{{ $now.toFormat('cccc d MMMM yyyy', { locale: 'fr' }) }}`
   - `heure` = `{{ $now.toFormat('HH:mm') }}`
3. **Sauvegardez**

### Étape 3 : Générer le Texte avec l'IA (Optionnel)

1. Ajoutez un nœud **"LM Chat OpenAI"** (ou équivalent selon votre IA)
2. Configurez :
   - **Credential** : Votre credential IA
   - **Model** : Le modèle à utiliser
   - **Prompt** : `Rédigez un texte professionnel en français basé sur : {{ $json.contexte }}`
3. Ajoutez un nœud **"Set"** pour extraire le texte :
   - `texte_ia` = `{{ $json.output }}`
4. **Sauvegardez**

### Étape 4 : Charger le Template Word

1. Ajoutez un nœud **"Read Binary File"**
2. Configurez :
   - **File Path** : `/templates/word/template_principal.docx`
   - (Le fichier doit être dans `templates/word/`)
3. **Sauvegardez**

### Étape 5 : Générer le Document Word

1. Ajoutez un nœud **"Docxtemplater"**
2. Configurez :
   - **Template Binary Data** : Sélectionnez "Binary Data" du nœud précédent
   - **Template Data** : Cliquez sur "Add Entry" et mappez :
     - `nom_destinataire` = `{{ $('Set').item.json.nom_destinataire }}`
     - `contexte` = `{{ $('Set').item.json.contexte }}`
     - `texte_ia` = `{{ $('Set').item.json.texte_ia }}`
     - `date` = `{{ $('Set').item.json.date }}`
     - etc.
3. **Sauvegardez**

### Étape 6 : Envoyer pour Validation

1. Ajoutez un nœud **"Email Send"**
2. Configurez :
   - **Credential** : Votre credential SMTP
   - **To** : Votre email (pour validation)
   - **Subject** : `Validation de document - Action requise`
   - **Message** : Texte avec tous les détails
   - **Attachments** : Sélectionnez le document généré
3. **Sauvegardez**

### Étape 7 : Attendre la Validation

1. Ajoutez un nœud **"Wait"**
2. Configurez :
   - **Approval Mode** : Manual
   - **Approval Buttons** : 
     - "✅ Approuver et envoyer" (decision: approved)
     - "❌ Refuser" (decision: rejected)
3. **Sauvegardez**

### Étape 8 : Condition (Si/Non)

1. Ajoutez un nœud **"IF"**
2. Configurez :
   - **Condition** : `{{ $json.decision }}` equals `approved`
3. **Sauvegardez**

### Étape 9 : Envoyer au Destinataire (Si approuvé)

1. Sur la branche "True" de l'IF, ajoutez **"Microsoft Outlook"**
2. Configurez :
   - **Operation** : Send Message
   - **Credential** : Votre credential Outlook
   - **To** : `{{ $('Set').item.json.emails_destinataires }}`
   - **Subject** : `{{ $('Set').item.json.contexte }}`
   - **Body** : Texte avec le contenu
   - **Attachments** : Le document généré
3. **Sauvegardez**

### Étape 10 : Répondre au Formulaire

1. Ajoutez **"Respond to Webhook"** après chaque branche finale
2. Configurez avec un message de succès ou d'erreur
3. **Sauvegardez**

---

## 🎨 Personnaliser le Workflow Exemple

Si vous utilisez le workflow exemple mais voulez le modifier :

### Ajouter des Champs au Formulaire

1. Ouvrez le workflow
2. Cliquez sur le nœud **"Formulaire Web"**
3. **Form Fields** → **Add Field**
4. Ajoutez vos nouveaux champs
5. Les nouveaux champs seront disponibles dans `{{ $json['nom-du-champ'] }}`

### Modifier le Template Word

1. Modifiez `templates/word/template_principal.docx`
2. Ajoutez de nouvelles variables : `{nouvelle_variable}`
3. Dans le nœud **"Créer Document"**, mappez la nouvelle variable :
   - `nouvelle_variable` = `{{ $json.valeur }}`

### Changer le Texte de l'Email

1. Cliquez sur le nœud **"Envoyer Validation"**
2. Modifiez le champ **Message**
3. Utilisez les variables : `{{ $json.nom_destinataire }}`, etc.

### Modifier la Génération IA

1. Cliquez sur le nœud **"Génération IA"**
2. Modifiez le **Prompt** selon vos besoins
3. Ajustez **Temperature** et **Max Tokens** pour changer le style

---

## ✅ Checklist pour une Automatisation Fonctionnelle

- [ ] Workflow créé ou importé
- [ ] Formulaire web configuré avec tous les champs nécessaires
- [ ] Template Word créé avec toutes les variables
- [ ] Template Word placé dans `templates/word/template_principal.docx`
- [ ] Nodes communautaires installés (Docxtemplater + LangChain si IA)
- [ ] Credentials configurés (SMTP, Outlook, IA)
- [ ] Tous les credentials reconnectés dans le workflow
- [ ] Workflow activé (toggle vert)
- [ ] Test complet réalisé avec succès

---

## 🧪 Tester votre Automatisation

1. **Activez le workflow** (toggle en haut à droite)
2. **Notez l'URL du webhook** (clic sur le Form Trigger)
3. **Ouvrez l'URL dans votre navigateur**
4. **Remplissez le formulaire** avec des données de test
5. **Soumettez** et suivez le workflow
6. **Vérifiez les logs** :
   ```powershell
   docker logs n8n-local -f
   ```

---

## 📚 Ressources Utiles

- **Documentation n8n** : https://docs.n8n.io
- **Exemples de workflows** : https://n8n.io/workflows
- **Syntaxe des expressions** : https://docs.n8n.io/code/expressions/
- **Docxtemplater** : https://docxtemplater.readthedocs.io/

---

## 🆘 Besoin d'Aide ?

Si vous bloquez sur une étape :
1. Consultez `docs/TROUBLESHOOTING.md`
2. Vérifiez les logs : `docker logs n8n-local -f`
3. Consultez la documentation n8n officielle

**Rappel :** L'automatisation est créée dans l'interface n8n, pas dans les fichiers. Les fichiers JSON sont juste pour exporter/importer les workflows.

---

**Vous êtes prêt à créer votre automatisation !** 🚀

