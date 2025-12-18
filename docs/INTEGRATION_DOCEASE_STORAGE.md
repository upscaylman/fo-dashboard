# Guide d'Intégration : Stockage des Documents DocEase dans Supabase

Ce guide explique comment configurer DocEase pour stocker automatiquement les fichiers Word/PDF générés dans Supabase Storage, permettant ainsi le téléchargement direct depuis le dashboard FO Métaux.

## 🎯 Objectif

Actuellement, les documents DocEase sont générés et envoyés par email, mais ils ne sont pas stockés de manière persistante. Cette intégration permet de :
- ✅ Télécharger directement les documents depuis le dashboard
- ✅ Conserver un historique des fichiers générés
- ✅ Partager facilement les documents avec d'autres utilisateurs
- ✅ Archiver les documents importants

## 📋 Prérequis

- Dashboard FO Métaux fonctionnel
- DocEase configuré avec accès à Supabase
- Compte Supabase avec permissions admin

## 🔧 Étape 1 : Appliquer la Migration SQL

### Dans Supabase Dashboard

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard/project/geljwonckfmdkaywaxly)
2. Allez dans **SQL Editor**
3. Créez une nouvelle requête
4. Copiez le contenu de `MIGRATION_DOCEASE_FILE_URL.sql`
5. Exécutez le script

Cela va :
- ✅ Ajouter la colonne `file_url` à la table `docease_documents`
- ✅ Créer le bucket Storage `docease-files`
- ✅ Configurer les policies de sécurité (public read, admin write)

### Vérification

```sql
-- Vérifier que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'docease_documents' AND column_name = 'file_url';

-- Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'docease-files';
```

## 🚀 Étape 2 : Modifier le Workflow DocEase

### Option A : Modification du Workflow n8n

Si vous utilisez n8n pour DocEase :

