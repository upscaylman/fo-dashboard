<#
.SYNOPSIS
    Build des packages Microsoft Teams (.zip) pour SignEase, DocEase et TeamEase.

.DESCRIPTION
    Ce script compresse les fichiers manifest.json + color.png + outline.png 
    de chaque application en un package .zip prêt à être chargé dans Teams.

.EXAMPLE
    .\build-packages.ps1
    
    Génère les fichiers suivants dans microsoft365\dist\ :
    - signease-teams.zip
    - docease-teams.zip
    - teamease-teams.zip
#>

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$baseDir = Split-Path -Parent $scriptDir  # microsoft365/
$teamsDir = Join-Path $baseDir "teams"
$distDir = Join-Path $baseDir "dist"

# Créer le dossier dist
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

$apps = @("signease", "docease", "teamease")
$results = @()

foreach ($app in $apps) {
    $appDir = Join-Path $teamsDir $app
    $zipName = "$app-teams.zip"
    $zipPath = Join-Path $distDir $zipName
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Building: $app" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    # Vérifier les fichiers requis
    $requiredFiles = @("manifest.json", "color.png", "outline.png")
    $allPresent = $true
    foreach ($file in $requiredFiles) {
        $filePath = Join-Path $appDir $file
        if (-not (Test-Path $filePath)) {
            Write-Host "  ERREUR: Fichier manquant: $file" -ForegroundColor Red
            $allPresent = $false
        } else {
            $size = (Get-Item $filePath).Length
            Write-Host "  OK: $file ($size bytes)" -ForegroundColor Green
        }
    }
    
    if (-not $allPresent) {
        Write-Host "  SKIP: Package $app non créé (fichiers manquants)" -ForegroundColor Yellow
        $results += [PSCustomObject]@{ App = $app; Status = "ERREUR"; Path = "" }
        continue
    }
    
    # Supprimer l'ancien zip s'il existe
    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }
    
    # Créer le zip
    $filesToZip = $requiredFiles | ForEach-Object { Join-Path $appDir $_ }
    Compress-Archive -Path $filesToZip -DestinationPath $zipPath -CompressionLevel Optimal
    
    $zipSize = (Get-Item $zipPath).Length
    Write-Host "  Package créé: $zipName ($zipSize bytes)" -ForegroundColor Green
    $results += [PSCustomObject]@{ App = $app; Status = "OK"; Path = $zipPath }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Résumé" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Les packages sont dans:" -ForegroundColor Yellow
Write-Host "  $distDir" -ForegroundColor White
Write-Host ""
Write-Host "Pour installer dans Teams:" -ForegroundColor Yellow
Write-Host "  1. Ouvrir Microsoft Teams" -ForegroundColor White
Write-Host "  2. Apps > Gérer vos apps > Charger une application" -ForegroundColor White
Write-Host "  3. Sélectionner le .zip correspondant" -ForegroundColor White
Write-Host ""
