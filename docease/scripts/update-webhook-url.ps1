# Script pour mettre a jour l'URL du webhook dans form.html
Write-Host "🔧 Mise a jour de l'URL du webhook dans form.html" -ForegroundColor Cyan
Write-Host ""

Write-Host "Dans n8n, copiez l'URL EXACTE du webhook (Test ou Production)" -ForegroundColor Yellow
Write-Host "Elle devrait ressembler a: http://localhost:5678/webhook-test/[URL]" -ForegroundColor Gray
Write-Host ""

$n8nUrl = Read-Host "Collez l'URL complete depuis n8n"

if ($n8nUrl) {
    # Extraire le path (tout apres webhook ou webhook-test)
    if ($n8nUrl -match "/webhook-test/(.+)") {
        $path = "/webhook-test/$($matches[1])"
    }
    elseif ($n8nUrl -match "/webhook/(.+)") {
        $path = "/webhook/$($matches[1])"
    }
    else {
        Write-Host "❌ URL non reconnue. Format attendu: http://localhost:5678/webhook-test/..." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Path extrait: $path" -ForegroundColor Cyan
    Write-Host "URL proxy: http://localhost:3000$path" -ForegroundColor Green
    Write-Host ""
    
    # Lire form.html
    $formPath = "templates/form/form.html"
    if (-not (Test-Path $formPath)) {
        Write-Host "❌ Fichier form.html non trouve" -ForegroundColor Red
        exit 1
    }
    
    $content = Get-Content $formPath -Raw -Encoding UTF8
    
    # Remplacer les URLs
    $proxyUrl = "http://localhost:3000$path"
    
    # Chercher et remplacer l'URL du formulaire principal
    $content = $content -replace 'http://localhost:3000/webhook-test/[^"]+', $proxyUrl
    $content = $content -replace 'http://localhost:3000/webhook/[^"]+', $proxyUrl
    
    # Pour le webhook de validation, utiliser le meme path pattern
    $validatePath = $path -replace "formulaire-doc", "validate-doc"
    $validateUrl = "http://localhost:3000$validatePath"
    $content = $content -replace 'http://localhost:3000/webhook-test/validate-doc[^"]*', $validateUrl
    $content = $content -replace 'http://localhost:3000/webhook/validate-doc[^"]*', $validateUrl
    
    # Sauvegarder
    Set-Content -Path $formPath -Value $content -Encoding UTF8 -NoNewline
    
    Write-Host "✅ form.html mis a jour avec:" -ForegroundColor Green
    Write-Host "   Formulaire: $proxyUrl" -ForegroundColor Cyan
    Write-Host "   Validation: $validateUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  Redemarrez le serveur de formulaire pour appliquer les changements" -ForegroundColor Yellow
}

