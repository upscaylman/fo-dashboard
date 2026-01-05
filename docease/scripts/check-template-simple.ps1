# Script simple pour vérifier les balises dans le template Word
Write-Host "`n🔍 Vérification des balises Docxtemplater`n" -ForegroundColor Cyan

$templatePath = "templates\word\template_principal.docx"

if (-not (Test-Path $templatePath)) {
    Write-Host "Template non trouvé" -ForegroundColor Red
    exit 1
}

# Créer un dossier temporaire
$tempDir = "temp_check"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Extraire le fichier .docx
Write-Host "Extraction du template..." -ForegroundColor Yellow
Expand-Archive -Path $templatePath -DestinationPath $tempDir -Force

# Lire le document.xml
$documentXml = Get-Content "$tempDir\word\document.xml" -Raw -Encoding UTF8

# Rechercher les balises
Write-Host "`nBalises trouvées:`n" -ForegroundColor Green

# Balises d'ouverture
$pattern1 = '\{#[^\}]+\}'
$openMatches = [regex]::Matches($documentXml, $pattern1)
Write-Host "Balises d'ouverture:" -ForegroundColor Cyan
foreach ($m in $openMatches) {
    Write-Host "  $($m.Value)" -ForegroundColor White
}

# Balises de fermeture
$pattern2 = '\{/[^\}]*\}'
$closeMatches = [regex]::Matches($documentXml, $pattern2)
Write-Host "`nBalises de fermeture:" -ForegroundColor Cyan
foreach ($m in $closeMatches) {
    Write-Host "  $($m.Value)" -ForegroundColor White
}

Write-Host "`nNombre d'ouvertures: $($openMatches.Count)" -ForegroundColor Yellow
Write-Host "Nombre de fermetures: $($closeMatches.Count)" -ForegroundColor Yellow

# Nettoyer
Remove-Item $tempDir -Recurse -Force

Write-Host "`nTerminé`n" -ForegroundColor Green

