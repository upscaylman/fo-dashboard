# 🔧 Intégration Supabase Storage dans n8n - Guide Rapide

## 🎯 Objectif
Stocker automatiquement les documents Word générés dans Supabase Storage pour les rendre téléchargeables depuis le dashboard.

---

## ✅ Étape 1 : Créer le Nœud HTTP Request

### Dans n8n (http://localhost:5678) :

1. **Ouvrez votre workflow DocEase**

2. **Ajoutez un nouveau nœud** entre **"Convert Binary to JSON"** et **"Reponse avec Word"** :
   - Cliquez sur le `+` entre les deux nœuds
   - Cherchez **"HTTP Request"**
   - Ajoutez-le

3. **Nommez-le** : `Stocker dans Supabase`

---

## ⚙️ Configuration du Nœud

### Onglet "Parameters"

#### Method
```
POST
```

#### URL
```
https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook
```

#### Authentication
- Type : **Header Auth**
- Header Name : `x-api-key`
- Header Value : `fo-metaux-docease-2025`

#### Headers (Section "Send Headers")
Cochez ✅ **Send Headers**

Ajoutez :
- Name : `Content-Type`
- Value : `application/json`

#### Body (Section "Send Body")
Cochez ✅ **Send Body**

Type : **JSON**

Body (copiez-collez exactement) :
```json
{
  "user_email": "{{ $('Preparer Donnees').item.json.emailDelegue || 'admin@fo-metaux.fr' }}",
  "document_type": "{{ $('Preparer Donnees').item.json.typeDocument }}",
  "title": "{{ $json.fileName }}",
  "metadata": {
    "format": "docx",
    "objet": "{{ $('Preparer Donnees').item.json.objet }}",
    "destinataire": "{{ $('Preparer Donnees').item.json.nomDestinataire }}",
    "date_generation": "{{ $now.toISO() }}"
  },
  "file_base64": "{{ $json.data }}"
}
```

#### Options
- Timeout : `30000` (30 secondes)

---

## 🔗 Étape 2 : Connecter les Nœuds

Modifiez les connexions comme suit :

**AVANT** :
```
Convert Binary to JSON → Reponse avec Word
```

**APRÈS** :
```
Convert Binary to JSON → Stocker dans Supabase → Reponse avec Word
```

Pour cela :
1. Supprimez la connexion entre "Convert Binary to JSON" et "Reponse avec Word"
2. Connectez "Convert Binary to JSON" vers "Stocker dans Supabase"
3. Connectez "Stocker dans Supabase" vers "Reponse avec Word"

---

## 🧪 Étape 3 : Tester

1. **Activez le workflow** (toggle en haut à droite)

2. **Générez un document** depuis le frontend DocEase

3. **Vérifiez dans n8n** :
   - Le nœud "Stocker dans Supabase" doit s'exécuter
   - Dans l'output, vous devriez voir :
     ```json
     {
       "success": true,
       "file_url": "https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/public/docease-files/..."
     }
     ```

4. **Vérifiez dans le dashboard FO Métaux** :
   - Ouvrez http://localhost:4081
   - Onglet DocEase
   - Le document devrait apparaître
   - Cliquez sur 📥 → Le fichier se télécharge ! ✅

---

## 🔍 Dépannage

### Erreur "Unauthorized"
→ Vérifiez que `x-api-key` = `fo-metaux-docease-2025`

### Erreur "file_base64 is required"
→ Vérifiez que le nœud reçoit bien les données de "Convert Binary to JSON"
→ Dans le body JSON, vérifiez : `"file_base64": "{{ $json.data }}"`

### Le fichier n'apparaît pas dans le dashboard
→ Vérifiez dans Supabase Dashboard → Storage → docease-files
→ Vérifiez dans Supabase Dashboard → Table Editor → docease_documents (colonne file_url doit être remplie)

### Timeout
→ Augmentez le timeout à 60000 (1 minute) si les fichiers sont gros

---

## 📊 Résultat Attendu

Après intégration, voici ce qui se passe automatiquement :

1. **Utilisateur génère un document** via DocEase
2. **n8n crée le Word** avec docxtemplater
3. **"Convert Binary to JSON"** convertit en base64
4. **"Stocker dans Supabase"** upload le fichier dans Storage + crée l'entrée dans la DB
5. **Dashboard reçoit la notification** en temps réel (Realtime)
6. **Utilisateur clique 📥** → Téléchargement direct ! ✅

---

## 🎉 C'est Terminé !

Une fois ce nœud ajouté, **tous les futurs documents** seront automatiquement :
- ✅ Stockés dans Supabase Storage
- ✅ Visibles dans le dashboard
- ✅ Téléchargeables en 1 clic

**Durée d'intégration** : 5-10 minutes

---

## 📝 Notes Importantes

- Le fichier est stocké dans le bucket `docease-files`
- L'URL est publique (lecture seule)
- Seuls les admins peuvent uploader/supprimer (via policies RLS)
- Limite : 50 MB par fichier
- Les anciens documents (avant cette intégration) ne sont pas téléchargeables

---

**Besoin d'aide ?** Consultez le guide complet : `docs/INTEGRATION_DOCEASE_STORAGE.md`
