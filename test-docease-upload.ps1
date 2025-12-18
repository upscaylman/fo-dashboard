# ================================================================
# Script de Test : Upload de Document DocEase vers Supabase Storage
# ================================================================
# Ce script permet de tester l'upload manuel d'un fichier Word/PDF
# dans le bucket Supabase 'docease-files' et l'insertion dans la table
# ================================================================

Write-Host "=== TEST UPLOAD DOCEASE → SUPABASE STORAGE ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$supabaseUrl = "https://geljwonckfmdkaywaxly.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbGp3b25ja2ZtZGtheXdheGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTM3MDAsImV4cCI6MjA4MTQyOTcwMH0.K9-DyDP1sbKo59VY8iMwSgCukLk0Cm3OTBCIkipxzUQ"

# Demander le fichier à uploader
Write-Host "📁 Sélectionnez un fichier à uploader (Word, PDF)..." -ForegroundColor Yellow
Add-Type -AssemblyName System.Windows.Forms
$fileBrowser = New-Object System.Windows.Forms.OpenFileDialog
$fileBrowser.Filter = "Documents (*.docx;*.pdf)|*.docx;*.pdf|All files (*.*)|*.*"
$fileBrowser.Title = "Choisir un fichier DocEase"

if ($fileBrowser.ShowDialog() -eq "OK") {
    $filePath = $fileBrowser.FileName
    $fileName = Split-Path $filePath -Leaf
    Write-Host "   ✅ Fichier sélectionné: $fileName" -ForegroundColor Green
} else {
    Write-Host "   ❌ Aucun fichier sélectionné. Arrêt." -ForegroundColor Red
    exit
}

Write-Host ""

# Générer un nom de fichier unique
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$uniqueFileName = "${timestamp}_${fileName}"

Write-Host "1️⃣ Upload du fichier vers Supabase Storage..." -ForegroundColor Yellow
Write-Host "   📦 Bucket: docease-files" -ForegroundColor Cyan
Write-Host "   📄 Nom: $uniqueFileName" -ForegroundColor Cyan

try {
    # Lire le fichier en tant que bytes
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    
    # Upload vers Supabase Storage
    $uploadResponse = Invoke-RestMethod -Uri "$supabaseUrl/storage/v1/object/docease-files/$uniqueFileName" -Method Post -Headers @{
        "Authorization" = "Bearer $anonKey"
        "Content-Type" = "application/octet-stream"
    } -Body $fileBytes
    
    Write-Host "   ✅ Fichier uploadé avec succès !" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ Erreur lors de l'upload: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Vérifications à faire :" -ForegroundColor Yellow
    Write-Host "   1. Le bucket 'docease-files' existe-t-il dans Supabase ?" -ForegroundColor White
    Write-Host "   2. Avez-vous exécuté MIGRATION_DOCEASE_FILE_URL.sql ?" -ForegroundColor White
    Write-Host "   3. Les policies permettent-elles l'upload ?" -ForegroundColor White
    exit 1
}

Write-Host ""

# Générer l'URL publique
$publicUrl = "$supabaseUrl/storage/v1/object/public/docease-files/$uniqueFileName"
Write-Host "2️⃣ URL publique générée:" -ForegroundColor Yellow
Write-Host "   🔗 $publicUrl" -ForegroundColor Cyan

Write-Host ""

# Demander les métadonnées
Write-Host "3️⃣ Métadonnées du document:" -ForegroundColor Yellow
$userEmail = Read-Host "   Email utilisateur (ex: user@exemple.com)"
$documentType = Read-Host "   Type de document (ex: designation, courrier, plainte)"

# Détecter le format
$extension = [System.IO.Path]::GetExtension($fileName).TrimStart('.').ToLower()
$format = if ($extension -eq "pdf") { "pdf" } else { "docx" }

Write-Host ""
Write-Host "4️⃣ Insertion dans docease_documents..." -ForegroundColor Yellow

try {
    # Préparer les données à insérer
    $documentData = @{
        user_email = $userEmail
        document_type = $documentType
        title = $fileName
        metadata = @{
            format = $format
            uploaded_via_script = $true
            original_filename = $fileName
        } | ConvertTo-Json -Compress
        file_url = $publicUrl
    } | ConvertTo-Json -Depth 3
    
    # Insérer dans la base de données
    $insertResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/docease_documents" -Method Post -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $anonKey"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    } -Body $documentData
    
    Write-Host "   ✅ Document inséré avec succès !" -ForegroundColor Green
    Write-Host "   📊 ID du document: $($insertResponse.id)" -ForegroundColor Cyan
    Write-Host "   📄 Titre: $($insertResponse.title)" -ForegroundColor Cyan
    Write-Host "   🔗 URL: $($insertResponse.file_url)" -ForegroundColor Cyan
    
} catch {
    Write-Host "   ❌ Erreur lors de l'insertion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Vérifications à faire :" -ForegroundColor Yellow
    Write-Host "   1. La colonne 'file_url' existe-t-elle dans docease_documents ?" -ForegroundColor White
    Write-Host "   2. Les permissions RLS permettent-elles l'insertion ?" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "=== TEST TERMINÉ AVEC SUCCÈS ! ===" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. Ouvrez le dashboard FO Métaux (http://localhost:4081)" -ForegroundColor White
Write-Host "   2. Allez dans l'onglet 'DocEase'" -ForegroundColor White
Write-Host "   3. Trouvez votre document dans la liste" -ForegroundColor White
Write-Host "   4. Cliquez sur le bouton 📥 Download" -ForegroundColor White
Write-Host "   5. Le fichier devrait se télécharger directement !" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Vous pouvez aussi tester l'URL directement dans le navigateur :" -ForegroundColor Yellow
Write-Host "   $publicUrl" -ForegroundColor Cyan
Write-Host ""
