# Guide : Configurer Ollama avec n8n

Guide complet pour utiliser Ollama (IA locale) avec votre workflow n8n.

## 📋 Prérequis

- ✅ Ollama installé sur votre machine
- ✅ Un modèle téléchargé (ex: llama2, mistral, etc.)
- ✅ Ollama en cours d'exécution

## 🚀 Configuration Rapide

### Étape 1 : Vérifier qu'Ollama fonctionne

```powershell
# Vérifier qu'Ollama répond
curl http://localhost:11434/api/tags

# Si vous voyez la liste des modèles, Ollama fonctionne !
```

Ou testez dans votre navigateur : http://localhost:11434/api/tags

### Étape 2 : Télécharger un Modèle (si pas déjà fait)

```powershell
# Télécharger un modèle (remplacez "llama2" par celui que vous voulez)
ollama pull llama2

# Autres modèles populaires :
# ollama pull mistral
# ollama pull codellama
# ollama pull phi
```

### Étape 3 : Tester Ollama Localement

```powershell
# Test simple
ollama run llama2 "Bonjour, comment allez-vous ?"
```

Si ça fonctionne, vous êtes prêt !

---

## ⚙️ Configuration dans n8n

Il y a **deux méthodes** pour utiliser Ollama avec n8n :

### Méthode 1 : HTTP Request (Recommandée - Plus Simple)

Cette méthode est plus simple et ne nécessite pas de node communautaire supplémentaire.

#### Configuration :

1. **Dans le workflow n8n**, trouvez le nœud **"Génération IA"**
2. **Remplacez-le** par un nœud **"HTTP Request"**
3. **Configurez le nœud** :
   - **Method** : `POST`
   - **URL** : `http://host.docker.internal:11434/api/generate`
   - **Authentication** : None
   - **Body Content Type** : JSON
   - **Body** :
   ```json
   {
     "model": "llama2",
     "prompt": "Rédigez un texte professionnel et courtois en français de 2 à 3 paragraphes basé sur le contexte suivant :\n\nContexte : {{ $json.contexte }}\n\nPoints importants : {{ $json.points_importants }}\n\nLe texte doit être formel, professionnel et adapté à une correspondance professionnelle. Incluez une introduction, un développement des points mentionnés, et une conclusion ouverte.",
     "stream": false
   }
   ```
4. **Sauvegardez**

5. **Après le nœud HTTP Request**, ajoutez un nœud **"Set"** pour extraire la réponse :
   - **Name** : `texte_ia`
   - **Value** : `={{ JSON.parse($json.body).response }}`

#### Note pour Windows/Docker :

**Important** : Pour accéder à Ollama depuis le conteneur Docker sur Windows, utilisez :
- `http://host.docker.internal:11434` (au lieu de `localhost:11434`)

---

### Méthode 2 : LangChain Node (Avancée)

Si vous préférez utiliser le node LangChain (plus de contrôle mais plus complexe).

#### Installation du node LangChain :

1. Dans n8n → **Settings** → **Community Nodes**
2. Installez : `@n8n/n8n-nodes-langchain`

#### Configuration :

1. **Dans le workflow**, le nœud "Génération IA" utilise déjà LangChain
2. **Modifiez le nœud** pour utiliser Ollama :
   - **Model** : Sélectionnez "Custom LLM"
   - **Base URL** : `http://host.docker.internal:11434`
   - **API Path** : `/api/generate`
   - **Model Name** : `llama2` (ou votre modèle)
   - **Temperature** : `0.7`
   - **Max Tokens** : `500`

---

## 🔧 Modifier le Workflow pour Ollama

Je vais créer une version du workflow adaptée pour Ollama :

### Option A : Modifier le Workflow Importé

1. Importez le workflow `generateur_document.json`
2. **Remplacez le nœud "Génération IA"** :
   - Supprimez-le ou désactivez-le
   - Ajoutez un nœud **HTTP Request** à la place
   - Configurez comme indiqué ci-dessus

### Option B : Utiliser la Version Ollama du Workflow

Je peux créer une version du workflow préconfigurée pour Ollama. Dites-moi si vous voulez que je la crée !

---

## 🧪 Tester la Configuration

### Test 1 : Vérifier la connexion depuis Docker

```powershell
# Depuis le conteneur Docker
docker exec -it n8n-local curl http://host.docker.internal:11434/api/tags
```

