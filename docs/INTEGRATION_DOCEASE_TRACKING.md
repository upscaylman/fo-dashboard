# 📊 Intégration Tracking DocEase

## 🎯 Objectif
Compter automatiquement les documents générés sur **DocEase** (https://fo-docease.netlify.app/) et les afficher dans le dashboard FO Métaux.

---

## 🚀 Solution 1 : Webhook DocEase → Supabase (Recommandé)

### Principe
Chaque fois qu'un document est généré sur DocEase, envoyer une requête HTTP vers Supabase pour enregistrer l'événement.

### Étapes d'implémentation

#### 1. Créer une fonction Edge sur Supabase

```sql
-- Dans Supabase SQL Editor
CREATE TABLE IF NOT EXISTS docease_documents (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  title TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_docease_documents_user_id ON docease_documents(user_id);
CREATE INDEX idx_docease_documents_created_at ON docease_documents(created_at);

-- RLS pour sécurité
ALTER TABLE docease_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON docease_documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON docease_documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### 2. Créer l'endpoint webhook

**Option A : Supabase Edge Function**

```typescript
// supabase/functions/docease-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Vérifier la clé API (sécurité)
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== Deno.env.get('DOCEASE_WEBHOOK_SECRET')) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { user_email, document_type, title, metadata } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Trouver l'utilisateur par email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single()

    // Enregistrer le document
    const { error } = await supabase
      .from('docease_documents')
      .insert({
        user_id: user?.id,
        document_type,
        title,
        metadata
      })

    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

**Déployer :**
```bash
supabase functions deploy docease-webhook --project-ref geljwonckfmdkaywaxly
```

**Option B : Route REST API dans ton dashboard**

```typescript
// pages/api/docease-webhook.ts (si tu utilises Next.js)
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = req.headers['x-api-key']
  if (apiKey !== process.env.DOCEASE_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { user_email, document_type, title, metadata } = req.body

  try {
    // Trouver l'utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', user_email)
      .single()

    // Enregistrer le document
    const { error } = await supabase
      .from('docease_documents')
      .insert({
        user_id: user?.id,
        document_type,
        title,
        metadata
      })

    if (error) throw error

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

#### 3. Modifier DocEase pour envoyer le webhook

Dans le code de DocEase, après génération d'un document :

```javascript
// Dans DocEase - Après génération du document
async function trackDocumentGeneration(documentData) {
  try {
    await fetch('https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'TON_SECRET_KEY' // À définir dans les variables d'environnement
      },
      body: JSON.stringify({
        user_email: currentUser.email,
        document_type: documentData.type, // Ex: "Lettre de réclamation"
        title: documentData.title,
        metadata: {
          template_used: documentData.template,
          word_count: documentData.wordCount,
          // Autres infos utiles...
        }
      })
    })
  } catch (error) {
    console.error('Erreur tracking:', error)
    // Ne pas bloquer la génération si le tracking échoue
  }
}

// Appeler après génération
generateDocument().then(doc => {
  trackDocumentGeneration(doc)
  downloadDocument(doc)
})
```

#### 4. Afficher les stats dans le dashboard

Modifier `hooks/useStats.ts` :

```typescript
// Ajouter aux stats globales
const { data: doceaseCount } = await supabase
  .from('docease_documents')
  .select('id', { count: 'exact', head: true })

const { data: doceaseMonthCount } = await supabase
  .from('docease_documents')
  .select('id', { count: 'exact', head: true })
  .gte('created_at', startOfMonth.toISOString())

const globalStats: GlobalStat[] = [
  {
    label: 'Documents DocEase',
    value: String(doceaseCount?.count || 0),
    icon: FileText,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    trend: `+${doceaseMonthCount?.count || 0} ce mois`,
    description: 'Générés via DocEase'
  },
  // ... autres stats
]

// Stats par utilisateur
const { data: usersData } = await supabase
  .from('users')
  .select(`
    id,
    name,
    role,
    documents:documents(count),
    signatures:signatures(count),
    docease_docs:docease_documents(count)
  `)

const userStats = usersData.map(user => ({
  id: user.id,
  name: user.name,
  letters: user.documents[0]?.count || 0,
  signatures: user.signatures[0]?.count || 0,
  docease_letters: user.docease_docs[0]?.count || 0, // NOUVEAU
  role: user.role_level
}))
```

---

## 🔄 Solution 2 : Synchronisation manuelle périodique

Si DocEase stocke les documents quelque part (Firebase, base de données) :

1. **Créer un cron job** qui tourne toutes les heures
2. **Lire la base DocEase** et synchroniser vers Supabase
3. Utiliser un champ `last_sync_date` pour éviter les doublons

```typescript
// Exemple avec Supabase Edge Function + cron
import { createClient } from '@supabase/supabase-js'

// Cron : toutes les heures
Deno.cron("sync-docease", "0 * * * *", async () => {
  // Lire depuis la source DocEase (Firebase, API, etc.)
  const doceaseDocuments = await fetchDoceaseDocuments()
  
  // Insérer dans Supabase
  const supabase = createClient(...)
  await supabase.from('docease_documents').upsert(doceaseDocuments)
})
```

---

## 📱 Solution 3 : Tracking côté client (Simple mais moins fiable)

Si tu ne peux pas modifier DocEase, utiliser **localStorage** :

```typescript
// Dans le dashboard - Bouton "Ouvrir DocEase"
const handleOpenDocEase = () => {
  // Enregistrer l'ouverture
  localStorage.setItem('docease_opened_at', Date.now().toString())
  
  // Ouvrir DocEase
  window.open('https://fo-docease.netlify.app/', '_blank')
}

// Quand l'utilisateur revient, demander combien de docs générés
window.addEventListener('focus', async () => {
  const openedAt = localStorage.getItem('docease_opened_at')
  if (openedAt && Date.now() - parseInt(openedAt) < 3600000) { // < 1h
    // Popup : "Combien de documents avez-vous générés ?"
    const count = prompt('Combien de documents avez-vous générés sur DocEase ?')
    
    if (count && parseInt(count) > 0) {
      await supabase.from('docease_documents').insert({
        user_id: currentUser.id,
        document_count: parseInt(count),
        created_at: new Date().toISOString()
      })
    }
    
    localStorage.removeItem('docease_opened_at')
  }
})
```

⚠️ **Limite** : Moins précis, dépend de l'honnêteté utilisateur

---

## 📊 Résumé des solutions

| Solution | Précision | Difficulté | Modification DocEase |
|----------|-----------|------------|----------------------|
| **Webhook** | ⭐⭐⭐⭐⭐ | Moyenne | Oui (ajout fetch) |
| **Cron sync** | ⭐⭐⭐⭐ | Moyenne | Non (si accès DB) |
| **Client tracking** | ⭐⭐ | Facile | Non |

---

## 🎯 Recommandation

**Solution 1 (Webhook)** si tu as accès au code DocEase. C'est la plus précise et temps réel.

**Prochaines étapes :**
1. Créer la table `docease_documents` dans Supabase ✅
2. Déployer l'Edge Function webhook ✅
3. Ajouter le `fetch()` dans DocEase après génération ✅
4. Modifier `useStats.ts` pour afficher les données ✅

---

**Besoin d'aide pour implémenter ?** Dis-moi quelle solution tu préfères ! 🚀
