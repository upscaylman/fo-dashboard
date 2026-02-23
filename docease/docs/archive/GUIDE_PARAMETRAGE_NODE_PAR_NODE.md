# Guide de Paramétrage Node par Node

Ce guide vous accompagne pour configurer chaque nœud de votre workflow n8n un par un.

---

## 📋 Table des Matières

1. [Formulaire Web](#1-formulaire-web)
2. [Formater Données](#2-formater-données)
3. [Génération IA Ollama](#3-génération-ia-ollama)
4. [Extraire Texte IA](#4-extraire-texte-ia)
5. [Charger Template](#5-charger-template)
6. [Créer Document (DocxTemplater)](#6-créer-document-docxtemplater)
7. [Nommer Document](#7-nommer-document)
8. [Réponse Formulaire](#8-réponse-formulaire)
9. [Envoyer Validation](#9-envoyer-validation)
10. [Attendre Validation](#10-attendre-validation)
11. [Approuvé ?](#11-approuvé)
12. [Envoyer via Outlook](#12-envoyer-via-outlook)
13. [Confirmation Succès](#13-confirmation-succès)
14. [Confirmation Refus](#14-confirmation-refus)

---

## 1. Formulaire Web

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Formulaire Web"**

2. **Paramètres à configurer** :

   - **Path** : `generate-document`
     - C'est l'URL qui sera utilisée : `http://localhost:5678/form/generate-document`

3. **Options → Form Title** :
   ```
   Génération de Document Personnalisé
   ```

4. **Options → Form Description** :
   ```
   Remplissez ce formulaire pour générer un document Word personnalisé. Le document sera validé avant envoi.
   ```

5. **Options → Form Fields** → Cliquez sur "Add Field" pour chaque champ :

   **Champ 1 : Nom du destinataire**
   - **Field Label** : `Nom du destinataire`
   - **Field Type** : `Text`
   - **Required** : ✅ (cochez)
   - **Placeholder** : (optionnel)

   **Champ 2 : Contexte du document**
   - **Field Label** : `Contexte du document`
   - **Field Type** : `Text`
   - **Required** : ✅ (cochez)
   - **Placeholder** : `Ex: Discussion sur le projet X`

   **Champ 3 : Points importants à mentionner**
   - **Field Label** : `Points importants à mentionner`
   - **Field Type** : `Textarea` (zone de texte multiligne)
   - **Required** : ❌ (décochez)
   - **Placeholder** : `Un point par ligne`

   **Champ 4 : Email(s) du/des destinataire(s)**
   - **Field Label** : `Email(s) du/des destinataire(s)`
   - **Field Type** : `Text`
   - **Required** : ✅ (cochez)
   - **Placeholder** : `email1@exemple.com, email2@exemple.com`

6. **Sauvegardez** le nœud

### ✅ Vérification

Après la sauvegarde, vous pouvez :
- **Voir l'URL du formulaire** dans les informations du nœud
- **Tester le formulaire** en cliquant sur "Execute Workflow" ou en ouvrant l'URL dans un navigateur

### 📌 Notes Importantes

- Le formulaire est **actif dès que le workflow est activé**
- Les noms des champs dans le formulaire deviendront automatiquement des clés JSON :
  - `Nom du destinataire` → `nom-du-destinataire`
  - `Contexte du document` → `contexte-du-document`
  - `Points importants à mentionner` → `points-importants-a-mentionner`
  - `Email(s) du/des destinataire(s)` → `email-s-du-des-destinataire-s`

### 🌐 Accès au Formulaire

Une fois le workflow activé, l'URL sera :
```
http://localhost:5678/form/generate-document
```

---

## 2. Formater Données

Ce nœud transforme les données du formulaire en format utilisable par le reste du workflow.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Formater Données"**

2. **Mode** : `Set` (par défaut)

3. **Values to Set** → Cliquez sur "Add Value" pour chaque champ :

   **Valeur 1 : nom_destinataire**
   - **Name** : `nom_destinataire`
   - **Value** : `={{ $json['nom-du-destinataire'] }}`

   **Valeur 2 : contexte**
   - **Name** : `contexte`
   - **Value** : `={{ $json['contexte-du-document'] }}`

   **Valeur 3 : points_importants**
   - **Name** : `points_importants`
   - **Value** : `={{ $json['points-importants-a-mentionner'] }}`

   **Valeur 4 : emails_destinataires**
   - **Name** : `emails_destinataires`
   - **Value** : `={{ $json['email-s-du-des-destinataire-s'] }}`

   **Valeur 5 : date**
   - **Name** : `date`
   - **Value** : `={{ $now.toFormat('dd/MM/yyyy') }}`

   **Valeur 6 : date_complete**
   - **Name** : `date_complete`
   - **Value** : `={{ $now.toFormat('cccc d MMMM yyyy', { locale: 'fr' }) }}`

   **Valeur 7 : heure**
   - **Name** : `heure`
   - **Value** : `={{ $now.toFormat('HH:mm') }}`

4. **Options** :
   - **Keep Only Set Values** : ❌ (décochez) - pour conserver toutes les données

5. **Sauvegardez** le nœud

### ✅ Vérification

Testez le nœud en exécutant le workflow jusqu'à ce nœud. Vous devriez voir dans les données de sortie :
- `nom_destinataire` : la valeur du champ
- `contexte` : la valeur du champ
- `points_importants` : la valeur du champ
- `emails_destinataires` : les emails
- `date` : format `01/12/2024`
- `date_complete` : format `lundi 1 décembre 2024`
- `heure` : format `14:30`

---

## 3. Génération IA Ollama

Ce nœud appelle l'API Ollama pour générer le texte intelligent.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Génération IA Ollama"**

2. **Method** : `POST`

3. **URL** : `http://host.docker.internal:11434/api/generate`
   - ⚠️ **Important** : `host.docker.internal` permet au conteneur Docker d'accéder à Ollama sur votre machine

4. **Authentication** : `None`

5. **Send Body** : ✅ (cochez)

6. **Body Content Type** : `JSON`

7. **Specify Body** : `Using JSON`

8. **JSON Body** → Cliquez sur "Add Item" et configurez :

   ```json
   {
     "model": "llama2",
     "prompt": "Rédigez un texte professionnel et courtois en français de 2 à 3 paragraphes basé sur le contexte suivant :\n\nContexte : {{ $json.contexte }}\n\nPoints importants : {{ $json.points_importants }}\n\nLe texte doit être formel, professionnel et adapté à une correspondance professionnelle. Incluez une introduction, un développement des points mentionnés, et une conclusion ouverte. Répondez uniquement avec le texte, sans introduction ni conclusion additionnelle.",
     "stream": false
   }
   ```

   **OU** via l'interface :

   - **model** : `llama2`
   - **prompt** : 
     ```
     Rédigez un texte professionnel et courtois en français de 2 à 3 paragraphes basé sur le contexte suivant :

     Contexte : {{ $json.contexte }}

     Points importants : {{ $json.points_importants }}

     Le texte doit être formel, professionnel et adapté à une correspondance professionnelle. Incluez une introduction, un développement des points mentionnés, et une conclusion ouverte. Répondez uniquement avec le texte, sans introduction ni conclusion additionnelle.
     ```
   - **stream** : `false`

9. **Options → Timeout** : `60000` (60 secondes)

10. **Sauvegardez** le nœud

### ✅ Vérification

**Avant de tester** :
- Assurez-vous qu'Ollama est **démarré** sur votre machine
- Vérifiez que le modèle `llama2` est installé : `ollama list`

**Pour tester** :
1. Exécutez le workflow jusqu'à ce nœud
2. Vous devriez voir une réponse JSON avec un champ `response` contenant le texte généré

### ⚠️ Dépannage

Si vous avez une erreur de connexion :
- Vérifiez qu'Ollama écoute sur le port `11434`
- Essayez `http://localhost:11434/api/generate` si vous testez en dehors de Docker
- Vérifiez que le modèle existe : `ollama pull llama2`

---

## 4. Extraire Texte IA

Ce nœud extrait uniquement le texte généré de la réponse Ollama.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Extraire Texte IA"**

2. **Mode** : `Set`

3. **Values to Set** → Ajoutez une valeur :

   **Valeur 1 : texte_ia**
   - **Name** : `texte_ia`
   - **Value** : `={{ JSON.parse($json.body).response }}`

4. **Options** :
   - **Keep Only Set Values** : ❌ (décochez)

5. **Sauvegardez** le nœud

### ✅ Vérification

Testez le nœud. Vous devriez voir dans les données de sortie :
- `texte_ia` : le texte généré par l'IA (sans le JSON autour)

---

## 5. Charger Template

Ce nœud charge le fichier Word template depuis le conteneur.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Charger Template"**

2. **File Path** : `/templates/word/template_principal.docx`
   - ⚠️ **Important** : Ce chemin est relatif au conteneur Docker
   - Le fichier doit être dans `templates/word/template_principal.docx` sur votre machine
   - Le volume Docker mappe `/templates` vers `./templates` de votre projet

3. **Sauvegardez** le nœud

### ✅ Vérification

1. **Assurez-vous que le fichier existe** :
   ```
   templates/word/template_principal.docx
   ```

2. **Testez le nœud** : Vous devriez voir :
   - Une propriété binaire `data` avec le fichier Word
   - `fileName` : `template_principal.docx`

### ⚠️ Dépannage

Si le fichier n'est pas trouvé :
- Vérifiez que le fichier existe bien dans `templates/word/`
- Vérifiez dans `docker-compose.yml` que le volume est bien mappé :
  ```yaml
  - ./../templates:/templates:ro
  ```
- Redémarrez Docker : `docker-compose restart`

---

## 6. Créer Document (DocxTemplater)

**⚠️ NŒUD CRITIQUE** - Ce nœud fusionne le template avec les données.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Créer Document"**

2. **Binary Property Name** : `data`
   - C'est le nom de la propriété binaire du nœud précédent

3. **Options → File Extension** : `docx`

4. **Options → Delimiter** : `/` (peut être laissé vide aussi)

5. **Template Data** → C'est ici que vous ajoutez toutes vos variables !

   Cliquez sur "Add Entry" pour chaque variable :

   **Variable 1 : nom_destinataire**
   - **Key** : `nom_destinataire`
   - **Value** : `={{ $('Formater Données').item.json.nom_destinataire }}`

   **Variable 2 : contexte**
   - **Key** : `contexte`
   - **Value** : `={{ $('Formater Données').item.json.contexte }}`

   **Variable 3 : points_importants**
   - **Key** : `points_importants`
   - **Value** : `={{ $('Formater Données').item.json.points_importants }}`

   **Variable 4 : texte_ia**
   - **Key** : `texte_ia`
   - **Value** : `={{ $('Extraire Texte IA').item.json.texte_ia }}`

   **Variable 5 : date**
   - **Key** : `date`
   - **Value** : `={{ $('Formater Données').item.json.date }}`

   **Variable 6 : date_complete**
   - **Key** : `date_complete`
   - **Value** : `={{ $('Formater Données').item.json.date_complete }}`

   **Variable 7 : heure**
   - **Key** : `heure`
   - **Value** : `={{ $('Formater Données').item.json.heure }}`

   **Variable 8 : email_destinataire**
   - **Key** : `email_destinataire`
   - **Value** : `={{ $('Formater Données').item.json.emails_destinataires.split(',')[0].trim() }}`

6. **Sauvegardez** le nœud

### ✅ Vérification

Testez le nœud. Vous devriez voir en sortie :
- Une propriété binaire `data` avec le document Word généré
- Le document contient les valeurs remplacées dans le template

### ⚠️ Dépannage

**Erreur "Unrecognized node type"** :
- Vérifiez que `n8n-nodes-docxtemplater` est installé dans Settings → Community Nodes
- Vérifiez qu'il est **activé** (toggle vert)
- Redémarrez n8n : `cd docker && docker-compose restart`

**Les variables ne sont pas remplacées** :
- Vérifiez que les **noms des variables** dans le template Word correspondent exactement aux **Keys** ici
- Dans Word, les variables doivent être : `{nom_destinataire}` et non `{nom destinataire}` ou autre

---

## 7. Nommer Document

Ce nœud donne un nom au document généré.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Nommer Document"**

2. **Mode** : `Set`

3. **Values to Set** → Ajoutez une valeur :

   **Valeur : fileName**
   - **Name** : `fileName`
   - **Value** : `={{ 'document_' + $('Formater Données').item.json.nom_destinataire + '_' + $now.toFormat('yyyyMMdd_HHmmss') + '.docx' }}`

   **OU** avec template string :
   ```
   document_{{ $('Formater Données').item.json.nom_destinataire }}_{{ $now.toFormat('yyyyMMdd_HHmmss') }}.docx
   ```

4. **Options** :
   - **Keep Only Set Values** : ❌ (décochez)

5. **Sauvegardez** le nœud

### ✅ Vérification

Testez le nœud. Vous devriez voir :
- `fileName` : `document_Dupont_20241229_143022.docx` (exemple)

---

## 8. Réponse Formulaire

Ce nœud répond immédiatement à l'utilisateur du formulaire.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Réponse Formulaire"**

2. **Respond With** : `JSON`

3. **Response Body** :
   ```
   {
     "message": "Document généré avec succès. Vous allez recevoir un email de validation.",
     "documentName": "{{ $json.fileName }}"
   }
   ```

   **OU** avec expression :
   ```
   ={{ JSON.stringify({ message: 'Document généré avec succès. Vous allez recevoir un email de validation.', documentName: $json.fileName }) }}
   ```

4. **Sauvegardez** le nœud

### ✅ Vérification

Quand vous testez le formulaire, vous devriez voir cette réponse JSON s'afficher après la soumission.

---

## 9. Envoyer Validation

Ce nœud envoie un email de validation avec le document en pièce jointe.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Envoyer Validation"**

2. **Resource** : `Message`

3. **Operation** : `Send`

4. **Credential** : Sélectionnez votre credential SMTP (ex: "SMTP Local")
   - ⚠️ **Vous devez avoir créé un credential SMTP avant** (voir `docs/CONFIGURER_CREDENTIALS.md`)

5. **Subject** :
   ```
   Validation de document - Action requise
   ```

6. **Message** :
   ```
   Bonjour,

   Un nouveau document a été généré et nécessite votre validation avant envoi.

   Détails du document :
   - Destinataire : {{ $('Formater Données').item.json.nom_destinataire }}
   - Email(s) : {{ $('Formater Données').item.json.emails_destinataires }}
   - Contexte : {{ $('Formater Données').item.json.contexte }}
   - Points importants : {{ $('Formater Données').item.json.points_importants }}
   - Date : {{ $('Formater Données').item.json.date_complete }} à {{ $('Formater Données').item.json.heure }}

   Le document généré est en pièce jointe.

   Veuillez valider ou refuser ce document en cliquant sur l'un des boutons ci-dessous.
   ```

7. **To Email** :
   - `admin@exemple.com` (remplacez par votre email)
   - OU utilisez une variable d'environnement : `={{ $env.EMAIL_VALIDATION || 'admin@exemple.com' }}`

8. **Attachments** → Cliquez sur "Add Attachment" :
   - **Property** : `data`
     - C'est la propriété binaire du document depuis "Créer Document"

9. **Sauvegardez** le nœud

### ✅ Vérification

Testez le workflow. Vous devriez recevoir un email avec le document Word en pièce jointe.

---

## 10. Attendre Validation

Ce nœud attend que vous validiez ou refusiez le document.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Attendre Validation"**

2. **Resource** : `Wait`

3. **Wait Mode** : `Manual` (Approve/Reject)

4. **Options → Approval Buttons** → Cliquez sur "Add Button" :

   **Bouton 1 : Approuver**
   - **Text** : `✅ Approuver et envoyer`
   - **Decision** : `approved`

   **Bouton 2 : Refuser**
   - **Text** : `❌ Refuser`
   - **Decision** : `rejected`

5. **Sauvegardez** le nœud

### ✅ Comment ça fonctionne

Quand le workflow arrive à ce nœud :
- Il **s'arrête** et attend votre action
- Dans n8n, vous verrez une notification avec deux boutons
- Cliquez sur "✅ Approuver et envoyer" ou "❌ Refuser"
- Le workflow continue selon votre choix

---

## 11. Approuvé ?

Ce nœud vérifie si vous avez approuvé ou refusé.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Approuvé ?"**

2. **Condition** :

   **Condition 1 :**
   - **Value 1** : `={{ $json.decision }}`
   - **Operation** : `Equals`
   - **Value 2** : `approved`

3. **Options** :
   - **Case Sensitive** : ✅ (cochez)

4. **Sauvegardez** le nœud

### ✅ Comment ça fonctionne

- Si `decision == "approved"` → Va vers "Envoyer via Outlook" (sortie TRUE)
- Si `decision == "rejected"` → Va vers "Confirmation Refus" (sortie FALSE)

---

## 12. Envoyer via Outlook

Ce nœud envoie l'email final via Microsoft Outlook.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Envoyer via Outlook"**

2. **Resource** : `Message`

3. **Operation** : `Send Message`

4. **Credential** : Sélectionnez votre credential Microsoft Outlook OAuth2
   - ⚠️ **Vous devez avoir créé ce credential avant** (voir `docs/CONFIGURER_OUTLOOK_OAUTH2.md`)

5. **Subject** :
   ```
   Document : {{ $('Formater Données').item.json.contexte }}
   ```

6. **Message** :
   ```
   Bonjour {{ $('Formater Données').item.json.nom_destinataire }},

   {{ $('Extraire Texte IA').item.json.texte_ia }}

   Points importants :
   {{ $('Formater Données').item.json.points_importants }}

   Cordialement,
   ```

7. **To** :
   ```
   ={{ $('Formater Données').item.json.emails_destinataires.split(',').map(e => e.trim()).join(';') }}
   ```
   - Cela convertit une liste séparée par virgules en liste séparée par points-virgules (format Outlook)

8. **Attachments** → Cliquez sur "Add Attachment" :
   - **Property** : `data`
   - **Name** : `={{ $('Nommer Document').item.json.fileName }}`

9. **Sauvegardez** le nœud

### ✅ Vérification

Testez le workflow complet. L'email devrait être envoyé avec le document Word en pièce jointe.

---

## 13. Confirmation Succès

Ce nœud répond en cas de succès (document approuvé et envoyé).

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Confirmation Succès"**

2. **Respond With** : `JSON`

3. **Response Body** :
   ```
   ={{ JSON.stringify({ success: true, message: 'Document envoyé avec succès à ' + $('Formater Données').item.json.emails_destinataires }) }}
   ```

4. **Sauvegardez** le nœud

### ✅ Vérification

Quand le document est approuvé et envoyé, cette réponse est retournée (mais elle peut ne pas être visible si le formulaire s'est déjà terminé).

---

## 14. Confirmation Refus

Ce nœud répond en cas de refus.

### 🔧 Configuration dans n8n

1. **Cliquez sur le nœud "Confirmation Refus"**

2. **Respond With** : `JSON`

3. **Response Body** :
   ```
   ={{ JSON.stringify({ success: false, message: 'Document refusé et non envoyé.' }) }}
   ```

4. **Sauvegardez** le nœud

### ✅ Vérification

Quand le document est refusé, cette réponse est retournée.

---

## 🎯 Checklist de Configuration Complète

Avant d'activer le workflow, vérifiez :

- [ ] **Formulaire Web** : Tous les champs sont configurés
- [ ] **Formater Données** : Toutes les variables sont mappées
- [ ] **Génération IA Ollama** : URL correcte, modèle `llama2` installé
- [ ] **Extraire Texte IA** : Expression correcte
- [ ] **Charger Template** : Chemin du fichier correct, fichier existe
- [ ] **Créer Document** : Toutes les variables template sont ajoutées
- [ ] **Nommer Document** : Expression de nom correcte
- [ ] **Réponse Formulaire** : Message configuré
- [ ] **Envoyer Validation** : Credential SMTP configuré, email de destination
- [ ] **Attendre Validation** : Boutons configurés
- [ ] **Approuvé ?** : Condition correcte
- [ ] **Envoyer via Outlook** : Credential Outlook OAuth2 configuré
- [ ] **Confirmation Succès** : Message configuré
- [ ] **Confirmation Refus** : Message configuré

---

## 🚀 Activer le Workflow

Une fois tous les nœuds configurés :

1. **Sauvegardez** le workflow (Ctrl+S ou bouton Save)
2. **Activez** le workflow (toggle en haut à droite)
3. **Testez** le formulaire à l'URL : `http://localhost:5678/form/generate-document`

---

## 📚 Ressources

- [Guide Configuration Outlook OAuth2](CONFIGURER_OUTLOOK_OAUTH2.md)
- [Guide Configuration SMTP](CONFIGURER_CREDENTIALS.md)
- [Guide Configuration Ollama](CONFIGURER_OLLAMA.md)
- [Guide Templates Word](TEMPLATE_ZONES_TEXTE.md)

