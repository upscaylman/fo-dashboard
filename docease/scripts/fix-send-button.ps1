# Script pour corriger le bouton "Générer et envoyer"

$formPath = "templates/form/form.html"

Write-Host "Correction du bouton 'Generer et envoyer'..." -ForegroundColor Cyan

# Lire le fichier
$content = Get-Content $formPath -Raw -Encoding UTF8

# Trouver et remplacer la fonction du bouton sendEmailBtn
# On cherche depuis "document.getElementById("sendEmailBtn")" jusqu'à la fin de la fonction

$oldCode = @'
    // Bouton "Générer et envoyer" - envoie l'email avec le Word en pièce jointe
    document.getElementById("sendEmailBtn").addEventListener("click", async () => {
      const btn = document.getElementById("sendEmailBtn")
      const originalHTML = btn.innerHTML

      try {
        btn.disabled = true
        btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Envoi en cours...'

        // Si le Word n'a pas été généré, le générer d'abord
        if (!generatedWordBase64) {
          const data = {
            templateType: templateSelect.value,
            emailDestinataire: document.getElementById("destinataires").value
          }

          const allInputs = dynamicFields.querySelectorAll('input, select, textarea')
          allInputs.forEach(input => {
            data[input.id] = input.value || ''
          })

          currentFormData = data
'@

$newCode = @'
    // Bouton "Générer et envoyer" - génère le Word puis envoie l'email
    document.getElementById("sendEmailBtn").addEventListener("click", async () => {
      const btn = document.getElementById("sendEmailBtn")
      const originalHTML = btn.innerHTML

      try {
        btn.disabled = true
        btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Generation en cours...'

        // Collecter les données du formulaire
        const data = {
          templateType: templateSelect.value,
          emailDestinataire: document.getElementById("destinataires").value
        }

        const allInputs = dynamicFields.querySelectorAll('input, select, textarea')
        allInputs.forEach(input => {
          data[input.id] = input.value || ''
        })

        // ETAPE 1: Générer le Word si pas déjà fait
        if (!generatedWordBase64) {
          console.log('Generation du Word avant envoi...')
          
          const genResponse = await fetch("http://localhost:3000/webhook/formulaire-doc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          })

          if (!genResponse.ok) {
            throw new Error(`Erreur generation: ${genResponse.status}`)
          }

          const genResult = await genResponse.json()
          if (!genResult.success || !genResult.data) {
            throw new Error('Fichier Word non genere')
          }

          generatedWordBase64 = genResult.data
          console.log('Word genere avec succes')
        }

        // ETAPE 2: Envoyer l'email avec le Word
        btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Envoi en cours...'
        console.log('Envoi email via validate-doc...')

        data.wordfile = generatedWordBase64
'@

if ($content -match [regex]::Escape($oldCode)) {
    $content = $content -replace [regex]::Escape($oldCode), $newCode
    Write-Host "Code remplace avec succes" -ForegroundColor Green
} else {
    Write-Host "Pattern non trouve, utilisation d'une approche alternative..." -ForegroundColor Yellow
    
    # Approche alternative : remplacer juste la partie critique
    $pattern = 'if \(!generatedWordBase64\) \{[^}]+currentFormData = data'
    $replacement = @'
// ETAPE 1: Generer le Word si pas deja fait
        if (!generatedWordBase64) {
          console.log('Generation du Word avant envoi...')
          
          const genResponse = await fetch("http://localhost:3000/webhook/formulaire-doc", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
          })

          if (!genResponse.ok) {
            throw new Error(`Erreur generation: ${genResponse.status}`)
          }

          const genResult = await genResponse.json()
          if (!genResult.success || !genResult.data) {
            throw new Error('Fichier Word non genere')
          }

          generatedWordBase64 = genResult.data
          console.log('Word genere avec succes')
        }

        // ETAPE 2: Envoyer l'email avec le Word
        btn.innerHTML = '<span class="material-icons animate-spin">sync</span> Envoi en cours...'
        console.log('Envoi email via validate-doc...')

        data.wordfile = generatedWordBase64
'@
    
    $content = $content -replace $pattern, $replacement
}

# Supprimer les lignes inutiles
$content = $content -replace "// Pas besoin de générer séparément, validate-doc le fera\s+currentFormData = data\s+}\s+// Envoyer l'email avec le Word via validate-doc[^\n]+\s+const sendData = \{[^}]+\}", ""

# Sauvegarder
$content | Out-File $formPath -Encoding UTF8 -NoNewline

Write-Host "Correction appliquee !" -ForegroundColor Green
Write-Host ""
Write-Host "Le bouton 'Generer et envoyer' va maintenant:" -ForegroundColor Yellow
Write-Host "1. Generer le Word via /webhook/formulaire-doc si necessaire" -ForegroundColor White
Write-Host "2. Envoyer l'email via /webhook/validate-doc avec le Word en base64" -ForegroundColor White

