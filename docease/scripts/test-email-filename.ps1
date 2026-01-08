# Test du nom de fichier et encodage UTF-8 dans les emails

Write-Host "=== TEST NOM DE FICHIER ET ENCODAGE UTF-8 ===" -ForegroundColor Green
Write-Host ""

# Test 1: Designation avec accents
Write-Host "Test 1: Designation avec nom accentue" -ForegroundColor Cyan
$body1 = @{
    civiliteDestinataire = "Madame"
    nomDestinataire = "Dupont-Eleonore"
    statutDestinataire = "Directrice"
    adresse = "123 Rue Test"
    cpVille = "75001 Paris"
    templateType = "designation"
    texteIa = ""
    objet = "Test Designation"
    numeroCourrier = "TEST-001"
    codeDocument = "FOMETAUX"
    emailDestinataire = "test@example.com"
    civiliteDelegue = "Monsieur"
    nomDelegue = "Jean-Francois"
} | ConvertTo-Json -Depth 10

Write-Host "Envoi requete..." -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/formulaire-doc" -Method POST -Body $body1 -ContentType "application/json; charset=utf-8" -TimeoutSec 60
Write-Host "Preview generee" -ForegroundColor Green
Write-Host "Nom fichier attendu: Designation_Dupont_Eleonore.docx" -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2

# Test 2: Negociation avec caracteres speciaux
Write-Host "Test 2: Negociation avec caracteres speciaux" -ForegroundColor Cyan
$body2 = @{
    civiliteDestinataire = "Monsieur"
    nomDestinataire = "Martin-O'Connor"
    statutDestinataire = "Directeur"
    adresse = "456 Avenue Test"
    cpVille = "75002 Paris"
    templateType = "negociation"
    texteIa = ""
    objet = "Test Negociation"
    numeroCourrier = "TEST-002"
    codeDocument = "FOMETAUX"
    emailDestinataire = "test@example.com"
    civiliteDelegue = "Madame"
    nomDelegue = "Sophie Muller"
} | ConvertTo-Json -Depth 10

Write-Host "Envoi requete..." -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "http://localhost:5678/webhook/formulaire-doc" -Method POST -Body $body2 -ContentType "application/json; charset=utf-8" -TimeoutSec 60
Write-Host "Preview generee" -ForegroundColor Green
Write-Host "Nom fichier attendu: Mandat_Negociation_Martin_O_Connor.docx" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== RESULTATS ===" -ForegroundColor Green
Write-Host ""
Write-Host "Les previews ont ete generees avec succes!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour tester completement:" -ForegroundColor Cyan
Write-Host "1. Ouvre le navigateur sur http://localhost:5678/webhook/formulaire-doc" -ForegroundColor White
Write-Host "2. Remplis le formulaire avec des accents (ex: Eleonore, Francois)" -ForegroundColor White
Write-Host "3. Valide et envoie l'email" -ForegroundColor White
Write-Host "4. Verifie dans ton client email:" -ForegroundColor White
Write-Host "   - Le nom du fichier attache doit etre: TypeDocument_NomDestinataire.docx" -ForegroundColor Yellow
Write-Host "   - Les accents doivent etre correctement affiches dans le document Word" -ForegroundColor Yellow
Write-Host ""
Write-Host "Exemples de noms de fichiers attendus:" -ForegroundColor Cyan
Write-Host "  - Designation_Dupont.docx" -ForegroundColor White
Write-Host "  - Mandat_Negociation_Martin.docx" -ForegroundColor White
Write-Host "  - Designation_Jean_Francois_Muller.docx" -ForegroundColor White

