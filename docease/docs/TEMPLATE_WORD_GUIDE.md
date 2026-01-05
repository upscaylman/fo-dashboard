# Guide de création du Template Word

## 📋 Structure du document

Le template doit contenir :
- **En-tête** : Logo + Code document + Objet + Numéro
- **Corps** : Bloc destinataire (commun) + Sections conditionnelles
- **Pied de page** : Date

---

## 🔧 Configuration de la page

1. Ouvre Word et crée un nouveau document
2. Va dans **Mise en page > Marges > Marges personnalisées**
   - Haut : `0.6 cm`
   - Bas : `0.85 cm`
   - Gauche : `0 cm`
   - Droite : `0 cm`

---

## 📄 EN-TÊTE (Insertion > En-tête > Modifier l'en-tête)

```
[Insérer logo FO METAUX ici - Insertion > Images]

{codeDocument}

Objet : Lettre recommandée avec A.R. – Désignation
N°{numeroCourrier}

```

**Mise en forme de l'en-tête :**
- Police : Arial, 11pt, Gras
- Alignement : Gauche

---

## 📝 CORPS DU DOCUMENT

### Bloc destinataire (COMMUN - toujours affiché)

```
Société {entreprise}
{civiliteDestinataire} {nomDestinataire}
{statutDestinataire}
{batiment}
{adresse}
{cpVille}
{emailDestinataire}

```

**Mise en forme :**
- Police : Aptos, 11pt
- Alignement : Justifié

---

### ⚠️ IMPORTANT : Balises conditionnelles

Les balises `{#isDesignation}` et `{/isDesignation}` doivent être :
- **Dans le corps du document** (pas dans des zones de texte)
- **En rouge, taille 10pt** pour les distinguer visuellement
- **Avec le saut de page AVANT la balise de fermeture**

---

### SECTION 1 : DÉSIGNATION

```
{#isDesignation}

Nous vous informons que la Fédération FO de la Métallurgie désigne en qualité de Délégué Syndical dans votre entreprise:

⇨  {civiliteDelegue} {nomDelegue}
    {emailDelegue}

En remplacement de {civiliteRemplace} {nomRemplace}.

Nous vous demandons de bien vouloir lui adresser toutes convocations et informations nécessaires à l'exercice de son mandat.

Veuillez agréer, {civiliteDestinataire}, l'expression de nos sincères salutations.

{signatureExp}
Secrétaire Fédéral

[SAUT DE PAGE ICI - Appuie sur Ctrl+Entrée]

{/isDesignation}
```

**Mise en forme :**
- Texte normal : Aptos, 11pt, Noir
- Délégué nommé : **Gras**
- Balises `{#isDesignation}` et `{/isDesignation}` : **Rouge, 10pt**
- Alignement : Justifié

---

### SECTION 2 : MANDAT DE NÉGOCIATION

```
{#isMandatNego}

Nous vous informons que la Fédération FO de la Métallurgie désigne aux fins de négocier, et éventuellement signer le protocole d'accord préélectoral en vue de l'élection des membres de la délégation du personnel du comité social et économique de la société {entreprise}

⇨  {civiliteDelegue} {nomDelegue} ({entreprise})
    {emailDelegue}

Veuillez agréer, {civiliteDestinataire}, l'expression de nos sincères salutations.

{signatureExp}
Secrétaire Fédéral

[SAUT DE PAGE ICI - Appuie sur Ctrl+Entrée]

{/isMandatNego}
```

**Mise en forme :**
- Texte normal : Aptos, 11pt, Noir
- Mandataire nommé : **Gras**
- Balises `{#isMandatNego}` et `{/isMandatNego}` : **Rouge, 10pt**
- Alignement : Justifié

---

## 📄 PIED DE PAGE (Insertion > Pied de page > Modifier le pied de page)

```
Paris, le {date}
```

**Mise en forme :**
- Police : Aptos, 11pt
- Alignement : Droite

---

## ✅ CHECKLIST FINALE

Avant de sauvegarder, vérifie que :

- [ ] Les marges sont correctes (0.6 / 0.85 / 0 / 0)
- [ ] L'en-tête contient le logo FO METAUX
- [ ] L'en-tête contient `{codeDocument}` et `{numeroCourrier}`
- [ ] Le bloc destinataire est dans le corps (pas dans une zone de texte)
- [ ] Les balises `{#isDesignation}` et `{/isDesignation}` sont en ROUGE
- [ ] Les balises `{#isMandatNego}` et `{/isMandatNego}` sont en ROUGE
- [ ] Les sauts de page sont AVANT les balises de fermeture `{/...}`
- [ ] Le pied de page contient `{date}` aligné à droite
- [ ] Aucune zone de texte n'est utilisée (tout est dans le corps)

