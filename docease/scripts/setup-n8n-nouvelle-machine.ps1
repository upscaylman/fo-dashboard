# Script pour configurer n8n sur une nouvelle machine
# Usage: .\scripts\setup-n8n-nouvelle-machine.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONFIGURATION N8N SUR NOUVELLE MACHINE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Docker est en cours d'exécution
Write-Host "1. Verification de Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "   OK - Docker est en cours d'execution" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - Docker n'est pas en cours d'execution" -ForegroundColor Red
    Write-Host "   Demarrez Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Vérifier que n8n est accessible
Write-Host "2. Verification de n8n..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5678" -Method GET -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "   OK - n8n est accessible" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR - n8n n'est pas accessible" -ForegroundColor Red
    Write-Host "   Demarrez n8n avec: cd docker && docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Instructions
Write-Host "========================================" -ForegroundColor Green
Write-Host "ETAPES POUR CONFIGURER N8N" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "ETAPE 1: Faire le setup initial dans n8n" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvrez n8n dans votre navigateur:" -ForegroundColor White
Write-Host "   http://localhost:5678" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Remplissez le formulaire de setup:" -ForegroundColor White
Write-Host "   - Email: Utilisez le meme email que sur l'autre machine (ou un autre)" -ForegroundColor Gray
Write-Host "   - Mot de passe: Creez un mot de passe (peut etre different)" -ForegroundColor Gray
Write-Host "   - Prenom: Votre prenom" -ForegroundColor Gray
Write-Host "   - Nom: Votre nom" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Cliquez sur 'Create account'" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur Entree une fois le setup termine..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "ETAPE 2: Exporter les workflows depuis l'autre machine" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sur l'autre ordinateur (celui qui fonctionne):" -ForegroundColor White
Write-Host ""
Write-Host "1. Ouvrez n8n: http://localhost:5678" -ForegroundColor Gray
Write-Host "2. Allez dans 'Workflows'" -ForegroundColor Gray
Write-Host "3. Pour chaque workflow:" -ForegroundColor Gray
Write-Host "   - Cliquez sur les 3 points (...) a droite du workflow" -ForegroundColor Gray
Write-Host "   - Selectionnez 'Download' ou 'Export'" -ForegroundColor Gray
Write-Host "   - Sauvegardez le fichier JSON" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Transferez les fichiers JSON sur cette machine" -ForegroundColor Gray
Write-Host "   (USB, email, cloud, etc.)" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur Entree une fois les fichiers transferes..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "ETAPE 3: Importer les workflows sur cette machine" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sur cette machine:" -ForegroundColor White
Write-Host ""
Write-Host "1. Dans n8n (http://localhost:5678):" -ForegroundColor Gray
Write-Host "   - Allez dans 'Workflows'" -ForegroundColor Gray
Write-Host "   - Cliquez sur 'Import from File'" -ForegroundColor Gray
Write-Host "   - Selectionnez chaque fichier JSON exporte" -ForegroundColor Gray
Write-Host "   - Cliquez sur 'Import'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Pour chaque workflow importe:" -ForegroundColor Gray
Write-Host "   - Ouvrez le workflow" -ForegroundColor Gray
Write-Host "   - Cliquez sur le toggle en haut a droite pour l'activer (VERT)" -ForegroundColor Gray
Write-Host "   - Cliquez sur le noeud Webhook" -ForegroundColor Gray
Write-Host "   - Notez l'ID du webhook affiche" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Si l'ID du webhook est different, mettez a jour:" -ForegroundColor Yellow
Write-Host "   templates/form/index.html (lignes 993-994)" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur Entree une fois les workflows importes..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "ETAPE 4: Reconfigurer les credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour chaque noeud avec un cadenas (credentials):" -ForegroundColor White
Write-Host ""
Write-Host "1. Cliquez sur le noeud avec le cadenas" -ForegroundColor Gray
Write-Host "2. Cliquez sur 'Credential to connect'" -ForegroundColor Gray
Write-Host "3. Selectionnez ou creez le credential:" -ForegroundColor Gray
Write-Host "   - Microsoft Outlook (pour l'envoi d'emails)" -ForegroundColor Gray
Write-Host "   - SMTP (pour les emails de validation)" -ForegroundColor Gray
Write-Host ""
Write-Host "Appuyez sur Entree une fois les credentials reconfigures..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "CONFIGURATION TERMINEE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Vous pouvez maintenant:" -ForegroundColor White
Write-Host "1. Tester le formulaire: http://localhost:3000" -ForegroundColor Gray
Write-Host "2. Verifier les webhooks avec: .\scripts\check-webhook.ps1" -ForegroundColor Gray
Write-Host ""

# Ouvrir n8n dans le navigateur
Write-Host "Ouverture de n8n dans le navigateur..." -ForegroundColor Cyan
Start-Process "http://localhost:5678"

