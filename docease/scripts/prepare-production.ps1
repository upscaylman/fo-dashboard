# Script de préparation pour la production
# Vérifie et prépare l'environnement pour le déploiement

param(
    [string]$Domain = "",
    [switch]$SkipChecks = $false
)

Write-Host "🚀 Préparation pour la production..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "docker\docker-compose-prod.yml")) {
    Write-Host "❌ Erreur : Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

$Issues = @()
$Warnings = @()

# 1. Vérifier Docker
Write-Host "📦 Vérification de Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✅ Docker installé : $dockerVersion" -ForegroundColor Green
} catch {
    $Issues += "❌ Docker n'est pas installé ou non accessible"
}

# 2. Vérifier le fichier .env
Write-Host "`n📝 Vérification de la configuration..." -ForegroundColor Yellow
$envFile = "docker\.env"
$envExample = "docker\.env.production.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Write-Host "   ⚠️  Fichier .env non trouvé, copie depuis .env.production.example..." -ForegroundColor Yellow
        Copy-Item $envExample $envFile
        Write-Host "   ✅ Fichier .env créé. MODIFIEZ-LE AVANT DE CONTINUER !" -ForegroundColor Red
        $Issues += "❌ Fichier .env créé mais non configuré"
    } else {
        $Issues += "❌ Fichier .env non trouvé et .env.production.example n'existe pas"
    }
} else {
    Write-Host "   ✅ Fichier .env trouvé" -ForegroundColor Green
    
    # Vérifier les valeurs par défaut
    $envContent = Get-Content $envFile -Raw
    
    if ($envContent -match "votre-domaine\.com") {
        $Issues += "❌ Domaine non configuré (toujours 'votre-domaine.com')"
    }
    
    if ($envContent -match "GENERER_UN_MOT_DE_PASSE") {
        $Issues += "❌ Mots de passe non configurés (toujours les valeurs par défaut)"
    }
    
    if ($envContent -match "N8N_LOG_LEVEL=debug") {
        $Warnings += "⚠️  Logs en mode debug (devrait être 'info' en production)"
    }
    
    if ($envContent -match "DB_TYPE=sqlite") {
        $Issues += "❌ SQLite utilisé (devrait être PostgreSQL en production)"
    }
    
    if ($envContent -match "N8N_BASIC_AUTH_ACTIVE=false") {
        $Issues += "❌ Authentification basique désactivée"
    }
    
    if ($envContent -match "CORS_ALLOW_ORIGIN=\*") {
        $Warnings += "⚠️  CORS autorise toutes les origines (*) - à restreindre en production"
    }
}

# 3. Vérifier les templates
Write-Host "`n📄 Vérification des templates..." -ForegroundColor Yellow
$templatesDir = "templates\word"
if (Test-Path $templatesDir) {
    $templates = Get-ChildItem "$templatesDir\*.docx"
    if ($templates.Count -eq 0) {
        $Warnings += "⚠️  Aucun template Word trouvé dans templates/word/"
    } else {
        Write-Host "   ✅ $($templates.Count) template(s) trouvé(s)" -ForegroundColor Green
    }
} else {
    $Warnings += "⚠️  Dossier templates/word/ non trouvé"
}

# 4. Vérifier le workflow
Write-Host "`n🔄 Vérification du workflow..." -ForegroundColor Yellow
$workflowFile = "workflows\dev\gpt_generator.json"
if (Test-Path $workflowFile) {
    $workflowContent = Get-Content $workflowFile -Raw
    
    if ($workflowContent -match '"allowedOrigins":\s*"\*"') {
        $Warnings += "⚠️  Workflow utilise CORS '*' - à restreindre"
    }
    
    Write-Host "   ✅ Workflow trouvé" -ForegroundColor Green
} else {
    $Issues += "❌ Workflow gpt_generator.json non trouvé"
}

# 5. Vérifier Caddyfile
Write-Host "`n🌐 Vérification de Caddy..." -ForegroundColor Yellow
$caddyfile = "docker\Caddyfile"
if (Test-Path $caddyfile) {
    $caddyContent = Get-Content $caddyfile -Raw
    
    if ($caddyContent -match "votre-domaine\.com") {
        $Warnings += "⚠️  Caddyfile contient toujours 'votre-domaine.com' - à modifier"
    }
    
    Write-Host "   ✅ Caddyfile trouvé" -ForegroundColor Green
} else {
    $Warnings += "⚠️  Caddyfile non trouvé (HTTPS ne sera pas automatique)"
}

# 6. Vérifier .gitignore
Write-Host "`n🔒 Vérification de .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -notmatch "\.env") {
        $Warnings += "⚠️  .env n'est pas dans .gitignore"
    } else {
        Write-Host "   ✅ .env dans .gitignore" -ForegroundColor Green
    }
} else {
    $Warnings += "⚠️  .gitignore non trouvé"
}

# Résumé
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

if ($Issues.Count -eq 0 -and $Warnings.Count -eq 0) {
    Write-Host "`n✅ Tout est prêt pour la production !" -ForegroundColor Green
    Write-Host "`nProchaines étapes :" -ForegroundColor Yellow
    Write-Host "  1. Vérifiez la configuration dans docker/.env"
    Write-Host "  2. Modifiez docker/Caddyfile avec votre domaine"
    Write-Host "  3. Lancez : cd docker && docker compose -f docker-compose-prod.yml up -d"
    exit 0
}

if ($Issues.Count -gt 0) {
    Write-Host "`n❌ PROBLÈMES CRITIQUES ($($Issues.Count)) :" -ForegroundColor Red
    $Issues | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    Write-Host ""
}

if ($Warnings.Count -gt 0) {
    Write-Host "⚠️  AVERTISSEMENTS ($($Warnings.Count)) :" -ForegroundColor Yellow
    $Warnings | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    Write-Host ""
}

if ($Issues.Count -gt 0) {
    Write-Host "❌ Des problèmes critiques doivent être résolus avant le déploiement." -ForegroundColor Red
    exit 1
} else {
    Write-Host "⚠️  Des avertissements ont été détectés. Vérifiez-les avant le déploiement." -ForegroundColor Yellow
    exit 0
}

