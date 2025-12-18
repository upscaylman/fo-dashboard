# Guide Pratique : Activer le Téléchargement des Documents DocEase

## 🎯 Objectif
Permettre de télécharger directement les documents Word/PDF générés par DocEase depuis le dashboard FO Métaux.

---

## ✅ Étape 1 : Appliquer la Migration SQL (5 minutes)

### 1.1 Ouvrir Supabase Dashboard
👉 **URL** : https://supabase.com/dashboard/project/geljwonckfmdkaywaxly

### 1.2 Aller dans SQL Editor
- Menu de gauche → **SQL Editor**
- Cliquez sur **"New query"**

### 1.3 Copier-Coller le Script
Copiez TOUT le contenu du fichier `MIGRATION_DOCEASE_FILE_URL.sql` et collez-le dans l'éditeur.

### 1.4 Exécuter
Cliquez sur **"Run"** (ou Ctrl+Entrée)

### 1.5 Vérifier le Résultat
Vous devriez voir :
```
✅ Colonne file_url ajoutée à docease_documents
✅ Bucket docease-files créé
✅ Policies configurées
```

### 1.6 Vérification Rapide
Exécutez cette requête pour confirmer :
```sql
-- Vérifier la colonne
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'docease_documents' AND column_name = 'file_url';

-- Vérifier le bucket
SELECT * FROM storage.buckets WHERE id = 'docease-files';
```

Si vous voyez des résultats, c'est bon ! ✅

---

## ✅ Étape 2 : Modifier DocEase pour Uploader les Fichiers

### 📍 Où se trouve le code DocEase ?

DocEase utilise **n8n** pour générer les documents. Le workflow est dans :
- `docease/workflows/n8n.json` (workflow complet)
- Interface n8n : http://localhost:5678

### 2.1 Identifier le Nœud de Génération de Document

Dans n8n, trouvez le nœud qui génère le fichier Word (probablement "Docxtemplater" ou "Generate Document").

### 2.2 Ajouter un Nœud HTTP Request pour Upload

**Après** la génération du document, ajoutez un nouveau nœud :

#### Configuration du Nœud HTTP Request
```
Nom : "Upload to Supabase Storage"
Method : POST
URL : https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/docease-files/{{ $json.fileName }}
```

#### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ

Content-Type: application/octet-stream
```

#### Body
- Type : **Binary Data**
- Binary Property : Le nom de la propriété contenant le fichier Word généré

### 2.3 Ajouter un Nœud Code pour Générer l'URL

Après l'upload, ajoutez un nœud **Function** :

```javascript
// Récupérer le nom du fichier uploadé
const fileName = items[0].json.fileName;

// Construire l'URL publique
const publicUrl = `https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/public/docease-files/${fileName}`;

// Retourner l'URL
return [{
  json: {
    ...items[0].json,
    file_url: publicUrl
  }
}];
```

### 2.4 Modifier le Nœud d'Insertion Supabase

Trouvez le nœud qui insère dans `docease_documents` et ajoutez le champ `file_url` :

```javascript
{
  user_email: "{{ $json.user_email }}",
  document_type: "{{ $json.document_type }}",
  title: "{{ $json.title }}",
  metadata: { format: "docx" },
  file_url: "{{ $json.file_url }}"  // ← NOUVEAU
}
```

---

## ✅ Étape 3 : Solution Alternative RAPIDE (sans modifier n8n)

Si vous ne voulez pas modifier le workflow n8n immédiatement, voici une **solution temporaire** :

### 3.1 Utiliser le Script de Test

Exécutez le script PowerShell fourni pour uploader manuellement les documents :

```powershell
.\test-docease-upload.ps1
```

Le script va :
1. Vous demander de sélectionner un fichier Word/PDF
2. L'uploader dans Supabase Storage
3. Créer l'entrée dans `docease_documents` avec l'URL

### 3.2 Créer une Edge Function Supabase (Avancé)

Créer une fonction qui reçoit le document et le stocke automatiquement.

**Fichier** : `supabase/functions/store-docease-document/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { file, metadata } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Décoder le fichier base64
    const fileData = Uint8Array.from(atob(file), c => c.charCodeAt(0));
    
    // Upload
    const fileName = `${Date.now()}_${metadata.title}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('docease-files')
      .upload(fileName, fileData, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

    if (uploadError) throw uploadError;

    // Récupérer URL
    const { data: urlData } = supabase.storage
      .from('docease-files')
      .getPublicUrl(fileName);

    // Insérer dans docease_documents
    const { data: docData, error: docError } = await supabase
      .from('docease_documents')
      .insert({
        ...metadata,
        file_url: urlData.publicUrl
      })
      .select()
      .single();

    if (docError) throw docError;

    return new Response(JSON.stringify({ success: true, document: docData }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
```

