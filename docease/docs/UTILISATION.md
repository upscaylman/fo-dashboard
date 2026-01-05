# Guide d'Utilisation - DocEase & Dashboard FO Métaux

Guide complet pour utiliser le système DocEase intégré au dashboard FO Métaux. Ce guide couvre à la fois la génération de documents et le suivi en temps réel.

## 👋 Bienvenue

Ce système vous permet de **créer des documents Word personnalisés automatiquement** et de **suivre toutes les activités en temps réel** via le dashboard FO Métaux. Deux outils complémentaires :

1. **DocEase** : Interface de génération de documents (React 19 + ngrok)
2. **Dashboard FO Métaux** : Suivi en temps réel, statistiques, notifications (React 18 + Supabase)

## 🎯 À Quoi Ça Sert ?

### DocEase - Génération de Documents
Vous voulez envoyer un document professionnel à quelqu'un ? Au lieu de le rédiger manuellement, vous :
1. Remplissez un formulaire en ligne
2. Le système crée le document automatiquement avec IA (Ollama)
3. Vous validez le document
4. Le système envoie le document par email

### Dashboard FO Métaux - Suivi en Temps Réel
Le dashboard vous permet de :
1. **Voir en temps réel** tous les documents générés
2. **Recevoir des notifications** sur chaque action
3. **Consulter les statistiques** (salariés actifs, documents générés, signatures)
4. **Gérer les modèles** et documents partagés
5. **Suivre l'activité DocEase** (tracking des générations, utilisateurs)

**Intégration complète** : Chaque document généré via DocEase apparaît instantanément dans le dashboard avec notification automatique pour les admins !

## � Démarrage Rapide

### Accès aux Plateformes

Deux plateformes à connaître :

#### 📱 Dashboard FO Métaux (Suivi & Notifications)
- **URL Locale** : `http://localhost:4081`
- **Description** : Tableau de bord principal avec notifications en temps réel
- **Qui peut y accéder** : Tous les salariés connectés
- **Fonctionnalités** :
  - Vue d'ensemble (admins uniquement)
  - Statistiques des salariés et documents
  - Centre de notifications 🔔
  - Suivi DocEase en temps réel
  - Gestion des modèles et documents partagés

