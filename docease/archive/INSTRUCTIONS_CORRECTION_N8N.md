# Instructions pour Corriger le Workflow n8n

## Problème Actuel

Le nœud **"Générer Word Final"** dans le webhook `/webhook/validate-doc` lance une erreur si le fichier Word n'est pas fourni. Il faut le modifier pour qu'il puisse :
1. Utiliser le Word fourni en base64 si disponible
2. OU rediriger vers la génération du Word si non fourni

## Solution : Ajouter un nœud IF avant "Générer Word Final"

### Étape 1 : Ouvrir le Workflow dans n8n

1. Ouvre ton navigateur : http://localhost:5678/workflow/AJtlydAXDxYu7HTq
2. Le workflow "gpt_generator" devrait s'ouvrir

### Étape 2 : Ajouter un nœud IF après "Validation (Webhook)"

1. Clique sur le nœud **"Validation (Webhook)"**
2. Clique sur le **+** pour ajouter un nouveau nœud
3. Cherche et sélectionne **"IF"** (nœud de condition)
4. Configure le nœud IF :
   - **Condition 1** :
     - Field Name: `{{ $json.body.wordfile }}`
     - Operation: `is not empty`
   
5. Renomme ce nœud en **"Word Déjà Généré ?"**

### Étape 3 : Connecter les Branches

#### Branche TRUE (Word déjà fourni)
1. Connecte la sortie **TRUE** du nœud IF au nœud **"Générer Word Final"**
2. Modifie le nœud "Générer Word Final" pour supprimer l'erreur :

```javascript
// Logger ce qui arrive au webhook
console.log('=== VALIDATION WEBHOOK RECU ===');
console.log('Body:', $json.body);

// Récupérer toutes les variables
const civiliteDestinataire = $json.body?.civiliteDestinataire || $json.civiliteDestinataire;
const nomDestinataire = $json.body?.nomDestinataire || $json.nomDestinataire;
const statutDestinataire = $json.body?.statutDestinataire || $json.statutDestinataire;
const batiment = $json.body?.batiment || $json.batiment;
const adresse = $json.body?.adresse || $json.adresse;
const cpVille = $json.body?.cpVille || $json.cpVille;
const objet = $json.body?.objet || $json.objet;
const numeroCourrier = $json.body?.numeroCourrier || $json.numeroCourrier;
const civiliteRemplace = $json.body?.civiliteRemplace || $json.civiliteRemplace;
const nomRemplace = $json.body?.nomRemplace || $json.nomRemplace;
const codeDocument = $json.body?.codeDocument || $json.codeDocument;
const civiliteDelegue = $json.body?.civiliteDelegue || $json.civiliteDelegue;
const nomDelegue = $json.body?.nomDelegue || $json.nomDelegue;
const emailDelegue = $json.body?.emailDelegue || $json.emailDelegue;
const emailDestinataire = $json.body?.emailDestinataire || $json.emailDestinataire;
const signatureExp = $json.body?.signatureExp || $json.signatureExp;
const wordBase64 = $json.body?.wordfile || $json.wordfile;

console.log('Variables recues:', { objet, nomDestinataire, emailDestinataire });

if (!emailDestinataire) {
  throw new Error('Aucun destinataire fourni !');
}

// SUPPRIME CETTE LIGNE :
// if (!wordBase64) {
//   throw new Error('Fichier Word manquant !');
// }

// Si pas de Word fourni, on ne peut pas continuer sur cette branche
if (!wordBase64) {
  throw new Error('Cette branche necessite un fichier Word deja genere');
}

// Formater les destinataires
const emailList = emailDestinataire.split(',').map(email => email.trim()).filter(email => email.length > 0).join(', ');

// Retourner les données avec le binaire Word
return {
  json: {
    civiliteDestinataire,
    nomDestinataire,
    statutDestinataire,
    batiment,
    adresse,
    cpVille,
    objet,
    numeroCourrier,
    civiliteRemplace,
    nomRemplace,
    codeDocument,
    civiliteDelegue,
    nomDelegue,
    emailDelegue,
    emailDestinataire: emailList,
    signatureExp
  },
  binary: {
    data: {
      data: wordBase64,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName: `Document_${objet}_${Date.now()}.docx`
    }
  }
};
```

#### Branche FALSE (Word à générer)
1. Connecte la sortie **FALSE** du nœud IF au nœud **"Préparer Données"** (celui du flow formulaire-doc)
2. Ensuite, connecte le flow de génération :
   - Préparer Données → Charger Template → Générer Document → ... → jusqu'à avoir le Word
3. À la fin de ce flow, connecte au nœud **"Envoi Email"**

### Étape 4 : Simplifier (Alternative Plus Simple)

**OU** plus simplement, modifie juste le nœud "Générer Word Final" pour ne PAS lancer d'erreur si le Word est manquant, et laisse le webhook validate-doc TOUJOURS recevoir un Word déjà généré.

Dans ce cas :
1. Le bouton "Télécharger" appelle `/webhook/formulaire-doc` → génère et retourne le Word
2. Le bouton "Générer et envoyer" :
   - Appelle d'abord `/webhook/formulaire-doc` pour générer le Word
   - Puis appelle `/webhook/validate-doc` avec le Word en base64

### Étape 5 : Tester

1. Sauvegarde le workflow (Ctrl+S)
2. Active le workflow (toggle en haut à droite)
3. Teste avec le formulaire :
   - Clique sur "Télécharger le document"
   - Puis clique sur "Générer et envoyer"

## Solution Recommandée (La Plus Simple)

**Modifier le bouton "Générer et envoyer" dans le formulaire pour qu'il génère TOUJOURS le Word avant d'envoyer :**

```javascript
// Bouton "Générer et envoyer"
document.getElementById("sendEmailBtn").addEventListener("click", async () => {
  try {
    // 1. Générer le Word si pas déjà fait
    if (!generatedWordBase64) {
      // Appeler formulaire-doc pour générer
      const genResponse = await fetch("http://localhost:3000/webhook/formulaire-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      const genResult = await genResponse.json()
      generatedWordBase64 = genResult.data
    }
    
    // 2. Envoyer l'email avec le Word
    data.wordfile = generatedWordBase64
    const sendResponse = await fetch("http://localhost:3000/webhook/validate-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    
    alert('Email envoyé avec succès !')
  } catch (error) {
    alert('Erreur : ' + error.message)
  }
})
```

Cette solution ne nécessite AUCUNE modification du workflow n8n !

