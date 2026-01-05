# Script pour vérifier les balises dans le template Word
Write-Host "`n🔍 Vérification des balises Docxtemplater dans le template Word`n" -ForegroundColor Cyan

$templatePath = "templates\word\template_principal.docx"

if (-not (Test-Path $templatePath)) {
    Write-Host "❌ Template non trouvé: $templatePath" -ForegroundColor Red
    exit 1
}

# Créer un dossier temporaire
$tempDir = "temp_template_check"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Extraire le fichier .docx (c'est un ZIP)
Write-Host "📦 Extraction du template..." -ForegroundColor Yellow
Expand-Archive -Path $templatePath -DestinationPath $tempDir -Force

# Lire le document.xml
$documentXml = Get-Content "$tempDir\word\document.xml" -Raw -Encoding UTF8

# Extraire toutes les balises {#...} et {/...}
Write-Host "`n📋 Balises trouvées dans le template:`n" -ForegroundColor Green

$openTags = [regex]::Matches($documentXml, '\{#([^\}]+)\}')
$closeTags = [regex]::Matches($documentXml, '\{/([^\}]*)\}')

Write-Host "🔓 Balises d'ouverture ({#...}):" -ForegroundColor Cyan
$openTagsList = @()
foreach ($match in $openTags) {
    $tag = $match.Groups[1].Value
    $openTagsList += $tag
    Write-Host "   - {#$tag}" -ForegroundColor White
}

Write-Host "`n🔒 Balises de fermeture ({/...}):" -ForegroundColor Cyan
$closeTagsList = @()
foreach ($match in $closeTags) {
    $tag = $match.Groups[1].Value
    $closeTagsList += $tag
    Write-Host "   - {/$tag}" -ForegroundColor White
}

# Vérifier la correspondance
Write-Host "`n✅ Vérification de la correspondance:`n" -ForegroundColor Yellow

$errors = @()

# Vérifier que chaque ouverture a une fermeture
foreach ($openTag in $openTagsList) {
    if ($openTag -notin $closeTagsList) {
        $errors += "Balise non fermée: #$openTag"
    }
}

# Vérifier que chaque fermeture a une ouverture
foreach ($closeTag in $closeTagsList) {
    if ($closeTag -notin $openTagsList) {
        $errors += "Balise non ouverte: /$closeTag"
    }
}

# Vérifier l'ordre (simple)
if ($openTagsList.Count -ne $closeTagsList.Count) {
    $errors += "❌ Nombre de balises d'ouverture ($($openTagsList.Count)) ≠ fermeture ($($closeTagsList.Count))"
}

if ($errors.Count -eq 0) {
    Write-Host "✅ Toutes les balises sont correctement appariées!" -ForegroundColor Green
} else {
    Write-Host "❌ Erreurs détectées:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
}

# Afficher un extrait du XML autour des balises
Write-Host "`n📄 Contexte des balises dans le XML:`n" -ForegroundColor Cyan

$allMatches = [regex]::Matches($documentXml, '\{[#/][^\}]*\}')
foreach ($match in $allMatches) {
    $start = [Math]::Max(0, $match.Index - 50)
    $length = [Math]::Min(150, $documentXml.Length - $start)
    $context = $documentXml.Substring($start, $length)
    Write-Host "..." -NoNewline -ForegroundColor Gray
    Write-Host $context -ForegroundColor White
    Write-Host ""
}

# Nettoyer
Remove-Item $tempDir -Recurse -Force

Write-Host "`n✅ Vérification terminée`n" -ForegroundColor Green