#### 📄 DocEase (Génération de Documents)
- **URL Locale** : `http://localhost:3000`
- **URL ngrok** : `https://[votre-url].ngrok-free.dev` (fournie par l'admin)
- **Description** : Interface de génération de documents avec IA
- **Qui peut y accéder** : Salariés autorisés

## 📝 Étape 1 : Accéder au Formulaire DocEase

1. **Ouvrez votre navigateur internet** (Chrome, Firefox, Edge, Safari)
2. **Tapez l'adresse DocEase** :
   - En local : `http://localhost:3000`
   - Ou l'URL ngrok fournie par l'administrateur
3. Appuyez sur **Entrée**

Vous devriez voir un formulaire avec plusieurs champs à remplir.

## 📋 Étape 2 : Remplir le Formulaire

Le formulaire contient **4 champs simples** à remplir :

### Champ 1 : Nom du destinataire
- **Qu'est-ce que c'est ?** Le nom de la personne qui recevra le document
- **Exemple :** `Dupont` ou `Marie Martin`
- **Important :** Ce champ est **obligatoire** (vous verrez une petite astérisque *)

### Champ 2 : Contexte du document
- **Qu'est-ce que c'est ?** Le sujet ou la raison du document
- **Exemple :** `Discussion sur le nouveau projet` ou `Proposition de partenariat`
- **Important :** Ce champ est **obligatoire**

### Champ 3 : Points importants à mentionner
- **Qu'est-ce que c'est ?** Les choses importantes à dire dans le document
- **Exemple :** Vous pouvez écrire plusieurs points, un par ligne :
  ```
  Budget de 5000€
  Délai de 3 mois
  Ressources nécessaires
  ```
- **Important :** Ce champ est **optionnel** (vous pouvez le laisser vide)

### Champ 4 : Email(s) du/des destinataire(s)
- **Qu'est-ce que c'est ?** L'adresse email où envoyer le document
- **Exemple :** `dupont@exemple.com`
- Si plusieurs destinataires : `dupont@exemple.com, martin@exemple.com`
- **Important :** Ce champ est **obligatoire**

## ✅ Étape 3 : Envoyer le Formulaire

1. **Vérifiez** que tous les champs obligatoires sont remplis
2. **Cliquez sur le bouton** "Soumettre" ou "Envoyer" (généralement en bas du formulaire)

Après avoir cliqué, vous verrez un message de confirmation :
> "Document généré avec succès. Vous allez recevoir un email de validation."

**Parfait !** Le système a créé votre document.

## 📧 Étape 4 : Valider le Document

Quelques secondes après l'envoi, vous recevrez **un email** avec :

### Dans l'email, vous verrez :
- **Tous les détails** du document (nom, contexte, etc.)
- **Le document Word en pièce jointe** (vous pouvez l'ouvrir pour voir le résultat)

### Deux boutons en bas de l'email :

#### ✅ Bouton "Approuver et envoyer"
- **Quand l'utiliser ?** Si le document vous convient
- **Que se passe-t-il ?** Le document sera envoyé au(x) destinataire(s) que vous avez indiqué(s) dans le formulaire

#### ❌ Bouton "Refuser"
- **Quand l'utiliser ?** Si vous n'êtes pas satisfait du document ou si vous changez d'avis
- **Que se passe-t-il ?** Le document ne sera **pas envoyé** et sera supprimé

### Comment faire ?

1. **Ouvrez votre email** (votre boîte de réception)
2. **Trouvez l'email de validation** (il arrive généralement dans les 30 secondes)
3. **Ouvrez la pièce jointe** pour lire le document
4. **Si le document est bon :** Cliquez sur "✅ Approuver et envoyer"
5. **Si le document n'est pas bon :** Cliquez sur "❌ Refuser"

## ✉️ Étape 5 : Vérifier l'Envoi

Après avoir approuvé :

1. Le destinataire recevra **un email** avec le document en pièce jointe
2. Vous pouvez vérifier dans vos emails que tout s'est bien passé
3. **Le dashboard FO Métaux se met à jour automatiquement** (voir section suivante)
4. C'est terminé !

## 📊 Dashboard FO Métaux : Suivi en Temps Réel

### 🔐 Connexion au Dashboard

1. **Ouvrez** `http://localhost:4081` dans votre navigateur
2. **Connectez-vous** avec votre compte FO Métaux
3. Vous arrivez sur la page d'accueil avec les statistiques

### 🔔 Centre de Notifications

Le **centre de notifications** (icône cloche 🔔 en haut à droite) vous tient informé en temps réel :

#### Types de Notifications

1. **📄 Nouveau document généré**
   - Reçue par : **Admins & Super Admins**
   - Contenu : "Nom d'utilisateur a généré un document Type_Document"
   - Quand : Dès qu'un document est créé via DocEase

2. **✍️ Document signé**
   - Reçue par : **Admins & Super Admins**
   - Contenu : "Nom d'utilisateur a signé Type_Document"
   - Quand : Dès qu'une signature est ajoutée

3. **👤 Action utilisateur**
   - Reçue par : **Admins & Super Admins**
   - Contenu : Autres actions importantes du système

#### Secrétaires vs Admins

- **Secrétaires** : Voient uniquement leurs propres notifications
- **Admins & Super Admins** : Voient TOUTES les notifications de tous les utilisateurs

#### Actions Disponibles

- **Marquer comme lu** : Cliquez sur ✓ à droite de la notification
- **Supprimer** : Cliquez sur 🗑️ pour effacer la notification
- **Tout marquer comme lu** : Bouton en haut du panneau
- **Supprimer tout le lu** : Nettoie les notifications déjà lues

### 📈 Onglets du Dashboard

#### 📊 Vue d'ensemble (Admins uniquement)
Statistiques globales :
- Carte globale avec données consolidées
- Graphiques d'activité
- Métriques clés du système

#### 👥 Salariés
- **Salariés actifs** : Utilisateurs avec activité dans les 30 derniers jours
- Liste détaillée des utilisateurs
- Statistiques par utilisateur

#### 📄 Documents
- Liste de tous les documents générés
- Filtres par type, date, utilisateur
- Statistiques de génération

#### 🚀 DocEase (Admins uniquement)
- **Statut du système** : Backend ngrok (🟢 en ligne / 🔴 hors ligne)
- **Documents récents** : 10 derniers documents avec timestamps
- **Badge "Nouveau"** : Affiche le nombre de documents des 7 derniers jours
- **Activité hebdomadaire** : Graphique des 7 derniers jours
- **Utilisateurs actifs** : Liste des utilisateurs DocEase

### ⚡ Fonctionnalités en Temps Réel

Le dashboard se met à jour **automatiquement sans recharger la page** grâce à Supabase Realtime :

1. **Nouveau document DocEase** :
   - ✅ Apparaît instantanément dans l'onglet DocEase
   - ✅ Badge "Nouveau" s'incrémente
   - ✅ Notification 🔔 pour les admins
   - ✅ Statistiques mises à jour (salariés actifs, total documents)

2. **Nouvelle signature** :
   - ✅ Apparaît dans les statistiques
   - ✅ Notification 🔔 pour les admins
   - ✅ Mise à jour du compteur de signatures

3. **Réactivité** : Les changements apparaissent en **2-3 secondes maximum**

### 📁 Modèles & Documents

Section pour partager des modèles de documents :

#### Ajouter un Document (Admins uniquement)
1. Cliquez sur **"Ajouter un document"**
2. Choisissez le mode :
   - **📁 Uploader un fichier** : Fichiers jusqu'à 50 MB (PDF, Word, Excel, Images, Vidéos)
   - **🔗 Lien URL** : Lien vers un document externe
3. Remplissez les champs (nom, catégorie, description)
4. Le fichier est uploadé sur Supabase Storage et disponible pour tous

#### Télécharger / Consulter
- Cliquez sur le bouton de téléchargement
- Le document s'ouvre ou se télécharge selon le type

### 💬 Assistant Chatbot

En bas à droite, l'**assistant IA** vous aide :
- Répond à vos questions sur le système
- Explique les fonctionnalités
- Badge de notification quand nouveau message
- Animation de rebond pour attirer l'attention

## 🔍 Exemple Complet

Pour mieux comprendre, voici un **exemple réel** :

### Ce que vous remplissez dans le formulaire :

- **Nom du destinataire :** `Jean Dupont`
- **Contexte du document :** `Proposition de collaboration pour le projet X`
- **Points importants :** 
  ```
  Budget de 10 000€
  Délai de réalisation : 2 mois
  Réunion de suivi hebdomadaire
  ```
- **Email(s) :** `jean.dupont@entreprise.com`

### Ce que le système fait :

1. Crée automatiquement un document Word professionnel
2. Rédige 2-3 paragraphes professionnels (grâce à l'IA)
3. Insère toutes vos informations
4. Vous l'envoie par email pour validation

### Ce que vous faites :

1. Vous recevez l'email avec le document
2. Vous l'ouvrez et vous le lisez
3. Si c'est bon, vous cliquez sur "Approuver"
4. Le document est envoyé à Jean Dupont automatiquement

## ⚠️ En Cas de Problème

### 🔴 Problèmes DocEase

#### Le formulaire ne s'affiche pas
- Vérifiez que vous avez bien tapé l'adresse correctement
- Essayez de rafraîchir la page (F5 ou Ctrl+R)
- Vérifiez que le serveur DocEase est lancé (`npm start` dans le dossier docease/)
- Si vous utilisez ngrok, vérifiez que le tunnel est actif
- Contactez le support technique

#### Je n'ai pas reçu l'email de validation
- Vérifiez vos **spams** ou **courriers indésirables**
- Attendez quelques minutes (parfois ça prend un peu de temps)
- Vérifiez que vous avez bien rempli tous les champs obligatoires
- Vérifiez la configuration SMTP dans `.env`
- Contactez le support technique

#### Le document généré n'est pas bon
- **Pas de panique !** Cliquez simplement sur "❌ Refuser"
- Recommencez avec le formulaire et modifiez ce qui ne va pas
- Vous pouvez essayer plusieurs fois jusqu'à obtenir le résultat souhaité
- Vérifiez que Ollama est bien lancé (`ollama serve`)

#### Le document n'a pas été envoyé au destinataire
- Vérifiez que vous avez bien cliqué sur "✅ Approuver et envoyer"
- Vérifiez que l'adresse email du destinataire est correcte
- Contactez le support technique si le problème persiste

### 🔴 Problèmes Dashboard FO Métaux

#### Le dashboard ne se charge pas
- Vérifiez que le serveur est lancé (`npm run dev` dans le dossier principal)
- L'URL doit être `http://localhost:4081`
- Vérifiez votre connexion internet (Supabase)
- Rafraîchissez la page (Ctrl+R)

#### Je ne reçois pas de notifications
1. **Vérifiez les migrations Supabase** :
   - Les triggers doivent être activés dans la base de données
   - Exécutez `MIGRATION_NOTIFICATIONS.sql` dans Supabase SQL Editor
   
2. **Vérifiez Realtime** :
   - Dans Supabase Dashboard → Database → Replication
   - Tables `docease_documents` et `notifications` doivent être dans `supabase_realtime`
   - Si manquantes, exécutez :
     ```sql
     ALTER PUBLICATION supabase_realtime ADD TABLE docease_documents;
     ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
     ```

3. **Testez avec le script de diagnostic** :
   ```powershell
   .\test-realtime.ps1
   ```
   Ce script vérifie la connexion, crée un document de test, et vérifie si les notifications sont créées.

#### Le centre de notification affiche "Chargement..." en permanence
- Vérifiez votre connexion Supabase
- Vérifiez que la table `notifications` existe
- Contactez le support technique

#### Les statistiques ne se mettent pas à jour en temps réel
1. **Vérifiez Supabase Realtime** :
   - Tables `docease_documents` et `signatures` dans la publication
   
2. **Vérifiez le webhook** :
   - Dans DocEase, le webhook doit pointer vers `https://geljwonckfmdkaywaxly.supabase.co/functions/v1/docease-webhook`
   - L'API key doit être correcte : `fo-metaux-docease-2025`
   
3. **Testez manuellement** :
   ```powershell
   # Créer un document via l'API REST
   Invoke-RestMethod -Uri "https://geljwonckfmdkaywaxly.supabase.co/rest/v1/docease_documents" -Method Post -Headers @{"apikey"="[ANON_KEY]"; "Content-Type"="application/json"} -Body '{"user_email":"test@exemple.com","document_type":"test","title":"Test.docx"}'
   ```

#### Le statut DocEase affiche toujours "Hors ligne" 🔴
- Vérifiez que ngrok est lancé (`.\setup-ngrok.bat`)
- L'URL ngrok doit être accessible depuis l'extérieur
- Le backend DocEase doit être actif
- Testez l'URL manuellement dans le navigateur

#### Upload de fichier échoue
- Vérifiez que vous êtes connecté en tant qu'Admin ou Super Admin
- Le fichier doit faire moins de 50 MB
- Format accepté : PDF, Word, Excel, Images (JPG/PNG/GIF), Vidéos (MP4/AVI/MOV)
- Vérifiez que le bucket Storage `shared-documents` existe dans Supabase
- Exécutez `MIGRATION_STORAGE_BUCKET.sql` si nécessaire

## 💡 Conseils Pratiques

### Pour de meilleurs résultats avec DocEase :

1. **Soyez précis** dans le contexte : plus vous donnez de détails, mieux le document sera rédigé par l'IA
2. **Vérifiez les emails** : assurez-vous que l'adresse email est correcte (pas de faute de frappe)
3. **Lisez toujours** le document avant d'approuver
4. **Testez d'abord** avec un document de test si c'est la première fois

### Pour une meilleure utilisation du Dashboard :

1. **Activez les notifications** : Gardez le centre de notifications ouvert pour ne rien manquer
2. **Consultez régulièrement** l'onglet DocEase pour voir l'activité en temps réel
3. **Utilisez les filtres** : Les onglets permettent de voir exactement ce dont vous avez besoin
4. **Profitez du Realtime** : Pas besoin de recharger, tout se met à jour automatiquement
5. **Assistant IA** : N'hésitez pas à poser des questions au chatbot en bas à droite

### Choses à éviter :

#### DocEase
- ❌ Ne pas remplir les champs obligatoires
- ❌ Mettre des emails incorrects
- ❌ Approuver sans lire le document
- ❌ Utiliser le système pour des documents confidentiels sans vérification

#### Dashboard
- ❌ Partager vos identifiants de connexion
- ❌ Laisser votre session ouverte sur un poste public
- ❌ Ignorer les notifications importantes
- ❌ Modifier des documents sans autorisation (admins uniquement)

## 📞 Besoin d'Aide ?

Si vous avez des questions ou des problèmes :

1. Consultez d'abord cette page (peut-être que la réponse est déjà là)
2. Vérifiez la section "En Cas de Problème" ci-dessus
3. Contactez le support technique :
   - Par email : [votre-email@exemple.com]
   - Par téléphone : [votre-numéro]

## 🔧 Section Technique (Administrateurs)

### Architecture du Système

#### Stack Technique

**DocEase (Frontend)**
- React 19.2.0 + TypeScript + Vite
- Port : `3000`
- Tunnel : ngrok pour exposition publique
- IA : Ollama (modèles locaux)

**Dashboard FO Métaux (Frontend)**
- React 18.2.0 + TypeScript + Vite
- Port : `4081`
- Backend : Supabase (PostgreSQL + Realtime + Storage + Edge Functions)
- Authentification : Supabase Auth avec OAuth Outlook

**Base de données Supabase**
- Tables principales :
  - `users` : Utilisateurs avec rôles (secretary, admin, super_admin)
  - `docease_documents` : Documents générés via DocEase
  - `signatures` : Signatures électroniques
  - `notifications` : Notifications en temps réel
  - `shared_documents` : Modèles et documents partagés
- Realtime activé sur : `docease_documents`, `signatures`, `notifications`
- Storage Bucket : `shared-documents` (50MB limit)

#### Flux de Données

1. **Génération de document DocEase** :
   ```
   Utilisateur → Formulaire DocEase → Ollama IA → Document Word
   → Email validation → Approbation → Webhook Supabase
   → INSERT dans docease_documents → Trigger PostgreSQL
   → INSERT dans notifications → Realtime push
   → Dashboard mise à jour + notification 🔔
   ```

2. **Notifications en temps réel** :
   ```
   Trigger PostgreSQL (notify_admins()) → Table notifications
   → Supabase Realtime → useNotifications hook
   → NotificationPanel update → Badge + Toast
   ```

3. **Upload de fichier** :
   ```
   Utilisateur Admin → Modal upload → Validation format/taille
   → Supabase Storage (bucket shared-documents)
   → Public URL générée → INSERT shared_documents
   → Affichage dans la liste
   ```

### Commandes de Déploiement

#### Démarrer DocEase
```powershell
cd docease
npm start
# OU pour ngrok automatique :
.\start.bat
```

#### Démarrer Dashboard FO Métaux
```powershell
npm run dev
# Accessible sur http://localhost:4081
```

#### Démarrer Ollama (IA)
```powershell
ollama serve
# Vérifier les modèles : ollama list
```

#### Test de diagnostic
```powershell
.\test-realtime.ps1
# Vérifie : connexion, création document, notification, triggers
```

### Migrations Supabase à Exécuter

1. **MIGRATION_NOTIFICATIONS.sql** :
   - Crée la table `notifications`
   - Active les triggers sur `docease_documents` et `signatures`
   - Ajoute les tables à Realtime publication

2. **MIGRATION_STORAGE_BUCKET.sql** :
   - Crée le bucket `shared-documents`
   - Configure les policies RLS (admins write, public read)

3. **Autres migrations** :
   - `MIGRATION_ROLES.sql` : Système de rôles
   - `AUTO_ROLE_TRIGGER.sql` : Attribution automatique des rôles
   - `UPDATE_USERS_RLS.sql` : Policies RLS sur users

### Variables d'Environnement

#### DocEase `.env`
```env
VITE_NGROK_URL=https://[votre-url].ngrok-free.dev
VITE_OLLAMA_URL=http://localhost:11434
VITE_SUPABASE_URL=https://geljwonckfmdkaywaxly.supabase.co
VITE_SUPABASE_ANON_KEY=[votre-anon-key]
VITE_WEBHOOK_API_KEY=fo-metaux-docease-2025
```

#### Dashboard FO Métaux `.env`
```env
VITE_SUPABASE_URL=https://geljwonckfmdkaywaxly.supabase.co
VITE_SUPABASE_ANON_KEY=[votre-anon-key]
```

### Vérifications de Santé

#### Vérifier Supabase Realtime
```sql
-- Dans Supabase SQL Editor
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
-- Doit retourner : docease_documents, notifications, signatures
```

#### Vérifier les Triggers
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE 'notify%';
-- Doit retourner : notify_on_document_created, notify_on_signature_created
```

#### Vérifier les Notifications
```sql
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN read = false THEN 1 END) as unread
FROM notifications;
```

### Gestion des Rôles

#### Attribution manuelle d'un rôle
```sql
UPDATE users 
SET role_level = 'admin', 
    role = ARRAY['admin'] 
WHERE email = 'utilisateur@exemple.com';
```

#### Promouvoir en Super Admin
```sql
-- Exécuter ASSIGN_SUPER_ADMINS.sql
-- OU manuellement :
UPDATE users 
SET role_level = 'super_admin', 
    role = ARRAY['super_admin'] 
WHERE email = 'admin@fo-metaux.com';
```

## 🎉 Félicitations !

Vous savez maintenant utiliser le système complet DocEase + Dashboard FO Métaux ! 

**Résumé pour les utilisateurs :**
1. ✅ Remplir le formulaire DocEase
2. ✅ Valider le document par email
3. ✅ Suivre en temps réel dans le dashboard FO Métaux
4. ✅ Recevoir des notifications sur chaque action

**Résumé pour les admins :**
1. ✅ Surveiller l'activité en temps réel
2. ✅ Gérer les utilisateurs et leurs rôles
3. ✅ Uploader et partager des modèles
4. ✅ Consulter les statistiques globales

Bonne utilisation ! 🚀

---

**Note importante :** Ce système est conçu pour être simple à utiliser tout en offrant des fonctionnalités avancées. Si vous trouvez quelque chose de compliqué, n'hésitez pas à demander de l'aide ou consulter les autres guides dans `docease/docs/`.

