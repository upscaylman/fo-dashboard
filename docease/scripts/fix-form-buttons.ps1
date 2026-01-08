# Script pour corriger les boutons du formulaire

$formPath = "templates/form/form.html"

Write-Host "Correction des boutons du formulaire..." -ForegroundColor Cyan

# Lire le fichier
$content = Get-Content $formPath -Raw -Encoding UTF8

# Correction 1: Bouton "Télécharger le document" - doit utiliser /webhook/formulaire-doc
$oldDownloadCode = @'
        // Appeler le webhook validate-doc qui utilise "Générer Word Final"
        // On envoie wordfile vide pour que le nœud génère le Word
        data.wordfile = ""

        const response = await fetch("http://localhost:3000/webhook/validate-doc", {
'@

$newDownloadCode = @'
        // Appeler le webhook formulaire-doc qui génère le Word et le retourne
        const response = await fetch("http://localhost:3000/webhook/formulaire-doc", {
'@

$content = $content -replace [regex]::Escape($oldDownloadCode), $newDownloadCode

# Correction 2: Gérer la réponse JSON au lieu de blob
$oldResponseCode = @'
        // La réponse est le fichier Word en binaire
        const blob = await response.blob()
        console.log('✅ Word reçu:', blob.size, 'octets')

        // Convertir le blob en base64 pour le stocker
        const reader = new FileReader()
        reader.onloadend = () => {
          generatedWordBase64 = reader.result.split(',')[1]
        }
        reader.readAsDataURL(blob)

        // Télécharger le Word
        const url = URL.createObjectURL(blob)
'@

$newResponseCode = @'
        // La réponse contient le Word en base64 dans un JSON
        const result = await response.json()
        console.log('Reponse recue:', result)

        if (!result.success || !result.data) {
          throw new Error('Fichier Word non trouve dans la reponse')
        }

        // Stocker le base64 pour l'envoi ultérieur
        generatedWordBase64 = result.data

        // Convertir base64 en blob pour le téléchargement
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })

        console.log('Word converti en blob:', blob.size, 'octets')

        // Télécharger le Word
        const url = URL.createObjectURL(blob)
'@

$content = $content -replace [regex]::Escape($oldResponseCode), $newResponseCode

# Correction 3: Simplifier le bouton "Générer et envoyer"
$oldSendCode = @'
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
          console.log('📤 Génération du Word avant envoi:', data)

          // Pas besoin de générer séparément, validate-doc le fera
          currentFormData = data
        }

        // Envoyer l'email avec le Word via validate-doc
        console.log('📧 Envoi email via validate-doc')

        const sendData = {
          ...currentFormData,
          wordfile: generatedWordBase64 || ""
        }

        const sendResponse = await fetch("http://localhost:3000/webhook/validate-doc", {
'@

$newSendCode = @'
        // Collecter les données du formulaire
        const data = {
          templateType: templateSelect.value,
          emailDestinataire: document.getElementById("destinataires").value
        }

        const allInputs = dynamicFields.querySelectorAll('input, select, textarea')
        allInputs.forEach(input => {
          data[input.id] = input.value || ''
        })

        console.log('Envoi email via validate-doc avec Word:', generatedWordBase64 ? 'Deja genere' : 'A generer')

        // Si le Word a déjà été généré, l'envoyer, sinon validate-doc le générera
        data.wordfile = generatedWordBase64 || ""

        const sendResponse = await fetch("http://localhost:3000/webhook/validate-doc", {
'@

$content = $content -replace [regex]::Escape($oldSendCode), $newSendCode

# Correction 4: Améliorer la gestion d'erreur
$content = $content -replace 'throw new Error\(`Erreur \$\{sendResponse\.status\}`\)', 'const errorText = await sendResponse.text(); throw new Error(`Erreur ${sendResponse.status}: ${errorText}`)'

# Sauvegarder
$content | Out-File $formPath -Encoding UTF8 -NoNewline

Write-Host "Corrections appliquees avec succes !" -ForegroundColor Green
Write-Host ""
Write-Host "Resume des corrections:" -ForegroundColor Yellow
Write-Host "1. Bouton 'Telecharger' utilise maintenant /webhook/formulaire-doc" -ForegroundColor White
Write-Host "2. Gestion correcte de la reponse JSON avec base64" -ForegroundColor White
Write-Host "3. Bouton 'Generer et envoyer' simplifie et utilise /webhook/validate-doc" -ForegroundColor White
Write-Host "4. Meilleure gestion des erreurs" -ForegroundColor White