---

## 💾 SAUVEGARDE

1. Fichier > Enregistrer sous
2. Nom : `template_principal_new.docx`
3. Emplacement : `templates/word/`
4. Format : **Document Word (.docx)**

---

## 🧪 TEST

Après avoir créé le template :

1. Sauvegarde l'ancien template :
   ```powershell
   Copy-Item templates\word\template_principal.docx templates\word\template_principal_backup.docx
   ```

2. Remplace par le nouveau :
   ```powershell
   Copy-Item templates\word\template_principal_new.docx templates\word\template_principal.docx
   ```

3. Redémarre n8n :
   ```powershell
   docker restart n8n-local
   ```

4. Teste avec le formulaire :
   - Ouvre http://localhost:5678/webhook/formulaire-doc
   - Remplis avec `templateType = "designation"`
   - Vérifie que seule la section DÉSIGNATION apparaît dans le document

---

## 📊 VARIABLES DISPONIBLES

### Variables communes
- `{codeDocument}` - Code de l'entreprise (ex: FOMETAUX)
- `{numeroCourrier}` - Numéro du courrier
- `{date}` - Date formatée (ex: 6 novembre 2025)
- `{entreprise}` - Nom de l'entreprise

### Variables destinataire
- `{civiliteDestinataire}` - Madame / Monsieur
- `{nomDestinataire}` - Nom complet
- `{statutDestinataire}` - Fonction (ex: Directrice)
- `{batiment}` - Bâtiment (optionnel)
- `{adresse}` - Adresse postale
- `{cpVille}` - Code postal + Ville
- `{emailDestinataire}` - Email

### Variables délégué
- `{civiliteDelegue}` - Madame / Monsieur
- `{nomDelegue}` - Nom complet du délégué
- `{emailDelegue}` - Email du délégué

### Variables remplacement (désignation uniquement)
- `{civiliteRemplace}` - Madame / Monsieur
- `{nomRemplace}` - Nom de la personne remplacée

### Variables conditionnelles
- `{#isDesignation}` - Début section désignation
- `{/isDesignation}` - Fin section désignation
- `{#isMandatNego}` - Début section mandat négociation
- `{/isMandatNego}` - Fin section mandat négociation

### Signature
- `{signatureExp}` - Nom de l'expéditeur

---

## 🎨 EXEMPLE VISUEL

```
┌─────────────────────────────────────────┐
│ EN-TÊTE                                 │
│ [Logo] {codeDocument}                   │
│ Objet: ... N°{numeroCourrier}           │
└─────────────────────────────────────────┘

Société {entreprise}
{civiliteDestinataire} {nomDestinataire}
...

{#isDesignation}  ← EN ROUGE
Nous vous informons...
⇨ {civiliteDelegue} {nomDelegue}
...
[SAUT DE PAGE]
{/isDesignation}  ← EN ROUGE

{#isMandatNego}  ← EN ROUGE
Nous vous informons...
⇨ {civiliteDelegue} {nomDelegue}
...
[SAUT DE PAGE]
{/isMandatNego}  ← EN ROUGE

┌─────────────────────────────────────────┐
│ PIED DE PAGE                            │
│                   Paris, le {date}      │
└─────────────────────────────────────────┘
```

---

## ❓ DÉPANNAGE

### Problème : Les deux sections s'affichent toujours

**Cause** : Les balises conditionnelles sont dans des zones de texte

**Solution** : 
1. Supprime toutes les zones de texte
2. Écris tout le contenu directement dans le corps du document
3. Les balises doivent être du texte normal (pas dans des objets)

### Problème : Les sauts de page ne sont pas masqués

**Cause** : Le saut de page est APRÈS la balise de fermeture

**Solution** :
1. Place le curseur AVANT `{/isDesignation}`
2. Appuie sur Ctrl+Entrée pour insérer le saut de page
3. Le saut doit être DANS la section conditionnelle

### Problème : Les accents ne s'affichent pas

**Cause** : Encodage du fichier

**Solution** :
1. Sauvegarde le document en .docx (pas .doc)
2. Vérifie que Word utilise l'encodage UTF-8

---

## 📞 SUPPORT

Si tu as des questions ou des problèmes, vérifie :
1. Le script d'analyse : `.\scripts\fix-template-conditional-sections.ps1`
2. Les logs n8n : `docker logs n8n-local --tail 100`
3. Le workflow dans n8n : http://localhost:5678