Puis dans n8n, appelez cette fonction au lieu d'insérer directement.

---

## ✅ Étape 4 : Tester le Téléchargement

### 4.1 Upload Manuel de Test

Exécutez :
```powershell
.\test-docease-upload.ps1
```

Suivez les instructions :
1. Sélectionnez un fichier Word/PDF
2. Entrez un email utilisateur
3. Entrez un type de document
4. Le script upload et insère automatiquement

### 4.2 Vérifier dans le Dashboard

1. Ouvrez http://localhost:4081
2. Connectez-vous
3. Allez dans l'onglet **DocEase**
4. Trouvez le document que vous venez d'uploader
5. Cliquez sur le bouton 📥 **Download**
6. Le fichier se télécharge ! ✅

### 4.3 Vérifier dans Supabase

Dashboard → Storage → docease-files

Vous devriez voir vos fichiers uploadés.

---

## 🎯 Récapitulatif : Que Fait Chaque Étape ?

| Étape | Ce qu'elle fait | Temps |
|-------|----------------|-------|
| **1. Migration SQL** | Ajoute `file_url` à la table + crée le bucket Storage | 5 min |
| **2. Modifier n8n** | DocEase upload automatiquement les fichiers à chaque génération | 20-30 min |
| **3. Solution alternative** | Upload manuel via script PowerShell ou Edge Function | 5 min (script) ou 15 min (function) |
| **4. Test** | Vérifier que le téléchargement fonctionne | 2 min |

---

## ⚡ Quelle Option Choisir ?

### 🟢 **Option 1 : Script PowerShell** (Recommandé pour tester)
- ✅ Rapide à mettre en place
- ✅ Pas besoin de modifier n8n
- ❌ Upload manuel (pas automatique)
- **Idéal pour** : Tester le système avant de modifier DocEase

### 🟡 **Option 2 : Modifier n8n** (Recommandé pour production)
- ✅ Upload automatique à chaque génération
- ✅ Solution complète et pérenne
- ❌ Nécessite de modifier le workflow
- **Idéal pour** : Production, usage régulier

### 🔵 **Option 3 : Edge Function** (Recommandé pour flexibilité)
- ✅ Indépendant de n8n
- ✅ Peut être appelé depuis n'importe où
- ❌ Plus complexe à mettre en place
- **Idéal pour** : Architecture microservices, multiple sources

---

## 🚀 Démarrage Ultra-Rapide (10 minutes)

Voici le chemin le plus rapide pour avoir un téléchargement fonctionnel :

```powershell
# 1. Appliquer la migration (copier-coller dans Supabase SQL Editor)
# Fichier: MIGRATION_DOCEASE_FILE_URL.sql

# 2. Tester avec le script
.\test-docease-upload.ps1

# 3. Vérifier dans le dashboard
# http://localhost:4081 → Onglet DocEase → Cliquer 📥
```

**C'est tout !** Vous avez un système fonctionnel pour tester.

Ensuite, une fois validé, vous pourrez modifier n8n pour automatiser le processus.

---

## ❓ Questions Fréquentes

### Q: Les anciens documents seront-ils téléchargeables ?
**R:** Non, seulement les documents générés après l'intégration auront un `file_url`. Les anciens documents afficheront le message proposant d'ouvrir DocEase.

### Q: Puis-je uploader les anciens documents manuellement ?
**R:** Oui ! Utilisez le script `test-docease-upload.ps1` pour chaque fichier.

### Q: Combien de fichiers puis-je stocker ?
**R:** Limite de 50 MB par fichier. Pas de limite sur le nombre total (selon votre plan Supabase).

### Q: Les fichiers sont-ils accessibles publiquement ?
**R:** Oui, mais uniquement via l'URL complète. Ils ne sont pas listables publiquement.

### Q: Puis-je supprimer des fichiers ?
**R:** Oui, les admins peuvent supprimer via Supabase Dashboard → Storage → docease-files.

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs Supabase (Dashboard → Logs)
2. Vérifiez que la migration a bien été appliquée
3. Testez l'URL du fichier directement dans le navigateur
4. Consultez `docs/INTEGRATION_DOCEASE_STORAGE.md` pour le dépannage détaillé

---

**Bon courage !** 🚀
