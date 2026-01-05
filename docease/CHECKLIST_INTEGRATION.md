# 📋 Checklist : Intégrer le Téléchargement DocEase

## ✅ Ce qui est DÉJÀ fait :

- [x] Migration SQL appliquée (colonne `file_url` + bucket `docease-files`)
- [x] Webhook Supabase mis à jour (stockage automatique des fichiers)
- [x] Interface dashboard (bouton 📥 Download fonctionnel)
- [x] Policies de sécurité configurées

---

## 🔧 Ce qu'il reste à faire (5-10 minutes) :

### Étape Unique : Ajouter 1 nœud dans n8n

1. [ ] Ouvrir n8n : http://localhost:5678
2. [ ] Ouvrir votre workflow DocEase
3. [ ] Ajouter un nœud **HTTP Request** entre :
   - **"Convert Binary to JSON"**
   - **"Reponse avec Word"**
4. [ ] Configurer le nœud (voir ci-dessous)
5. [ ] Sauvegarder le workflow
6. [ ] Tester en générant un document

---

## ⚙️ Configuration du Nœud (Copier-Coller)

**Nom du nœud** : `Stocker dans Supabase`

**Method** : `POST`

**URL** :
```
https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook
```

**Headers** :
```
x-api-key: fo-metaux-docease-2025
Content-Type: application/json
```

**Body (JSON)** :
```json
{
  "user_email": "{{ $('Preparer Donnees').item.json.emailDelegue || 'admin@fo-metaux.fr' }}",
  "document_type": "{{ $('Preparer Donnees').item.json.typeDocument }}",
  "title": "{{ $json.fileName }}",
  "metadata": {
    "format": "docx",
    "objet": "{{ $('Preparer Donnees').item.json.objet }}",
    "destinataire": "{{ $('Preparer Donnees').item.json.nomDestinataire }}"
  },
  "file_base64": "{{ $json.data }}"
}
```

**Timeout** : `30000`

---

## 🎯 Connexions

### Avant :
```
[Convert Binary to JSON] ──→ [Reponse avec Word]
```

### Après :
```
[Convert Binary to JSON] ──→ [Stocker dans Supabase] ──→ [Reponse avec Word]
```

---

## ✅ Test

1. **Générer un document** via DocEase
2. **Vérifier n8n** : Le nœud "Stocker dans Supabase" doit s'exécuter avec succès
3. **Ouvrir le dashboard** : http://localhost:4081 → Onglet DocEase
4. **Cliquer sur 📥** → Le fichier se télécharge ! ✅

---

## 🚀 Résultat Final

Après cette modification :

✅ **Chaque document généré** sera automatiquement téléchargeable  
✅ **Le fichier Word** est stocké dans Supabase Storage  
✅ **Le dashboard** affiche le bouton de téléchargement  
✅ **1 clic** et le fichier se télécharge  

---

## 📊 Schéma du Flux

```
Frontend DocEase
    │
    ▼
[Webhook n8n] → [Préparer Données] → [IA Ollama ?] → [Template Word]
    │
    ▼
[Docxtemplater] → Génère le .docx
    │
    ▼
[Convert Binary to JSON] → Convertit en base64
    │
    ▼
[Stocker dans Supabase] ← 🆕 NOUVEAU NŒUD
    │                         │
    │                         ▼
    │                    Supabase Storage
    │                    + DB docease_documents
    │                    (avec file_url)
    ▼
[Reponse avec Word] → Retourne au frontend
    │
    ▼
Supabase Realtime → Mise à jour dashboard
    │
    ▼
Dashboard FO Métaux
    │
    ▼
Bouton 📥 Download → Téléchargement direct !
```

---

## ⏱️ Temps Estimé

- Configuration du nœud : **3 minutes**
- Test : **2 minutes**
- **Total : 5 minutes**

---

## 📚 Documentation

- Guide complet : `docease/docs/INTEGRATION_N8N_RAPIDE.md`
- Schéma technique : `docs/INTEGRATION_DOCEASE_STORAGE.md`
- Aide dépannage : `docs/ETAPES_ACTIVATION_DOWNLOAD.md`

---

**C'est simple et rapide ! Une fois fait, vous aurez un système complet de génération + stockage + téléchargement** 🎉