1. **Ouvrez le workflow** dans n8n (http://localhost:5678)

2. **Après la génération du document Word**, ajoutez un nœud **HTTP Request** :
   - Method : `POST`
   - URL : `https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/docease-files/{{ $json.fileName }}`
   - Authentication : Bearer Token
   - Token : `[VOTRE_SUPABASE_ANON_KEY]`
   - Headers :
     - `Content-Type`: `application/octet-stream`
   - Body : Binary data du fichier Word

3. **Récupérer l'URL publique** avec un nœud **Code** :
   ```javascript
   const fileName = items[0].json.fileName;
   const publicUrl = `https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/public/docease-files/${fileName}`;
   return { publicUrl };
   ```

4. **Modifier l'insertion dans `docease_documents`** pour inclure `file_url` :
   ```javascript
   // Dans le nœud Postgres ou HTTP Request vers Supabase
   {
     user_email: "user@example.com",
     document_type: "designation",
     title: "Document_Test.docx",
     metadata: { format: "docx" },
     file_url: publicUrl  // ← NOUVEAU
   }
   ```

### Option B : Modification du Code React DocEase

Si DocEase utilise un frontend React avec upload direct :

```typescript
// Dans votre composant de génération de document
import { supabase } from './lib/supabase';

async function uploadDocumentToStorage(file: File, metadata: any) {
  try {
    // 1. Upload du fichier dans Storage
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('docease-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 2. Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('docease-files')
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // 3. Insérer dans docease_documents avec file_url
    const { data, error } = await supabase
      .from('docease_documents')
      .insert({
        user_email: metadata.userEmail,
        document_type: metadata.type,
        title: file.name,
        metadata: {
          format: metadata.format || 'docx',
          ...metadata
        },
        file_url: fileUrl  // ← URL du fichier stocké
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Document stocké avec succès:', data);
    return { document: data, fileUrl };

  } catch (error) {
    console.error('❌ Erreur stockage document:', error);
    throw error;
  }
}
```

### Option C : Via Edge Function Supabase

Créer une Edge Function qui gère l'upload :

```typescript
// supabase/functions/upload-docease-document/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    // Récupérer le fichier et métadonnées
    const formData = await req.formData();
    const file = formData.get('file');
    const metadata = JSON.parse(formData.get('metadata'));

    // Initialiser Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Upload du fichier
    const fileName = `${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('docease-files')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Récupérer URL publique
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

    return new Response(
      JSON.stringify({ success: true, document: docData }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

## 📊 Étape 3 : Tester l'Intégration

### Test Manuel

```bash
# Test d'upload via curl
curl -X POST \
  'https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/docease-files/test.docx' \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/octet-stream" \
  --data-binary "@test.docx"

# Vérifier l'URL publique
# https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/public/docease-files/test.docx
```

### Test via le Dashboard

1. Générez un document via DocEase
2. Attendez 2-3 secondes pour la synchronisation
3. Ouvrez le dashboard FO Métaux → Onglet DocEase
4. Cliquez sur le bouton 📥 Download
5. Le fichier devrait se télécharger directement !

## 🔍 Vérification des URLs

### Requête SQL pour vérifier les documents avec file_url

```sql
SELECT 
  id,
  title,
  document_type,
  file_url,
  created_at
FROM docease_documents
WHERE file_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Script PowerShell de Test

```powershell
# Test de téléchargement d'un document
$documentId = 1  # Remplacer par un ID réel

$doc = Invoke-RestMethod -Uri "https://geljwonckfmdkaywaxly.supabase.co/rest/v1/docease_documents?id=eq.$documentId&select=*" -Headers @{
  "apikey" = "[ANON_KEY]"
  "Authorization" = "Bearer [ANON_KEY]"
}

if ($doc[0].file_url) {
  Write-Host "✅ File URL trouvée: $($doc[0].file_url)"
  # Télécharger le fichier
  Invoke-WebRequest -Uri $doc[0].file_url -OutFile "test_download.docx"
  Write-Host "✅ Fichier téléchargé: test_download.docx"
} else {
  Write-Host "❌ Aucune file_url pour ce document"
}
```

## 📝 Variables d'Environnement

Ajoutez dans votre `.env` de DocEase :

```env
# Supabase Storage pour DocEase
VITE_SUPABASE_URL=https://geljwonckfmdkaywaxly.supabase.co
VITE_SUPABASE_ANON_KEY=[votre-anon-key]
VITE_STORAGE_BUCKET=docease-files

# Active le stockage automatique
VITE_ENABLE_FILE_STORAGE=true
```

## 🛠️ Dépannage

### Le fichier ne s'upload pas

1. **Vérifier les permissions** :
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'docease-files';
   ```

2. **Vérifier le bucket** :
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'docease-files';
   ```

3. **Vérifier les logs Supabase** :
   - Dashboard → Logs → Storage logs

### L'URL n'apparaît pas dans docease_documents

1. Vérifier que l'insertion inclut bien `file_url`
2. Vérifier les logs de votre workflow
3. Tester l'insertion manuelle :
   ```sql
   INSERT INTO docease_documents (user_email, document_type, title, metadata, file_url)
   VALUES (
     'test@example.com',
     'test',
     'Test.docx',
     '{"format": "docx"}',
     'https://geljwonckfmdkaywaxly.supabase.co/storage/v1/object/public/docease-files/test.docx'
   );
   ```

### Le téléchargement échoue depuis le dashboard

1. Vérifier que l'URL est bien publique (pas de 403 Forbidden)
2. Vérifier que le fichier existe dans Storage
3. Vérifier les CORS si nécessaire
4. Ouvrir la console navigateur pour voir les erreurs

## 🎉 Résultat Final

Une fois l'intégration complète :

- ✅ Les documents DocEase sont automatiquement stockés dans Supabase
- ✅ Les utilisateurs peuvent télécharger directement depuis le dashboard
- ✅ L'historique des fichiers est conservé
- ✅ Les admins peuvent gérer les fichiers via le Storage Supabase

## 📚 Ressources

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Policies RLS Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Upload via API REST](https://supabase.com/docs/guides/storage/uploads/standard-uploads)

---

**Note** : Cette intégration est optionnelle. Le dashboard FO Métaux continuera de fonctionner sans stockage de fichiers, mais avec une fonctionnalité de téléchargement limitée (affichage d'un message et proposition d'ouvrir DocEase).
