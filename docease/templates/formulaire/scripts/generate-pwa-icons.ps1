# Script PowerShell pour générer les icônes PWA à partir du logo FO Métaux
# Nécessite ImageMagick : winget install ImageMagick.ImageMagick

$sourceImage = "public\assets\img\docEase_HD.png"
$outputDir = "public\assets\img"

# Tailles d'icônes requises pour PWA
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

Write-Host "🎨 Génération des icônes PWA..." -ForegroundColor Cyan

# Vérifier si ImageMagick est installé
$magick = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magick) {
    Write-Host "❌ ImageMagick n'est pas installé." -ForegroundColor Red
    Write-Host "   Installez-le avec: winget install ImageMagick.ImageMagick" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Alternative manuelle:" -ForegroundColor Cyan
    Write-Host "   1. Allez sur https://www.iloveimg.com/resize-image" -ForegroundColor White
    Write-Host "   2. Uploadez $sourceImage" -ForegroundColor White
    Write-Host "   3. Redimensionnez aux tailles: $($sizes -join ', ')px" -ForegroundColor White
    Write-Host "   4. Sauvegardez en tant que icon-{taille}x{taille}.png" -ForegroundColor White
    exit 1
}

# Vérifier si l'image source existe
if (-not (Test-Path $sourceImage)) {
    Write-Host "❌ Image source non trouvée: $sourceImage" -ForegroundColor Red
    exit 1
}

# Générer chaque taille
foreach ($size in $sizes) {
    $outputFile = "$outputDir\icon-${size}x${size}.png"
    Write-Host "  ✅ Génération $outputFile..." -ForegroundColor Green
    
    # Utiliser magick pour redimensionner avec un fond blanc et forme carrée
    magick $sourceImage -resize ${size}x${size} -gravity center -background white -extent ${size}x${size} $outputFile
}

Write-Host ""
Write-Host "🎉 Icônes PWA générées avec succès!" -ForegroundColor Green
Write-Host "📱 DocEase est maintenant prêt pour être installé comme PWA." -ForegroundColor Cyan
