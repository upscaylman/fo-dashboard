# Script de configuration Cloudflare Tunnel pour n8n
# Ce script facilite la configuration initiale de Cloudflare Tunnel

Write-Host "🌐 Configuration Cloudflare Tunnel pour n8n" -ForegroundColor Cyan
Write-Host ""

# Vérifier si cloudflared est installé
Write-Host "📦 Vérification de l'installation de cloudflared..." -ForegroundColor Yellow
try {
    $cloudflaredVersion = cloudflared --version 2>&1
    Write-Host "✅ cloudflared est installé : $cloudflaredVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ cloudflared n'est pas installé ou n'est pas dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour installer cloudflared :" -ForegroundColor Yellow
    Write-Host "  - Téléchargez depuis : https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/" -ForegroundColor Yellow
    Write-Host "  - Ou via Chocolatey : choco install cloudflared" -ForegroundColor Yellow
    Write-Host "  - Ou via Scoop : scoop install cloudflared" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Étape 1 : Authentification
Write-Host "🔐 Étape 1 : Authentification Cloudflare" -ForegroundColor Cyan
Write-Host "Cette commande va ouvrir votre navigateur pour vous connecter à Cloudflare." -ForegroundColor Yellow
$continue = Read-Host "Continuer ? (O/N)"
if ($continue -ne "O" -and $continue -ne "o") {
    Write-Host "Configuration annulée." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Exécution de : cloudflared tunnel login" -ForegroundColor Yellow
cloudflared tunnel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'authentification" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Authentification réussie" -ForegroundColor Green
Write-Host ""

# Étape 2 : Créer un tunnel
Write-Host "🚇 Étape 2 : Création du tunnel" -ForegroundColor Cyan
$tunnelName = Read-Host "Nom du tunnel (par défaut: n8n-tunnel)"
if ([string]::IsNullOrWhiteSpace($tunnelName)) {
    $tunnelName = "n8n-tunnel"
}

Write-Host ""
Write-Host "Exécution de : cloudflared tunnel create $tunnelName" -ForegroundColor Yellow
cloudflared tunnel create $tunnelName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la création du tunnel" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tunnel créé : $tunnelName" -ForegroundColor Green
Write-Host ""

# Étape 3 : Lister les tunnels pour obtenir l'UUID
Write-Host "📋 Étape 3 : Récupération de l'UUID du tunnel" -ForegroundColor Cyan
$tunnelList = cloudflared tunnel list
Write-Host $tunnelList

$tunnelId = Read-Host "Entrez l'UUID du tunnel (copiez depuis la liste ci-dessus)"
if ([string]::IsNullOrWhiteSpace($tunnelId)) {
    Write-Host "❌ UUID requis" -ForegroundColor Red
    exit 1
}

Write-Host "✅ UUID du tunnel : $tunnelId" -ForegroundColor Green
Write-Host ""

# Étape 4 : Configuration DNS
Write-Host "🌍 Étape 4 : Configuration DNS" -ForegroundColor Cyan
$hostname = Read-Host "Nom d'hôte complet (ex: n8n.votre-domaine.com)"
if ([string]::IsNullOrWhiteSpace($hostname)) {
    Write-Host "❌ Nom d'hôte requis" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Exécution de : cloudflared tunnel route dns $tunnelName $hostname" -ForegroundColor Yellow
cloudflared tunnel route dns $tunnelName $hostname
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erreur lors de la configuration DNS. Vous devrez peut-être le faire manuellement." -ForegroundColor Yellow
    Write-Host "   Allez sur dash.cloudflare.com et créez un CNAME :" -ForegroundColor Yellow
    Write-Host "   - Nom : $($hostname.Split('.')[0])" -ForegroundColor Yellow
    Write-Host "   - Cible : $tunnelId.cfargotunnel.com" -ForegroundColor Yellow
    Write-Host "   - Proxy : Activé (nuage orange)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Configuration DNS réussie" -ForegroundColor Green
}

Write-Host ""

# Étape 5 : Mise à jour du fichier de configuration
Write-Host "📝 Étape 5 : Mise à jour du fichier de configuration" -ForegroundColor Cyan
$configPath = Join-Path $PSScriptRoot "..\docker\cloudflared-config.yml"
$configPath = Resolve-Path $configPath -ErrorAction SilentlyContinue

if (-not $configPath) {
    Write-Host "❌ Fichier cloudflared-config.yml non trouvé dans docker/" -ForegroundColor Red
    exit 1
}

Write-Host "Mise à jour de : $configPath" -ForegroundColor Yellow

# Lire le fichier
$configContent = Get-Content $configPath -Raw

# Remplacer les placeholders
$configContent = $configContent -replace '\[UUID\]', $tunnelId
$configContent = $configContent -replace 'n8n\.votre-domaine\.com', $hostname

# Écrire le fichier
Set-Content -Path $configPath -Value $configContent -NoNewline

Write-Host "✅ Fichier de configuration mis à jour" -ForegroundColor Green
Write-Host ""

# Étape 6 : Copier les credentials dans Docker (si nécessaire)
Write-Host "🐳 Étape 6 : Configuration Docker (optionnel)" -ForegroundColor Cyan
Write-Host "Si vous utilisez Docker, vous devez copier les credentials dans le volume Docker." -ForegroundColor Yellow
Write-Host ""
Write-Host "Les credentials se trouvent généralement dans :" -ForegroundColor Yellow
$credentialsPath = "$env:USERPROFILE\.cloudflared\$tunnelId.json"
Write-Host "  $credentialsPath" -ForegroundColor Cyan

if (Test-Path $credentialsPath) {
    Write-Host "✅ Fichier de credentials trouvé" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour utiliser avec Docker, exécutez :" -ForegroundColor Yellow
    Write-Host "  docker volume create cloudflared_credentials" -ForegroundColor Cyan
    Write-Host "  docker run --rm -v cloudflared_credentials:/data -v `"$credentialsPath`":/source.json alpine sh -c `"cp /source.json /data/$tunnelId.json`"" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Fichier de credentials non trouvé à l'emplacement attendu" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Résumé de la configuration :" -ForegroundColor Cyan
Write-Host "  - Nom du tunnel : $tunnelName" -ForegroundColor White
Write-Host "  - UUID : $tunnelId" -ForegroundColor White
Write-Host "  - Hostname : $hostname" -ForegroundColor White
Write-Host "  - Fichier de config : $configPath" -ForegroundColor White
Write-Host ""

# Étape 7 : Instructions finales
Write-Host "🚀 Prochaines étapes :" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Modifiez votre fichier .env dans docker/ avec :" -ForegroundColor Yellow
Write-Host "   N8N_HOST=$hostname" -ForegroundColor Cyan
Write-Host "   N8N_PROTOCOL=https" -ForegroundColor Cyan
Write-Host "   N8N_EDITOR_BASE_URL=https://$hostname" -ForegroundColor Cyan
Write-Host "   WEBHOOK_URL=https://$hostname" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Si vous utilisez Docker, décommentez le service cloudflared dans docker-compose.prod.yml" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Démarrez le tunnel :" -ForegroundColor Yellow
Write-Host "   cloudflared tunnel --config docker/cloudflared-config.yml run $tunnelName" -ForegroundColor Cyan
Write-Host "   Ou avec Docker : docker compose -f docker-compose.prod.yml up -d cloudflared" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Testez l'accès : https://$hostname" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentation complète : docs/CONFIGURER_CLOUDFLARE_TUNNEL.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Configuration terminée !" -ForegroundColor Green

