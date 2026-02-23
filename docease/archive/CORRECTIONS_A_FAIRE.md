# Corrections à Faire dans n8n

## Résumé du Problème

Le workflow n8n a 2 webhooks mais le nœud "Générer Word Final" dans `/webhook/validate-doc` lance une erreur si le fichier Word n'est pas fourni.

## ✅ Corrections Déjà Faites

1. **Formulaire HTML** - Le bouton "Télécharger" utilise maintenant `/webhook/formulaire-doc`
2. **Formulaire HTML** - Le bouton "Générer et envoyer" génère le Word avant d'envoyer

## ❌ Corrections à Faire dans n8n

### Option 1 : Modifier le Nœud "Générer Word Final" (SIMPLE)

1. Ouvre n8n : http://localhost:5678/workflow/AJtlydAXDxYu7HTq
2. Clique sur le nœud **"Générer Word Final"**
3. Remplace le code par celui-ci :

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

console.log('Variables recues:', { objet, nomDestinataire, emailDestinataire, hasWord: !!wordBase64 });

if (!emailDestinataire) {
  throw new Error('Aucun destinataire fourni !');
}

if (!wordBase64) {
  throw new Error('Fichier Word manquant ! Le formulaire doit generer le Word avant d\'appeler ce webhook.');
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

4. Sauvegarde (Ctrl+S)
5. Active le workflow (toggle en haut à droite)

### Option 2 : Vérifier les Autres Nœuds

#### Nœud "Envoi Email"
- Vérifie que le champ **Attachments** est configuré sur `data`
- Vérifie que **From Email** est `contact@fo-metaux.fr`
- Vérifie que **To Email** est `={{ $json.emailDestinataire }}`

#### Nœud "Réponse Finale"
- Vérifie que le **Response Body** contient :
```json
{{ { "success": true, "message": "Document généré et envoyé par email avec succès", "destinataire": $('Générer Word Final').item.json.emailDestinataire, "objet": $('Générer Word Final').item.json.objet } }}
```

## 🧪 Tests à Faire

### Test 1 : Télécharger le Document
1. Ouvre le formulaire : http://localhost:3000
2. Remplis tous les champs
3. Clique sur "Prévisualiser"
4. Clique sur "Télécharger le document"
5. **Résultat attendu** : Le document Word se télécharge

### Test 2 : Générer et Envoyer
1. Ouvre le formulaire : http://localhost:3000
2. Remplis tous les champs
3. Clique sur "Prévisualiser"
4. Clique sur "Générer et envoyer"
5. **Résultat attendu** : Email envoyé avec le document en pièce jointe

### Test 3 : Vérifier les Logs n8n
1. Ouvre n8n : http://localhost:5678/workflow/AJtlydAXDxYu7HTq
2. Clique sur "Executions" en haut à droite
3. Vérifie que les exécutions sont réussies (✅)
4. Si erreur (❌), clique dessus pour voir les détails

## 📋 Checklist

- [ ] Modifier le nœud "Générer Word Final" dans n8n
- [ ] Sauvegarder le workflow
- [ ] Activer le workflow
- [ ] Tester le bouton "Télécharger"
- [ ] Tester le bouton "Générer et envoyer"
- [ ] Vérifier les emails reçus
- [ ] Vérifier les logs n8n

## 🔍 Debugging

Si ça ne fonctionne pas :

1. **Ouvre la console du navigateur** (F12)
2. **Regarde les logs** dans l'onglet Console
3. **Vérifie les requêtes** dans l'onglet Network
4. **Vérifie les logs n8n** dans les Executions

### Erreurs Possibles

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Fichier Word manquant !" | Le Word n'a pas été généré | Vérifie que le bouton génère bien le Word avant d'envoyer |
| "Aucun destinataire fourni !" | Champ email vide | Ajoute au moins un email |
| Erreur 500 | Erreur serveur n8n | Vérifie les logs n8n |
| Erreur SMTP | Configuration email incorrecte | Vérifie les credentials SMTP dans n8n |

## 📝 Notes

- Le formulaire HTML a été corrigé pour générer le Word avant d'envoyer
- Le workflow n8n doit juste recevoir le Word et l'envoyer par email
- Les deux webhooks fonctionnent indépendamment :
  - `/webhook/formulaire-doc` : génère et retourne le Word
  - `/webhook/validate-doc` : reçoit le Word et l'envoie par email