### Test 2 : Test depuis n8n

1. Créez un workflow de test simple :
   - **HTTP Request** → **Set** (pour afficher la réponse)
2. Configurez le HTTP Request avec Ollama
3. Exécutez le workflow manuellement
4. Vérifiez la réponse dans le nœud Set

### Test 3 : Test avec le Workflow Complet

1. Remplissez le formulaire avec des données de test
2. Vérifiez les logs :
   ```powershell
   docker logs n8n-local -f
   ```
3. Vérifiez que le texte est bien généré dans le document final

---

## 🐛 Problèmes Courants

### Ollama n'est pas accessible depuis Docker

**Symptôme** : Erreur "Connection refused" ou timeout

**Solutions** :

1. **Sur Windows/Mac** : Utilisez `host.docker.internal` :
   ```
   http://host.docker.internal:11434
   ```

2. **Sur Linux** : Utilisez l'IP de l'hôte :
   ```powershell
   # Trouver l'IP de la machine hôte
   ip addr show docker0
   # Utilisez cette IP au lieu de localhost
   ```

3. **Alternative** : Exposez Ollama dans Docker (plus complexe)

### Le modèle n'est pas trouvé

**Symptôme** : Erreur "model not found"

**Solutions** :
- Vérifiez que le modèle est bien téléchargé : `ollama list`
- Vérifiez que le nom du modèle dans n8n correspond exactement

### Réponse vide ou erreur

**Symptôme** : Le texte n'est pas généré

**Solutions** :
- Vérifiez les logs Ollama (dans le terminal où Ollama tourne)
- Vérifiez que `stream: false` dans la requête HTTP
- Vérifiez le format de la réponse dans le nœud Set

---

## 📝 Exemple de Configuration Complète HTTP Request

Voici la configuration exacte pour le nœud HTTP Request :

### Configuration du Nœud HTTP Request

**Method** : `POST`  
**URL** : `http://host.docker.internal:11434/api/generate`  
**Body Content Type** : `JSON`

**Body** (JSON) :
```json
{
  "model": "llama2",
  "prompt": "Rédigez un texte professionnel et courtois en français de 2 à 3 paragraphes. Contexte : {{ $('Formater Données').item.json.contexte }}. Points importants : {{ $('Formater Données').item.json.points_importants }}. Le texte doit être formel et professionnel.",
  "stream": false
}
```

### Nœud Set pour Extraire la Réponse

Après le HTTP Request, ajoutez un nœud **Set** :

**Mode** : Manual  
**Values** :
- **Name** : `texte_ia`  
- **Value** : `={{ JSON.parse($json.body).response }}`

---

## 🔄 Workflow Modifié pour Ollama

Si vous voulez, je peux créer une version modifiée du workflow `generateur_document.json` qui utilise Ollama directement.

Cette version aurait :
- ✅ Nœud HTTP Request configuré pour Ollama
- ✅ Extraction de la réponse automatique
- ✅ Gestion des erreurs améliorée
- ✅ Prêt à l'emploi

Dites-moi si vous voulez que je la crée !

---

## ✅ Checklist de Configuration

- [ ] Ollama installé et fonctionnel
- [ ] Modèle téléchargé (testé avec `ollama run`)
- [ ] Ollama accessible depuis Docker (`host.docker.internal:11434`)
- [ ] Nœud HTTP Request configuré dans le workflow
- [ ] Nœud Set pour extraire la réponse configuré
- [ ] Test avec workflow de test réussi
- [ ] Test avec workflow complet réussi

---

## 💡 Astuces

1. **Choisissez le bon modèle** :
   - `llama2` : Bon équilibre qualité/vitesse
   - `mistral` : Plus performant, plus rapide
   - `phi` : Très rapide, léger

2. **Ajustez les paramètres** :
   - `temperature` : Plus élevé = plus créatif (0.7-0.9)
   - `num_predict` : Nombre de tokens max (500 pour 2-3 paragraphes)

3. **Optimisez le prompt** :
   - Soyez spécifique : "texte professionnel en français"
   - Donnez le contexte : utilisez les variables du formulaire
   - Précisez le format attendu : "2 à 3 paragraphes"

---

**Vous êtes prêt à utiliser Ollama avec n8n !** 🚀

Si vous voulez, je peux adapter le workflow directement pour vous.

